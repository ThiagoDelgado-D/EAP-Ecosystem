import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { LearningResourceService } from '../../application/learning-resource.service';
import { LearningResourceRepository } from '../../domain/learning-resource.repository';
import { LearningResourceHttpRepository } from '../../infrastructure/learning-resource-http.repository';
import type {
  EnergyLevel,
  LearningResource,
  MentalStateType,
} from '../../domain/learning-resource.model';
import { SystemCheckComponent } from './components/system-check/system-check.component.js';
import { IdealMatchComponent } from './components/ideal-match/ideal-match.component.js';
import { FocusPulseComponent } from './components/focus-pulse/focus-pulse.component.js';
import { PendingTasksComponent } from './components/pending-tasks/pending-tasks.component.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SystemCheckComponent, IdealMatchComponent, FocusPulseComponent, PendingTasksComponent],
  providers: [
    LearningResourceService,
    { provide: LearningResourceRepository, useClass: LearningResourceHttpRepository },
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private readonly resourceService = inject(LearningResourceService);

  readonly selectedEnergy = signal<EnergyLevel>('Medium');
  readonly selectedMentalState = signal<MentalStateType>('deep_focus');

  readonly loading = this.resourceService.loading;
  readonly error = this.resourceService.error;

  readonly idealResource = computed<LearningResource | null>(() => {
    const resources = this.resourceService.resources();
    return resources[0] ?? null;
  });

  async ngOnInit(): Promise<void> {
    await this.applyFilter();
  }

  onEnergyChange(energy: EnergyLevel): void {
    this.selectedEnergy.set(energy);
    this.applyFilter();
  }

  onMentalStateChange(state: MentalStateType): void {
    this.selectedMentalState.set(state);
    this.applyFilter();
  }

  private async applyFilter(): Promise<void> {
    await this.resourceService.loadByFilter({
      energyLevel: this.selectedEnergy(),
      mentalState: this.selectedMentalState(),
      status: 'Pending',
    });
  }
}
