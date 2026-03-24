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

  viewMode: 'grid' | 'list' = 'grid';

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

  getStatusClass(status: ResourceStatus): string {
    const base = 'text-xs px-2 py-0.5 rounded-md font-medium shrink-0';
    const map: Record<ResourceStatus, string> = {
      Pending: 'bg-gray-700/50 text-gray-300',
      InProgress: 'bg-blue-500/20 text-blue-300',
      Completed: 'bg-green-500/20 text-green-300',
    };
    return `${base} ${map[status]}`;
  }

  getDifficultyClass(difficulty: DifficultyLevel): string {
    const base = 'text-xs px-2 py-0.5 rounded-md font-medium';
    const map: Record<DifficultyLevel, string> = {
      Low: 'bg-green-500/20 text-green-300',
      Medium: 'bg-yellow-500/20 text-yellow-300',
      High: 'bg-red-500/20 text-red-300',
    };
    return `${base} ${map[difficulty]}`;
  }

  getEnergyClass(energy: EnergyLevel): string {
    const base = 'text-xs px-2 py-0.5 rounded-md font-medium';
    const map: Record<EnergyLevel, string> = {
      Low: 'bg-green-500/10 text-green-400',
      Medium: 'bg-yellow-500/10 text-yellow-400',
      High: 'bg-red-500/10 text-red-400',
    };
    return `${base} ${map[energy]}`;
  }

  clearFilters(): void {
    this.difficultyFilter.set(null);
    this.energyFilter.set(null);
    this.statusFilter.set(null);
    this.service.loadAll();
  }
}
