import { Component, inject, OnInit, signal } from '@angular/core';
import { LearningResourceService } from '../../application/learning-resource.service';
import { LearningResourceRepository } from '../../domain/learning-resource.repository';
import { LearningResourceHttpRepository } from '../../infrastructure/learning-resource-http.repository';
import type {
  LearningResourceFilter,
  DifficultyLevel,
  EnergyLevel,
  ResourceStatus,
} from '../../domain/learning-resource.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  providers: [
    LearningResourceService,
    {
      provide: LearningResourceRepository,
      useClass: LearningResourceHttpRepository,
    },
  ],
  imports: [FormsModule],
})
export class HomeComponent implements OnInit {
  private readonly service = inject(LearningResourceService);

  readonly resources = this.service.resources;
  readonly loading = this.service.loading;
  readonly error = this.service.error;

  readonly difficultyFilter = signal<DifficultyLevel | null>(null);
  readonly energyFilter = signal<EnergyLevel | null>(null);
  readonly statusFilter = signal<ResourceStatus | null>(null);

  difficultyFilterValue: DifficultyLevel | null = null;
  energyFilterValue: EnergyLevel | null = null;
  statusFilterValue: ResourceStatus | null = null;

  readonly difficulties: DifficultyLevel[] = ['Low', 'Medium', 'High'];
  readonly energyLevels: EnergyLevel[] = ['Low', 'Medium', 'High'];
  readonly statuses: ResourceStatus[] = ['Pending', 'InProgress', 'Completed'];

  async ngOnInit(): Promise<void> {
    await this.service.loadAll();
  }

  async applyFilter(): Promise<void> {
    const filter: LearningResourceFilter = {};

    if (this.difficultyFilterValue) filter.difficulty = this.difficultyFilterValue;
    if (this.energyFilterValue) filter.energyLevel = this.energyFilterValue;
    if (this.statusFilterValue) filter.status = this.statusFilterValue;

    const hasFilters = Object.keys(filter).length > 0;
    hasFilters ? await this.service.loadByFilter(filter) : await this.service.loadAll();
  }

  clearFilters(): void {
    this.difficultyFilter.set(null);
    this.energyFilter.set(null);
    this.statusFilter.set(null);
    this.service.loadAll();
  }
}
