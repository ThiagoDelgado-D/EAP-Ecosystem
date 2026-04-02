import { Component, inject, OnInit } from '@angular/core';
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
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  providers: [
    LearningResourceService,
    { provide: LearningResourceRepository, useClass: LearningResourceHttpRepository },
  ],
  imports: [FormsModule, RouterModule],
})
export class HomeComponent implements OnInit {
  private readonly service = inject(LearningResourceService);

  readonly resources = this.service.resources;
  readonly loading = this.service.loading;
  readonly error = this.service.error;

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
    if (hasFilters) {
      await this.service.loadByFilter(filter);
    } else {
      await this.service.loadAll();
    }
  }

  async clearFilters(): Promise<void> {
    this.difficultyFilterValue = null;
    this.energyFilterValue = null;
    this.statusFilterValue = null;
    await this.service.loadAll();
  }

  getStatusClass(status: ResourceStatus): string {
    const base = 'text-xs px-2 py-0.5 rounded-md font-medium shrink-0';
    const map: Record<ResourceStatus, string> = {
      Pending: 'bg-slate-800 text-slate-300',
      InProgress: 'bg-blue-950/60 text-blue-300',
      Completed: 'bg-emerald-950/60 text-emerald-300',
    };
    return `${base} ${map[status]}`;
  }

  getDifficultyClass(difficulty: DifficultyLevel): string {
    const base = 'text-xs px-2 py-0.5 rounded-md font-medium';
    const map: Record<DifficultyLevel, string> = {
      Low: 'bg-emerald-950/60 text-emerald-300',
      Medium: 'bg-yellow-950/60 text-yellow-300',
      High: 'bg-red-950/60 text-red-300',
    };
    return `${base} ${map[difficulty]}`;
  }

  getEnergyClass(energy: EnergyLevel): string {
    const base = 'text-xs px-2 py-0.5 rounded-md font-medium';
    const map: Record<EnergyLevel, string> = {
      Low: 'bg-emerald-950/60 text-emerald-300',
      Medium: 'bg-yellow-950/60 text-yellow-300',
      High: 'bg-red-950/60 text-red-300',
    };
    return `${base} ${map[energy]}`;
  }
}
