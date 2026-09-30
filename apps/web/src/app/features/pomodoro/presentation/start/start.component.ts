import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { PomodoroRepository } from '@features/pomodoro/domain/pomodoro.repository';
import {
  buildWeekDayLog,
  computeWeeklySummary,
  summaryWindowSince,
} from '@features/pomodoro/application/weekly-summary.calculator';
import { CounterComponent } from '@shared/components/counter/counter.component';
import { RevealDirective } from '@shared/components/reveal/reveal.directive';
import { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import { PomodoroOverlayHostService } from '@features/pomodoro/application/pomodoro-overlay-host.service';
import {
  POMODORO_VIEW_MODE,
  readDefaultDurationMin,
  readDefaultViewMode,
  readHideShortcutHints,
} from '@features/pomodoro/application/pomodoro-view-preferences';
import {
  PomodoroZenViewComponent,
  POMODORO_ZEN_KEY,
} from '@features/pomodoro/presentation/zen-view/pomodoro-zen-view.component';
import { BrowsePickerDialogComponent } from '@features/pomodoro/presentation/browse-picker/browse-picker-dialog.component';
import { PomodoroRingComponent } from '@features/pomodoro/presentation/pomodoro-ring/pomodoro-ring.component';
import {
  DURATION_PRESETS,
  MAX_PLANNED_DURATION_MIN,
  SEGMENT_TARGET_KIND,
  type SegmentTarget,
  type SuggestedCandidate,
} from '@features/pomodoro/domain/pomodoro.model';
import { describeTargetLabel, type TargetLabel } from './target-description';

function formatMinutesClock(minutes: number): string {
  return `${String(minutes).padStart(2, '0')}:00`;
}

@Component({
  selector: 'app-pomodoro-start',
  standalone: true,
  imports: [FormsModule, PomodoroRingComponent, CounterComponent, RevealDirective],
  templateUrl: './start.component.html',
})
export class StartComponent {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly overlayHost = inject(PomodoroOverlayHostService);
  readonly store = inject(PomodoroSessionStore);
  readonly picker = inject(PomodoroPickerService);
  private readonly historyRepository = inject(PomodoroRepository);

  readonly Math = Math;

  readonly DURATION_PRESETS = DURATION_PRESETS;
  readonly MAX_PLANNED_DURATION_MIN = MAX_PLANNED_DURATION_MIN;
  readonly maxDurationDigits = String(MAX_PLANNED_DURATION_MIN).length;

  readonly selectedDuration = signal<number>(readDefaultDurationMin());
  readonly customDurationInput = signal('');
  readonly intent = signal('');
  readonly showIntentInput = signal(false);

  readonly selectedTarget = signal<SegmentTarget | null>(null);
  readonly selectedTargetLabel = signal<TargetLabel | null>(null);
  readonly moreMenuOpen = signal(false);
  readonly startMenuOpen = signal(false);
  readonly hideShortcutHints = signal(readHideShortcutHints());

  readonly durationClock = computed(() => formatMinutesClock(this.selectedDuration()));
  readonly isCustomDurationActive = computed(() => !DURATION_PRESETS.includes(this.selectedDuration()));
  readonly effectiveTarget = computed<SegmentTarget>(() => this.selectedTarget() ?? { kind: SEGMENT_TARGET_KIND.FREE });
  readonly hasAttachedMaterial = computed(() => this.selectedTarget() !== null);
  readonly canStart = computed(() => this.selectedDuration() > 0);
  readonly canOfferIntention = computed(() => !this.showIntentInput() && !this.intent());
  readonly hasMoreActions = computed(() => !this.hasAttachedMaterial() || this.canOfferIntention());
  readonly topSuggestion = computed<SuggestedCandidate | null>(() => this.store.suggestions()[0] ?? null);
  readonly canSuggestQuickStart = computed(() => !this.hasAttachedMaterial() && this.topSuggestion() !== null);

  readonly goalMinutes = 600;
  readonly weekDays = signal<
    { key: string; label: string; focusMinutes: number; sessions: number; isToday: boolean }[]
  >([]);
  readonly weekTotalMinutes = signal(0);
  readonly weekDeltaPct = signal<number | null>(null);
  readonly todaySessions = signal<
    { id: string; startedAt: Date; plannedMin: number; focusMin: number; done: boolean; active: boolean }[]
  >([]);
  readonly todayMinutes = signal(0);

  readonly maxWeekDay = computed(() =>
    Math.max(this.goalMinutes / 5, ...this.weekDays().map((d) => d.focusMinutes), 30),
  );
  readonly primaryStartLabel = computed(() =>
    this.hasAttachedMaterial() ? this.selectedTargetLabel()?.title ?? 'Start' : 'Start free focus',
  );

  constructor() {
    void this.picker.load();
    void this.store.loadSuggestions();
    void this.loadContext();
  }

  private async loadContext(): Promise<void> {
    const now = new Date();
    try {
      const history = await this.historyRepository.getHistory(summaryWindowSince(now));
      const summary = computeWeeklySummary(history, now);
      this.weekTotalMinutes.set(Math.round(summary.thisWeek.focus.totalSec / 60));
      const delta = summary.delta?.focusTotalSec.relativeChange ?? null;
      this.weekDeltaPct.set(delta === null ? null : Math.round(delta * 100));

      const dayLog = buildWeekDayLog(history, now);
      this.weekDays.set(
        dayLog.map((d) => ({
          key: d.date.toISOString().slice(0, 10),
          label: d.date.toLocaleDateString('en-US', { weekday: 'narrow' }),
          focusMinutes: Math.round(d.focusSec / 60),
          sessions: d.sessionCount,
          isToday: d.date.toDateString() === now.toDateString(),
        })),
      );

      const segmentsBySession = new Map<string, number>();
      for (const segment of history.segments) {
        const duration = Math.max(0, (segment.endSec ?? segment.startSec) - segment.startSec);
        segmentsBySession.set(segment.sessionId, (segmentsBySession.get(segment.sessionId) ?? 0) + duration);
      }
      const todayRows = history.sessions
        .filter((s) => s.startedAt.toDateString() === now.toDateString())
        .map((s) => ({
          id: s.id,
          startedAt: s.startedAt,
          plannedMin: s.plannedMin,
          focusMin: Math.round((segmentsBySession.get(s.id) ?? 0) / 60),
          done: !!s.completedAt,
          active: !s.completedAt,
        }))
        .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
      this.todaySessions.set(todayRows);
      this.todayMinutes.set(todayRows.reduce((sum, r) => sum + r.focusMin, 0));
    } catch {
      // context panels stay empty — the timer flow is unaffected
    }
  }

  dayBarColor(minutes: number): string {
    if (minutes === 0) return 'var(--color-line-strong)';
    return minutes >= this.goalMinutes / 5
      ? 'var(--color-accent)'
      : 'var(--tone-ochre, var(--color-accent))';
  }

  sessionTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;
    if (!this.canStart() || this.store.starting()) return;
    const target = event.target as HTMLElement | null;
    if (target?.tagName === 'BUTTON' || target?.tagName === 'A' || target?.tagName === 'INPUT') return;

    event.preventDefault();
    void this.start();
  }

  @HostListener('document:click')
  closeMoreMenu(): void {
    this.moreMenuOpen.set(false);
    this.startMenuOpen.set(false);
  }

  toggleMoreMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.moreMenuOpen.update((v) => !v);
  }

  toggleStartMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.startMenuOpen.update((v) => !v);
  }

  pickDuration(minutes: number): void {
    this.selectedDuration.set(minutes);
    this.customDurationInput.set('');
  }

  onCustomDurationInput(value: string): void {
    this.customDurationInput.set(value.replace(/\D/g, ''));
    this.applyCustomDuration();
  }

  applyCustomDuration(): void {
    const raw = this.customDurationInput().trim();
    if (raw === '') return;
    const minutes = Number(raw);
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    this.selectedDuration.set(Math.min(MAX_PLANNED_DURATION_MIN, Math.round(minutes)));
  }

  toggleIntentInput(): void {
    this.showIntentInput.set(true);
  }

  chooseAddIntention(): void {
    this.moreMenuOpen.set(false);
    this.toggleIntentInput();
  }

  async chooseAttachMaterial(): Promise<void> {
    this.moreMenuOpen.set(false);
    await this.openAttachDialog();
  }

  async openAttachDialog(): Promise<void> {
    const previous = this.selectedTarget();
    const dialogRef = this.dialog.open(BrowsePickerDialogComponent, {
      panelClass: 'confirm-dark-dialog',
      autoFocus: '#switch-material-search',
      data: previous ? { target: previous, label: this.selectedTargetLabel() } : null,
    });
    const target = await firstValueFrom(dialogRef.afterClosed());
    if (!target) return;
    this.selectedTarget.set(target);
    this.selectedTargetLabel.set(describeTargetLabel(target, this.picker.allPaths(), this.picker.library()));
  }

  clearAttachedMaterial(): void {
    this.selectedTarget.set(null);
    this.selectedTargetLabel.set(null);
  }

  async choosePrimaryStart(): Promise<void> {
    this.startMenuOpen.set(false);
    await this.start();
  }

  async chooseStartSuggested(): Promise<void> {
    const suggestion = this.topSuggestion();
    if (!suggestion) return;
    this.startMenuOpen.set(false);
    this.selectedTarget.set({
      kind: SEGMENT_TARGET_KIND.NODE,
      learningPathId: suggestion.pathId,
      learningPathNodeId: suggestion.nodeId,
      resourceId: suggestion.resourceId,
    });
    this.selectedTargetLabel.set({ title: suggestion.nodeTitle, subtitle: suggestion.pathTitle });
    await this.start();
  }

  async start(): Promise<void> {
    if (!this.canStart()) return;
    const session = await this.store.start({
      plannedMin: this.selectedDuration(),
      target: this.effectiveTarget(),
      intent: this.intent().trim() || undefined,
    });
    if (session) this.enterDefaultView();
  }

  private enterDefaultView(): void {
    const mode = readDefaultViewMode();
    if (mode === POMODORO_VIEW_MODE.MINI) {
      void this.router.navigateByUrl('/dashboard');
      return;
    }
    void this.router.navigateByUrl('/pomodoro/active');
    if (mode === POMODORO_VIEW_MODE.ZEN) {
      this.overlayHost.show(POMODORO_ZEN_KEY, PomodoroZenViewComponent, 'fullscreen');
    }
  }
}
