import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { LearningResourceService } from '../../application/learning-resource.service';
import { LearningResourceRepository } from '../../domain/learning-resource.repository';
import { LearningResourceHttpRepository } from '../../infrastructure/learning-resource-http.repository';
import type { EnergyLevel, LearningResource, MentalStateType } from '../../domain/learning-resource.model';
import { LearningPathService } from '@features/learning-path/application/learning-path.service';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import { LearningPathHttpRepository } from '@features/learning-path/infrastructure/learning-path-http.repository';
import { RecommendationService } from '@features/recommendation/application/recommendation.service';
import { RecommendationRepository } from '@features/recommendation/domain/recommendation.repository';
import { RecommendationHttpRepository } from '@features/recommendation/infrastructure/recommendation-http.repository';
import type { EnergyLevel as ApiEnergyLevel, MentalState as ApiMentalState } from '@features/recommendation/domain/recommendation.model';
import { PomodoroRepository } from '@features/pomodoro/domain/pomodoro.repository';
import { PomodoroHttpRepository } from '@features/pomodoro/infrastructure/pomodoro-http.repository';
import { computeWeeklySummary, buildWeekDayLog, summaryWindowSince } from '@features/pomodoro/application/weekly-summary.calculator';
import { AuthStore } from '@features/auth/application/auth.store';
import { TopicService } from '@features/learning-resource/application/topic.service';
import { TopicRepository } from '@features/learning-resource/domain/topic.repository';
import { TopicHttpRepository } from '@features/learning-resource/infrastructure/topic-http.repository';
import { SystemCheckComponent } from './components/system-check/system-check.component.js';
import { IdealMatchComponent } from './components/ideal-match/ideal-match.component.js';
import { ActivePathsComponent } from './components/active-paths/active-paths.component.js';
import { QuickActionsComponent } from './components/quick-actions/quick-actions.component.js';
import { ContinueResourcesComponent } from './components/continue-resources/continue-resources.component.js';
import { KpiRowComponent } from './components/kpi-row/kpi-row.component.js';
import { RecentActivityComponent } from './components/recent-activity/recent-activity.component.js';
import { TopicAttentionComponent } from './components/topic-attention/topic-attention.component.js';

const TO_API_ENERGY_LEVEL: Record<EnergyLevel, ApiEnergyLevel> = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
};

const AVAILABLE_MINUTES_OPTIONS = [15, 25, 45, 60, 90] as const;

function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 6) return 'Late night study';
  if (h < 12) return 'Good morning';
  if (h < 19) return 'Good afternoon';
  return 'Good evening';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    SystemCheckComponent,
    IdealMatchComponent,
    ActivePathsComponent,
    QuickActionsComponent,
    ContinueResourcesComponent,
    KpiRowComponent,
    RecentActivityComponent,
    TopicAttentionComponent,
  ],
  providers: [
    LearningResourceService,
    { provide: LearningResourceRepository, useClass: LearningResourceHttpRepository },
    TopicService,
    { provide: TopicRepository, useClass: TopicHttpRepository },
    LearningPathService,
    { provide: LearningPathRepository, useClass: LearningPathHttpRepository },
    RecommendationService,
    { provide: RecommendationRepository, useClass: RecommendationHttpRepository },
    { provide: PomodoroRepository, useClass: PomodoroHttpRepository },
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private readonly resourceService = inject(LearningResourceService);
  private readonly resourceRepository = inject(LearningResourceRepository);
  private readonly pathService = inject(LearningPathService);
  private readonly recommendationService = inject(RecommendationService);
  private readonly pomodoroRepository = inject(PomodoroRepository);
  private readonly authStore = inject(AuthStore);
  private readonly topicService = inject(TopicService);

  readonly AVAILABLE_MINUTES_OPTIONS = AVAILABLE_MINUTES_OPTIONS;
  readonly displayName = this.authStore.displayName;
  readonly greetingLabel = greeting();

  readonly selectedEnergy = signal<EnergyLevel>('Medium');
  readonly selectedMentalState = signal<MentalStateType>('deep_focus');
  readonly availableMinutes = signal<number>(45);

  readonly loading = this.resourceService.loading;
  readonly error = this.resourceService.error;
  readonly pendingResourceCount = this.resourceService.total;
  readonly hasLoaded = signal(false);

  readonly recommendations = this.recommendationService.recommendations;
  readonly paths = this.pathService.paths;

  readonly topRecommendation = computed(() => this.recommendations()[0] ?? null);
  readonly secondaryRecommendations = computed(() => this.recommendations().slice(1, 4));

  readonly topRecommendationResource = computed<LearningResource | null>(() => {
    const top = this.topRecommendation();
    if (!top?.resourceId) return null;
    return this.resourceService.resources().find((r) => r.id === top.resourceId) ?? null;
  });

  readonly continueResources = signal<LearningResource[]>([]);
  readonly weeklyFocusMinutes = signal<number | null>(null);
  readonly weekDeltaPct = signal<number | null>(null);
  readonly weekDays = signal<{ key: string; label: string; focusMinutes: number; isToday: boolean }[]>([]);
  readonly streakDays = signal(0);
  readonly goalMinutes = 600;
  readonly inProgressCount = signal(0);
  readonly catalogMinutes = signal(0);
  readonly todayMinutes = signal(0);
  readonly todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  readonly recentResources = signal<LearningResource[]>([]);
  readonly topicLoad = signal<{ id: string; name: string; pendingMinutes: number }[]>([]);

  private filterInFlight = false;
  private refreshQueued = false;
  private filterDebounce: ReturnType<typeof setTimeout> | null = null;

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.applyFilter(),
      this.pathService.loadAll(),
      this.topicService.loadAll(),
      this.loadContinueResources(),
      this.loadWeeklyFocus(),
    ]);
    this.deriveCatalogTotals();
  }

  onEnergyChange(energy: EnergyLevel): void {
    this.selectedEnergy.set(energy);
    this.requestFilterRefresh();
  }

  onMentalStateChange(state: MentalStateType): void {
    this.selectedMentalState.set(state);
    this.requestFilterRefresh();
  }

  onAvailableMinutesChange(minutes: number): void {
    this.availableMinutes.set(minutes);
    this.requestFilterRefresh();
  }

  private requestFilterRefresh(): void {
    if (this.filterDebounce) clearTimeout(this.filterDebounce);
    this.filterDebounce = setTimeout(() => {
      this.filterDebounce = null;
      if (this.filterInFlight) {
        this.refreshQueued = true;
        return;
      }
      void this.runFilter();
    }, 180);
  }

  private async runFilter(): Promise<void> {
    this.filterInFlight = true;
    try {
      await this.applyFilter();
      this.deriveCatalogTotals();
    } finally {
      this.filterInFlight = false;
      if (this.refreshQueued) {
        this.refreshQueued = false;
        void this.runFilter();
      }
    }
  }

  private async applyFilter(): Promise<void> {
    await Promise.all([
      this.resourceService.load({
        energyLevel: this.selectedEnergy() ?? undefined,
        mentalState: this.selectedMentalState() ?? undefined,
        status: 'Pending',
        page: 1,
        pageSize: 10,
      }),
      this.recommendationService.refresh({
        energyLevel: TO_API_ENERGY_LEVEL[this.selectedEnergy()],
        mentalState: this.selectedMentalState() as ApiMentalState,
        availableMinutes: this.availableMinutes(),
      }),
    ]);
    this.hasLoaded.set(true);
  }

  private async loadContinueResources(): Promise<void> {
    const inProgress = await this.resourceRepository.getByFilter({ status: 'InProgress' });
    const sorted = [...inProgress].sort((a, b) => {
      const aTime = a.lastViewed?.getTime() ?? 0;
      const bTime = b.lastViewed?.getTime() ?? 0;
      return bTime - aTime;
    });
    this.continueResources.set(sorted.slice(0, 4));
  }

  private async loadWeeklyFocus(): Promise<void> {
    const now = new Date();
    const history = await this.pomodoroRepository.getHistory(summaryWindowSince(now));
    const summary = computeWeeklySummary(history, now);
    this.weeklyFocusMinutes.set(Math.round(summary.thisWeek.focus.totalSec / 60));
    const delta = summary.delta?.focusTotalSec.relativeChange ?? null;
    this.weekDeltaPct.set(delta === null ? null : Math.round(delta * 100));

    const dayLog = buildWeekDayLog(history, now);
    const days = dayLog.map((d) => ({
      key: d.date.toISOString().slice(0, 10),
      label: d.date.toLocaleDateString('en-US', { weekday: 'narrow' }),
      focusMinutes: Math.round(d.focusSec / 60),
      isToday: d.date.toDateString() === now.toDateString(),
    }));
    this.weekDays.set(days);
    this.todayMinutes.set(days.find((d) => d.isToday)?.focusMinutes ?? 0);

    let streak = 0;
    for (let i = days.length - 1; i >= 0; i -= 1) {
      if (days[i]!.focusMinutes > 0) streak += 1;
      else if (days[i]!.isToday) continue;
      else break;
    }
    this.streakDays.set(streak);
  }

  private deriveCatalogTotals(): void {
    const pending = this.resourceService.resources();
    const inProgress = this.continueResources();
    const catalog = pending.reduce((sum, r) => sum + (r.estimatedDuration.value ?? 0), 0);
    this.catalogMinutes.set(Math.round(catalog));
    this.inProgressCount.set(inProgress.length);
    const recent = [...inProgress, ...pending]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 6);
    this.recentResources.set(recent);
    const topics = this.topicService.topics();
    const load = topics
      .map((t) => ({
        id: t.id,
        name: t.name,
        pendingMinutes: Math.round(
          [...pending, ...inProgress]
            .filter((r) => r.topicIds.includes(t.id))
            .reduce((sum, r) => sum + (r.estimatedDuration.value ?? 0), 0),
        ),
      }))
      .filter((t) => t.pendingMinutes > 0)
      .sort((a, b) => b.pendingMinutes - a.pendingMinutes)
      .slice(0, 6);
    this.topicLoad.set(load);
  }
}
