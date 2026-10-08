import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '@core/config/api.config';
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
  ResourceSort,
} from '../../domain/learning-resource.model';
import type { ResourceType } from '../../domain/resource-type.model';
import { ResourceTypeService } from '@features/learning-resource/application/resource-type.service.js';
import { TopicService } from '@features/learning-resource/application/topic.service.js';
import { TopicRepository } from '@features/learning-resource/domain/topic.repository.js';
import { TopicHttpRepository } from '@features/learning-resource/infrastructure/topic-http.repository.js';
import { RevealDirective } from '@shared/components/reveal/reveal.directive';
import { ToastService } from '@core/toast/toast.service';
import { EnumBadgeComponent } from '@shared/components/enum-badge/enum-badge.component';
import { PaginatorComponent } from '@shared/components/paginator/paginator.component';
import {
  DIFFICULTY_BADGE_OPTIONS,
  ENERGY_BADGE_OPTIONS,
  STATUS_BADGE_OPTIONS,
  MENTAL_STATE_BADGE_OPTIONS,
} from '@shared/components/enum-badge/enum-badge-options';
import {
  DIFFICULTY_LEVELS,
  ENERGY_LEVELS,
  RESOURCE_STATUSES,
  RESOURCE_STATUS_LABELS,
  MENTAL_STATE_TYPES,
  MENTAL_STATE_LABELS,
  RESOURCE_SORTS,
  RESOURCE_SORT_LABELS,
  DEFAULT_RESOURCE_SORT,
} from '@features/learning-resource/domain/learning-resource.constants';

export type TabMode = 'all' | 'saved' | 'recent';

const LIST_PARAMS_STORAGE_KEY = 'eap:resource-list-params';

interface SavedLibraryState {
  page?: number;
  pageSize?: number;
  difficulty?: DifficultyLevel | null;
  energyLevel?: EnergyLevel | null;
  status?: ResourceStatus | null;
  mentalState?: MentalStateType | null;
  resourceTypeId?: string | null;
  topicId?: string | null;
  sort?: ResourceSort;
  q?: string;
}

const DEFAULT_PAGE_SIZE = 5;

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

const TYPE_TONE: Record<string, string> = {
  video: 'info',
  article: 'pine',
  book: 'ochre',
  course: 'ember',
  audio: 'plum',
  document: 'slate',
  toolkit: 'info',
};

const TYPE_GLYPH: Record<string, string> = {
  video: '▶',
  article: '¶',
  book: '❡',
  course: '≡',
  audio: '◍',
  document: '{}',
  toolkit: '⑂',
};

const STATUS_TONE: Record<ResourceStatus, string> = {
  Pending: 'slate',
  InProgress: 'ochre',
  Completed: 'pine',
};

const DIFFICULTY_TONE: Record<DifficultyLevel, string> = {
  Low: 'pine',
  Medium: 'ochre',
  High: 'ember',
};

const ENERGY_TONE: Record<EnergyLevel, string> = {
  Low: 'info',
  Medium: 'ochre',
  High: 'ember',
};

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  providers: [
    LearningResourceService,
    ResourceTypeService,
    TopicService,
    { provide: LearningResourceRepository, useClass: LearningResourceHttpRepository },
    { provide: ResourceTypeRepository, useClass: ResourceTypeHttpRepository },
    { provide: TopicRepository, useClass: TopicHttpRepository },
  ],
  imports: [FormsModule, RouterModule, EnumBadgeComponent, PaginatorComponent, RevealDirective],
})
export class HomeComponent implements OnInit {
  private readonly service = inject(LearningResourceService);
  private readonly typeService = inject(ResourceTypeService);
  private readonly topicService = inject(TopicService);
  private readonly toastService = inject(ToastService);
  private readonly http = inject(HttpClient);
  readonly libraryService = inject(ResourceLibraryService);

  readonly allResources = this.service.resources;
  readonly resourceTypes = this.typeService.resourceTypes;
  readonly topics = this.topicService.topics;
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
  readonly suggestions = signal<string[]>([]);

  tabs: { value: TabMode; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'saved', label: 'Saved' },
    { value: 'recent', label: 'Recent' },
  ];

  difficultyFilterValue = signal<DifficultyLevel | null>(null);
  energyFilterValue = signal<EnergyLevel | null>(null);
  statusFilterValue = signal<ResourceStatus | null>(null);
  mentalStateFilterValue = signal<MentalStateType | null>(null);
  typeFilterValue = signal<string | null>(null);
  topicFilterValue = signal<string | null>(null);
  sortValue = signal<ResourceSort>(DEFAULT_RESOURCE_SORT);

  readonly difficulties: readonly DifficultyLevel[] = DIFFICULTY_LEVELS;
  readonly energyLevels: readonly EnergyLevel[] = ENERGY_LEVELS;
  readonly statuses: readonly ResourceStatus[] = RESOURCE_STATUSES;
  readonly sortOptions: { value: ResourceSort; label: string }[] = RESOURCE_SORTS.map((value) => ({
    value,
    label: RESOURCE_SORT_LABELS[value],
  }));
  readonly mentalStates: { value: MentalStateType; label: string }[] = MENTAL_STATE_TYPES.map(
    (value) => ({ value, label: MENTAL_STATE_LABELS[value] }),
  );

  readonly toggleLoadingId = signal<string | null>(null);
  private suggestionsSeq = 0;

  readonly STATUS_TONE = STATUS_TONE;
  readonly DIFFICULTY_TONE = DIFFICULTY_TONE;
  readonly ENERGY_TONE = ENERGY_TONE;
  readonly STATUS_LABELS = RESOURCE_STATUS_LABELS;

  readonly difficultyOptions = DIFFICULTY_BADGE_OPTIONS;
  readonly energyOptions = ENERGY_BADGE_OPTIONS;
  readonly statusOptions = STATUS_BADGE_OPTIONS;
  readonly mentalStateOptions = MENTAL_STATE_BADGE_OPTIONS;

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

  readonly statusCounts = computed(() => {
    const all = this.allResources();
    if (!all.length) return null;

    const completed = all.filter((r) => r.status === 'Completed').length;
    const inProgress = all.filter((r) => r.status === 'InProgress').length;
    const pending = all.filter((r) => r.status === 'Pending').length;

    return { completed, inProgress, pending };
  });

  readonly hasActiveFilters = computed(
    () =>
      !!(
        this.difficultyFilterValue() ||
        this.energyFilterValue() ||
        this.statusFilterValue() ||
        this.mentalStateFilterValue() ||
        this.typeFilterValue() ||
        this.topicFilterValue() ||
        this.sortValue() !== DEFAULT_RESOURCE_SORT ||
        this.searchQuery().trim()
      ),
  );

  async ngOnInit(): Promise<void> {
    const page = this.restoreSavedPage();
    await Promise.all([
      this.service.load(this.buildParams(page)),
      this.typeService.loadAll(),
      this.topicService.loadAll(),
    ]);
  }

  private restoreSavedPage(): number {
    const saved = sessionStorage.getItem(LIST_PARAMS_STORAGE_KEY);
    sessionStorage.removeItem(LIST_PARAMS_STORAGE_KEY);
    if (!saved) return 1;
    try {
      const state: SavedLibraryState = JSON.parse(saved);
      this.applySavedFilters(state);
      return state.page ?? 1;
    } catch {
      return 1;
    }
  }

  private applySavedFilters(state: SavedLibraryState): void {
    if (state.pageSize) this.pageSize.set(state.pageSize);
    if (state.difficulty) this.difficultyFilterValue.set(state.difficulty);
    if (state.energyLevel) this.energyFilterValue.set(state.energyLevel);
    if (state.status) this.statusFilterValue.set(state.status);
    if (state.mentalState) this.mentalStateFilterValue.set(state.mentalState);
    if (state.resourceTypeId) this.typeFilterValue.set(state.resourceTypeId);
    if (state.topicId) this.topicFilterValue.set(state.topicId);
    if (state.sort && RESOURCE_SORTS.includes(state.sort)) this.sortValue.set(state.sort);
    if (state.q) this.searchQuery.set(state.q);
  }

  setTab(tab: TabMode): void {
    this.activeTab.set(tab);
  }

  private buildParams(page: number): ResourceQueryParams {
    const params: ResourceQueryParams = { page, pageSize: this.pageSize() };
    if (this.difficultyFilterValue()) params.difficulty = this.difficultyFilterValue()!;
    if (this.energyFilterValue()) params.energyLevel = this.energyFilterValue()!;
    if (this.statusFilterValue()) params.status = this.statusFilterValue()!;
    if (this.mentalStateFilterValue()) params.mentalState = this.mentalStateFilterValue()!;
    if (this.typeFilterValue()) params.resourceTypeId = this.typeFilterValue()!;
    if (this.topicFilterValue()) params.topicIds = [this.topicFilterValue()!];
    if (this.sortValue() !== DEFAULT_RESOURCE_SORT) params.sort = this.sortValue();
    if (this.searchQuery().trim()) params.q = this.searchQuery().trim();
    return params;
  }

  private buildCurrentParams(): ResourceQueryParams {
    return this.buildParams(this.service.currentPage());
  }

  async applyFilter(): Promise<void> {
    const params = this.buildParams(1);
    await this.service.load(params);

    if (this.service.total() === 0 && params.q) {
      const seq = ++this.suggestionsSeq;
      try {
        const result = await firstValueFrom(
          this.http.get<{ suggestions: string[] }>(
            `${API_CONFIG.baseUrl}/learning-resources/suggestions`,
            { params: { q: params.q } },
          ),
        );
        if (seq === this.suggestionsSeq) {
          this.suggestions.set(result.suggestions);
        }
      } catch {
        if (seq === this.suggestionsSeq) {
          this.suggestions.set([]);
        }
      }
    } else {
      this.suggestions.set([]);
    }
  }

  async applySuggestion(suggestion: string): Promise<void> {
    this.searchQuery.set(suggestion);
    this.suggestions.set([]);
    await this.applyFilter();
  }

  async clearSearch(): Promise<void> {
    this.searchQuery.set('');
    this.suggestions.set([]);
    await this.applyFilter();
  }

  async clearFilters(): Promise<void> {
    this.difficultyFilterValue.set(null);
    this.energyFilterValue.set(null);
    this.statusFilterValue.set(null);
    this.mentalStateFilterValue.set(null);
    this.typeFilterValue.set(null);
    this.topicFilterValue.set(null);
    this.sortValue.set(DEFAULT_RESOURCE_SORT);
    this.searchQuery.set('');
    this.suggestions.set([]);
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

  trackCardView(resource: LearningResource): void {
    this.libraryService.trackRecent(resource.id);
    sessionStorage.setItem(
      LIST_PARAMS_STORAGE_KEY,
      JSON.stringify({
        page: this.service.currentPage(),
        pageSize: this.pageSize(),
        difficulty: this.difficultyFilterValue(),
        energyLevel: this.energyFilterValue(),
        status: this.statusFilterValue(),
        mentalState: this.mentalStateFilterValue(),
        resourceTypeId: this.typeFilterValue(),
        topicId: this.topicFilterValue(),
        sort: this.sortValue(),
        q: this.searchQuery(),
      }),
    );
  }

  onCardClick(resource: LearningResource): void {
    this.trackCardView(resource);
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

  typeTone(typeId: string): string {
    const type = this.resourceTypes().find((t: ResourceType) => t.id === typeId);
    const key = type?.code.toLowerCase() ?? 'document';
    return TYPE_TONE[key] ?? 'pine';
  }

  typeGlyph(typeId: string): string {
    const type = this.resourceTypes().find((t: ResourceType) => t.id === typeId);
    const key = type?.code.toLowerCase() ?? 'document';
    return TYPE_GLYPH[key] ?? 'R';
  }

  toneVar(tone: string): string {
    return `var(--tone-${tone})`;
  }

  sourceOf(resource: LearningResource): string | null {
    if (!resource.url) return null;
    try {
      return new URL(resource.url).hostname.replace(/^www\./, '');
    } catch {
      return null;
    }
  }

  topicColor(topicId: string): string | undefined {
    return this.topics().find((t) => t.id === topicId)?.color ?? undefined;
  }

  coverStyle(resource: LearningResource): string {
    const color = resource.topicIds
      .map((id) => this.topicColor(id))
      .find((c): c is string => !!c);
    if (color) return `--cover-h: 135deg; --cover-a: ${color};`;
    return `--cover-h: 135deg; --cover-a: var(--tone-${this.typeTone(resource.typeId)});`;
  }

  topicChips(resource: LearningResource): { name: string; color?: string }[] {
    const byId = new Map(this.topics().map((t) => [t.id, t]));
    return resource.topicIds
      .map((id) => byId.get(id))
      .filter((t): t is NonNullable<typeof t> => !!t)
      .slice(0, 2)
      .map((t) => ({ name: t.name, color: t.color ?? undefined }));
  }

  readonly pageMinutes = computed(() =>
    this.displayedResources().reduce((sum, r) => sum + (r.estimatedDuration.value ?? 0), 0),
  );

  relativeLabel(resource: LearningResource): string {
    const date = resource.lastViewed ?? resource.updatedAt;
    const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  revealDelay(index: number): number {
    return Math.min(index * 55, 330);
  }

  setStatusFilter(value: ResourceStatus | null): void {
    this.statusFilterValue.set(value);
    void this.applyFilter();
  }

  nextStatus(status: ResourceStatus): ResourceStatus | null {
    if (status === 'Pending') return 'InProgress';
    if (status === 'InProgress') return 'Completed';
    return null;
  }

  statusAdvanceHint(resource: LearningResource): string {
    const next = this.nextStatus(resource.status);
    if (!next) return `Status: ${RESOURCE_STATUS_LABELS[resource.status]}. Nothing to advance.`;
    return `Status: ${RESOURCE_STATUS_LABELS[resource.status]}. Click to advance to ${RESOURCE_STATUS_LABELS[next]}.`;
  }

  async cycleStatus(resource: LearningResource): Promise<void> {
    const next = this.nextStatus(resource.status);
    if (!next) return;
    await this.onToggle(next, resource, 'status');
  }

  async onToggle(
    value: string,
    resource: LearningResource,
    field: 'difficulty' | 'energy' | 'status',
  ): Promise<void> {
    const key = `${resource.id}:${field}`;
    this.toggleLoadingId.set(key);
    try {
      await this.service.toggleField(resource.id, field, value);
    } catch {
      this.toastService.show(`Failed to update ${field}`, 'error');
    } finally {
      this.toggleLoadingId.set(null);
    }
  }
}
