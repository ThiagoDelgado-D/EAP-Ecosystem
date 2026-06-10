import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LearningResourceService } from '../../application/learning-resource.service';
import { LearningResourceRepository } from '../../domain/learning-resource.repository';
import { ResourceTypeRepository } from '../../domain/resource-type.repository';
import { LearningResourceHttpRepository } from '../../infrastructure/learning-resource-http.repository';
import { ResourceTypeHttpRepository } from '../../infrastructure/resource-type-http.repository';
import { ResourceLibraryService } from '../../application/resource-library.service';
import type {
  LearningResource,
  DifficultyLevel,
  EnergyLevel,
  MentalStateType,
  ResourceStatus,
  ResourceQueryParams,
} from '../../domain/learning-resource.model';
import type { ResourceType } from '../../domain/resource-type.model';
import { ResourceTypeService } from '@features/learning-resource/application/resource-type.service.js';
import { ToastService } from '@core/toast/toast.service';
import { EnumBadgeComponent } from '@shared/components/enum-badge/enum-badge.component';
import type { EnumOption } from '@shared/components/enum-badge/enum-badge.types';
import { PaginatorComponent } from '@shared/components/paginator/paginator.component';

export type TabMode = 'all' | 'saved' | 'recent';

const DEFAULT_PAGE_SIZE = 5;
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

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
  imports: [FormsModule, RouterModule, EnumBadgeComponent, PaginatorComponent],
})
export class HomeComponent implements OnInit {
  private readonly service = inject(LearningResourceService);
  private readonly typeService = inject(ResourceTypeService);
  private readonly toastService = inject(ToastService);
  readonly libraryService = inject(ResourceLibraryService);

  readonly allResources = this.service.resources;
  readonly resourceTypes = this.typeService.resourceTypes;
  readonly loading = this.service.loading;
  readonly error = this.service.error;
  readonly currentPage = this.service.currentPage;
  readonly totalPages = this.service.totalPages;
  readonly total = this.service.total;
  private router = inject(Router);

  activeTab = signal<TabMode>('all');
  viewMode = signal<'grid' | 'list'>('grid');
  searchQuery = signal('');
  pageSize = signal(DEFAULT_PAGE_SIZE);

  tabs: { value: TabMode; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'saved', label: 'Saved' },
    { value: 'recent', label: 'Recent' },
  ];

  difficultyFilterValue = signal<DifficultyLevel | null>(null);
  energyFilterValue = signal<EnergyLevel | null>(null);
  statusFilterValue = signal<ResourceStatus | null>(null);
  mentalStateFilterValue = signal<MentalStateType | null>(null);

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

  readonly toggleLoadingId = signal<string | null>(null);

  readonly difficultyOptions: EnumOption<DifficultyLevel>[] = [
    {
      value: 'Low',
      label: 'Low',
      badgeClass: 'bg-emerald-950/60 text-emerald-400',
      dotClass: 'bg-emerald-500',
    },
    {
      value: 'Medium',
      label: 'Medium',
      badgeClass: 'bg-yellow-950/60 text-yellow-400',
      dotClass: 'bg-yellow-500',
    },
    {
      value: 'High',
      label: 'High',
      badgeClass: 'bg-red-950/60 text-red-400',
      dotClass: 'bg-red-500',
    },
  ];

  readonly energyOptions: EnumOption<EnergyLevel>[] = [
    { value: 'Low',    label: 'Low',    badgeClass: 'bg-emerald-950/60 text-emerald-400', dotClass: 'bg-emerald-500' },
    { value: 'Medium', label: 'Medium', badgeClass: 'bg-yellow-950/60 text-yellow-400',  dotClass: 'bg-yellow-500'  },
    { value: 'High',   label: 'High',   badgeClass: 'bg-red-950/60 text-red-400',        dotClass: 'bg-red-500'     },
  ];

  readonly statusOptions: EnumOption<ResourceStatus>[] = [
    {
      value: 'Pending',
      label: 'Pending',
      badgeClass: 'bg-slate-800 text-slate-400',
      dotClass: 'bg-slate-500',
    },
    {
      value: 'InProgress',
      label: 'In Progress',
      badgeClass: 'bg-blue-950/60 text-blue-300',
      dotClass: 'bg-blue-500',
    },
    {
      value: 'Completed',
      label: 'Completed',
      badgeClass: 'bg-emerald-950/60 text-emerald-300',
      dotClass: 'bg-emerald-500',
    },
  ];

  readonly mentalStateOptions: EnumOption<MentalStateType>[] = [
    {
      value: 'deep_focus',
      label: 'Deep Focus',
      badgeClass: 'bg-violet-950/60 text-violet-300',
      dotClass: 'bg-violet-500',
    },
    {
      value: 'light_read',
      label: 'Light Read',
      badgeClass: 'bg-sky-950/60 text-sky-300',
      dotClass: 'bg-sky-500',
    },
    {
      value: 'creative',
      label: 'Creative',
      badgeClass: 'bg-pink-950/60 text-pink-300',
      dotClass: 'bg-pink-500',
    },
    {
      value: 'quick_op',
      label: 'Quick Op',
      badgeClass: 'bg-amber-950/60 text-amber-300',
      dotClass: 'bg-amber-500',
    },
    {
      value: 'review',
      label: 'Review',
      badgeClass: 'bg-slate-800 text-slate-300',
      dotClass: 'bg-slate-400',
    },
  ];

  readonly tabFilteredResources = computed<LearningResource[]>(() => {
    const all = this.allResources();
    switch (this.activeTab()) {
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

  readonly displayedResources = this.tabFilteredResources;

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
        this.difficultyFilterValue() ||
        this.energyFilterValue() ||
        this.statusFilterValue() ||
        this.mentalStateFilterValue() ||
        this.searchQuery().trim()
      ),
  );

  async ngOnInit(): Promise<void> {
    const saved = sessionStorage.getItem('eap:resource-list-params');
    sessionStorage.removeItem('eap:resource-list-params');
    const { page, pageSize } = saved ? JSON.parse(saved) : { page: 1, pageSize: DEFAULT_PAGE_SIZE };
    if (pageSize !== DEFAULT_PAGE_SIZE) this.pageSize.set(pageSize);
    await Promise.all([
      this.service.load({ page, pageSize }),
      this.typeService.loadAll(),
    ]);
  }

  setTab(tab: TabMode): void {
    this.activeTab.set(tab);
  }

  private buildCurrentParams(): ResourceQueryParams {
    const params: ResourceQueryParams = { page: this.service.currentPage(), pageSize: this.pageSize() };
    if (this.difficultyFilterValue()) params.difficulty = this.difficultyFilterValue()!;
    if (this.energyFilterValue()) params.energyLevel = this.energyFilterValue()!;
    if (this.statusFilterValue()) params.status = this.statusFilterValue()!;
    if (this.mentalStateFilterValue()) params.mentalState = this.mentalStateFilterValue()!;
    if (this.searchQuery().trim()) params.q = this.searchQuery().trim();
    return params;
  }

  async applyFilter(): Promise<void> {
    const params: ResourceQueryParams = { page: 1, pageSize: this.pageSize() };
    if (this.difficultyFilterValue()) params.difficulty = this.difficultyFilterValue()!;
    if (this.energyFilterValue()) params.energyLevel = this.energyFilterValue()!;
    if (this.statusFilterValue()) params.status = this.statusFilterValue()!;
    if (this.mentalStateFilterValue()) params.mentalState = this.mentalStateFilterValue()!;
    if (this.searchQuery().trim()) params.q = this.searchQuery().trim();
    await this.service.load(params);
  }

  async clearSearch(): Promise<void> {
    this.searchQuery.set('');
    await this.applyFilter();
  }

  async clearFilters(): Promise<void> {
    this.difficultyFilterValue.set(null);
    this.energyFilterValue.set(null);
    this.statusFilterValue.set(null);
    this.mentalStateFilterValue.set(null);
    this.searchQuery.set('');
    await this.service.load({ page: 1, pageSize: this.pageSize() });
  }

  async onPageSizeChange(size: number): Promise<void> {
    this.pageSize.set(size);
    await this.service.load({ ...this.buildCurrentParams(), page: 1, pageSize: size });
  }

  async goToPage(page: number): Promise<void> {
    const current = this.buildCurrentParams();
    await this.service.load({ ...current, page });
  }

  onCardClick(resource: LearningResource): void {
    this.libraryService.trackRecent(resource.id);
    sessionStorage.setItem(
      'eap:resource-list-params',
      JSON.stringify({ page: this.service.currentPage(), pageSize: this.pageSize() }),
    );
    this.router.navigate(['/resources', resource.id]);
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

  async onToggle(
    value: string,
    resource: LearningResource,
    field: 'difficulty' | 'energy' | 'status',
  ): Promise<void> {
    const key = `${resource.id}:${field}`;
    this.toggleLoadingId.set(key);
    try {
      if (field === 'difficulty') {
        await this.service.toggleDifficulty(resource.id, value as DifficultyLevel);
      } else if (field === 'energy') {
        await this.service.toggleEnergy(resource.id, value as EnergyLevel);
      } else if (field === 'status') {
        await this.service.toggleStatus(resource.id, value as ResourceStatus);
      }
    } catch {
      this.toastService.show(`Failed to update ${field}`, 'error');
    } finally {
      this.toggleLoadingId.set(null);
    }
  }
}
