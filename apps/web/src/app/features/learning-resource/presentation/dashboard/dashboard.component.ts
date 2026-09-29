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
import { SystemCheckComponent } from './components/system-check/system-check.component.js';
import { IdealMatchComponent } from './components/ideal-match/ideal-match.component.js';
import { ActivePathsComponent } from './components/active-paths/active-paths.component.js';

const TO_API_ENERGY_LEVEL: Record<EnergyLevel, ApiEnergyLevel> = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SystemCheckComponent, IdealMatchComponent, ActivePathsComponent],
  providers: [
    LearningResourceService,
    { provide: LearningResourceRepository, useClass: LearningResourceHttpRepository },
    LearningPathService,
    { provide: LearningPathRepository, useClass: LearningPathHttpRepository },
    RecommendationService,
    { provide: RecommendationRepository, useClass: RecommendationHttpRepository },
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private readonly resourceService = inject(LearningResourceService);
  private readonly pathService = inject(LearningPathService);
  private readonly recommendationService = inject(RecommendationService);

  readonly selectedEnergy = signal<EnergyLevel>('Medium');
  readonly selectedMentalState = signal<MentalStateType>('deep_focus');

  readonly loading = this.resourceService.loading;
  readonly error = this.resourceService.error;

  readonly recommendations = this.recommendationService.recommendations;
  readonly paths = this.pathService.paths;

  readonly topRecommendation = computed(() => this.recommendations()[0] ?? null);

  readonly topRecommendationResource = computed<LearningResource | null>(() => {
    const top = this.topRecommendation();
    if (!top?.resourceId) return null;
    return this.resourceService.resources().find((r) => r.id === top.resourceId) ?? null;
  });

  private filterInFlight = false;
  private refreshQueued = false;

  async ngOnInit(): Promise<void> {
    await Promise.all([this.applyFilter(), this.pathService.loadAll()]);
  }

  onEnergyChange(energy: EnergyLevel): void {
    this.selectedEnergy.set(energy);
    this.requestFilterRefresh();
  }

  onMentalStateChange(state: MentalStateType): void {
    this.selectedMentalState.set(state);
    this.requestFilterRefresh();
  }

  private requestFilterRefresh(): void {
    if (this.filterInFlight) {
      this.refreshQueued = true;
      return;
    }
    void this.runFilter();
  }

  private async runFilter(): Promise<void> {
    this.filterInFlight = true;
    try {
      await this.applyFilter();
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
      }),
    ]);
  }
}
