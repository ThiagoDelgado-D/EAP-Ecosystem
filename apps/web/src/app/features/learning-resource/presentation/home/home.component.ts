import { Component, inject, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LearningResourceService } from '../../application/learning-resource.service';
import { LearningResourceRepository } from '../../domain/learning-resource.repository';
import { ResourceTypeRepository } from '../../domain/resource-type.repository';
import { LearningResourceHttpRepository } from '../../infrastructure/learning-resource-http.repository';
import { ResourceTypeHttpRepository } from '../../infrastructure/resource-type-http.repository';
import { ResourceLibraryService } from '../../application/resource-library.service';
import type {
  LearningResource,
  LearningResourceFilter,
  DifficultyLevel,
  EnergyLevel,
  MentalStateType,
  ResourceStatus,
} from '../../domain/learning-resource.model';
import type { ResourceType } from '../../domain/resource-type.model';
import { ResourceTypeService } from '@features/learning-resource/application/resource-type.service.js';
import { CommonModule } from '@angular/common';

export type TabMode = 'all' | 'saved' | 'recent';

const TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  video: { label: 'Video', icon: 'video', color: 'bg-violet-950/70 text-violet-400' },
  article: { label: 'Article', icon: 'article', color: 'bg-sky-950/70 text-sky-400' },
  book: { label: 'Book', icon: 'book', color: 'bg-amber-950/70 text-amber-400' },
  course: { label: 'Course', icon: 'course', color: 'bg-emerald-950/70 text-emerald-400' },
  audio: { label: 'Audio', icon: 'audio', color: 'bg-pink-950/70 text-pink-400' },
  document: { label: 'Document', icon: 'document', color: 'bg-slate-800 text-slate-400' },
  toolkit: { label: 'Toolkit', icon: 'toolkit', color: 'bg-orange-950/70 text-orange-400' },
};

const FALLBACK_TYPE_META = {
  label: 'Resource',
  icon: 'document',
  color: 'bg-slate-800 text-slate-400',
};

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  providers: [
    LearningResourceService,
    ResourceTypeService,
    { provide: LearningResourceRepository, useClass: LearningResourceHttpRepository },
    { provide: ResourceTypeRepository, useClass: ResourceTypeHttpRepository },
  ],
  imports: [CommonModule, FormsModule, RouterModule],
})
export class HomeComponent implements OnInit {
  private readonly service = inject(LearningResourceService);
  private readonly typeService = inject(ResourceTypeService);
  readonly libraryService = inject(ResourceLibraryService);

  readonly allResources = this.service.resources;
  readonly resourceTypes = this.typeService.resourceTypes;
  readonly loading = this.service.loading;
  readonly error = this.service.error;

  activeTab: TabMode = 'all';
  viewMode: 'grid' | 'list' = 'grid';
  searchQuery = '';

  tabs: { value: TabMode; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'saved', label: 'Saved' },
    { value: 'recent', label: 'Recent' },
  ];

  difficultyFilterValue: DifficultyLevel | null = null;
  energyFilterValue: EnergyLevel | null = null;
  statusFilterValue: ResourceStatus | null = null;
  mentalStateFilterValue: MentalStateType | null = null;

  readonly difficulties: DifficultyLevel[] = ['Low', 'Medium', 'High'];
  readonly energyLevels: EnergyLevel[] = ['Low', 'Medium', 'High'];
  readonly statuses: ResourceStatus[] = ['Pending', 'InProgress', 'Completed'];
  readonly mentalStates: { value: MentalStateType; label: string }[] = [
    { value: 'deep_focus', label: 'Deep Focus' },
    { value: 'light_read', label: 'Light Read' },
    { value: 'creative', label: 'Creative' },
    { value: 'quick_op', label: 'Quick Op' },
    { value: 'review', label: 'Review' },
  ];

  readonly tabFilteredResources = computed<LearningResource[]>(() => {
    const all = this.allResources();
    switch (this.activeTab) {
      case 'saved':
        return all.filter((r) => this.libraryService.isSaved(r.id));
      case 'recent': {
        const ids = this.libraryService.recentIds();
        return ids
          .map((id) => all.find((r) => r.id === id))
          .filter((r): r is LearningResource => r !== undefined);
      }
      default:
        return all;
    }
  });

  readonly displayedResources = computed<LearningResource[]>(() => {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.tabFilteredResources();
    return this.tabFilteredResources().filter((r) => r.title.toLowerCase().includes(q));
  });

  readonly pulseStats = computed(() => {
    const all = this.allResources();
    if (!all.length) return null;

    const completed = all.filter((r) => r.status === 'Completed').length;
    const inProgress = all.filter((r) => r.status === 'InProgress').length;
    const pending = all.filter((r) => r.status === 'Pending').length;
    const pct = Math.round((completed / all.length) * 100);

    let label: string;
    if (pct >= 75) label = 'Peak Phase';
    else if (pct >= 40) label = 'Ready';
    else label = 'Building';

    return { completed, inProgress, pending, total: all.length, pct, label };
  });

  readonly hasActiveFilters = computed(
    () =>
      !!(
        this.difficultyFilterValue ||
        this.energyFilterValue ||
        this.statusFilterValue ||
        this.mentalStateFilterValue
      ),
  );

  async ngOnInit(): Promise<void> {
    await Promise.all([this.service.loadAll(), this.typeService.loadAll()]);
  }

  // ─── Tab ──────────────────────────────────────────────────────────────────
  setTab(tab: TabMode): void {
    this.activeTab = tab;
  }

  async applyFilter(): Promise<void> {
    const filter: LearningResourceFilter = {};
    if (this.difficultyFilterValue) filter.difficulty = this.difficultyFilterValue;
    if (this.energyFilterValue) filter.energyLevel = this.energyFilterValue;
    if (this.statusFilterValue) filter.status = this.statusFilterValue;
    if (this.mentalStateFilterValue) filter.mentalState = this.mentalStateFilterValue;

    if (Object.keys(filter).length > 0) {
      await this.service.loadByFilter(filter);
    } else {
      await this.service.loadAll();
    }
  }

  async clearFilters(): Promise<void> {
    this.difficultyFilterValue = null;
    this.energyFilterValue = null;
    this.statusFilterValue = null;
    this.mentalStateFilterValue = null;
    await this.service.loadAll();
  }

  onCardClick(resource: LearningResource): void {
    this.libraryService.trackRecent(resource.id);
    if (resource.url) window.open(resource.url, '_blank', 'noopener,noreferrer');
  }

  toggleSaved(event: Event, id: string): void {
    event.stopPropagation();
    this.libraryService.toggleSaved(id);
  }

  getTypeMeta(typeId: string): { label: string; icon: string; color: string } {
    const type = this.resourceTypes().find((t: ResourceType) => t.id === typeId);
    if (!type) return FALLBACK_TYPE_META;
    return TYPE_META[type.code.toLowerCase()] ?? { ...FALLBACK_TYPE_META, label: type.displayName };
  }

  getStatusClass(status: ResourceStatus): string {
    const base = 'text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide shrink-0';
    const map: Record<ResourceStatus, string> = {
      Pending: 'bg-slate-800 text-slate-400',
      InProgress: 'bg-blue-950/60 text-blue-300',
      Completed: 'bg-emerald-950/60 text-emerald-300',
    };
    return `${base} ${map[status]}`;
  }

  getDifficultyClass(difficulty: DifficultyLevel): string {
    const base = 'text-[10px] px-1.5 py-0.5 rounded font-medium';
    const map: Record<DifficultyLevel, string> = {
      Low: 'bg-emerald-950/60 text-emerald-400',
      Medium: 'bg-yellow-950/60 text-yellow-400',
      High: 'bg-red-950/60 text-red-400',
    };
    return `${base} ${map[difficulty]}`;
  }

  getEnergyClass(energy: EnergyLevel): string {
    const base = 'text-[10px] px-1.5 py-0.5 rounded font-medium';
    const map: Record<EnergyLevel, string> = {
      Low: 'bg-emerald-950/60 text-emerald-400',
      Medium: 'bg-yellow-950/60 text-yellow-400',
      High: 'bg-red-950/60 text-red-400',
    };
    return `${base} ${map[energy]}`;
  }
}
