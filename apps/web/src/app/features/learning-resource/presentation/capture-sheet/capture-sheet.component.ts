import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CaptureSheetService, type CaptureTab } from '@core/capture/capture-sheet.service';
import { ToastService } from '@core/toast/toast.service';
import { LearningResourceService } from '@features/learning-resource/application/learning-resource.service';
import { ResourceTypeService } from '@features/learning-resource/application/resource-type.service';
import { TopicService } from '@features/learning-resource/application/topic.service';
import { UrlPreviewService } from '@features/learning-resource/application/url-preview.service';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import { ResourceTypeRepository } from '@features/learning-resource/domain/resource-type.repository';
import { TopicRepository } from '@features/learning-resource/domain/topic.repository';
import { LearningResourceHttpRepository } from '@features/learning-resource/infrastructure/learning-resource-http.repository';
import { ResourceTypeHttpRepository } from '@features/learning-resource/infrastructure/resource-type-http.repository';
import { TopicHttpRepository } from '@features/learning-resource/infrastructure/topic-http.repository';
import type {
  DifficultyLevel,
  EnergyLevel,
  MentalStateType,
  ResourceStatus,
} from '@features/learning-resource/domain/learning-resource.model';
import {
  DIFFICULTY_LEVELS,
  ENERGY_LEVELS,
  MENTAL_STATE_LABELS,
  MENTAL_STATE_TYPES,
  RESOURCE_STATUS_LABELS,
  RESOURCE_STATUSES,
} from '@features/learning-resource/domain/learning-resource.constants';
import { toneVar } from '@shared/utils/tone';

const DURATION_STEP = 5;
const MIN_DURATION = 5;

@Component({
  selector: 'app-capture-sheet',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './capture-sheet.component.html',
  providers: [
    LearningResourceService,
    ResourceTypeService,
    TopicService,
    UrlPreviewService,
    { provide: LearningResourceRepository, useClass: LearningResourceHttpRepository },
    { provide: ResourceTypeRepository, useClass: ResourceTypeHttpRepository },
    { provide: TopicRepository, useClass: TopicHttpRepository },
  ],
})
export class CaptureSheetComponent {
  protected readonly toneVar = toneVar;
  private readonly sheet = inject(CaptureSheetService);
  private readonly resources = inject(LearningResourceService);
  private readonly types = inject(ResourceTypeService);
  private readonly topicService = inject(TopicService);
  private readonly preview = inject(UrlPreviewService);
  private readonly toast = inject(ToastService);

  readonly isOpen = this.sheet.isOpen;
  readonly tab = this.sheet.tab;

  readonly tabs: { value: CaptureTab; label: string }[] = [
    { value: 'manual', label: 'Manual' },
    { value: 'url', label: 'From URL' },
    { value: 'voice', label: 'Voice' },
    { value: 'file', label: 'File' },
  ];

  readonly title = signal('');
  readonly url = signal('');
  readonly notes = signal('');
  readonly typeId = signal<string | null>(null);
  readonly topicIds = signal<string[]>([]);
  readonly difficulty = signal<DifficultyLevel>('Medium');
  readonly energy = signal<EnergyLevel>('Medium');
  readonly mentalState = signal<MentalStateType | null>(null);
  readonly status = signal<ResourceStatus>('Pending');
  readonly duration = signal(25);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly loaded = signal(false);

  readonly difficulties = DIFFICULTY_LEVELS;
  readonly energies = ENERGY_LEVELS;
  readonly statuses = RESOURCE_STATUSES;
  readonly mentalStates = MENTAL_STATE_TYPES.map((value) => ({ value, label: MENTAL_STATE_LABELS[value] }));
  readonly resourceTypes = this.types.resourceTypes;
  readonly topics = this.topicService.topics;
  readonly previewLoading = this.preview.loading;

  readonly draftLabel = computed(() => {
    const t = this.title().trim();
    return t ? t : 'Untitled draft';
  });

  readonly canSave = computed(
    () =>
      this.title().trim().length > 0 &&
      !this.saving() &&
      this.loaded() &&
      (this.typeId() ?? this.resourceTypes()[0]?.id) !== undefined,
  );

  readonly saveDisabledReason = computed(() => {
    if (!this.title().trim()) return 'Add a title to enable saving';
    if (!this.loaded() || !(this.typeId() ?? this.resourceTypes()[0]?.id))
      return 'Loading required data…';
    return null;
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) void this.ensureLoaded();
    });
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen()) this.close();
  }

  openTab(tab: CaptureTab): void {
    this.sheet.open(tab);
  }

  close(): void {
    this.sheet.close();
    this.error.set(null);
  }

  async ensureLoaded(): Promise<void> {
    if (this.loaded()) return;
    this.loaded.set(true);
    await Promise.all([this.types.loadAll(), this.topicService.loadAll()]);
    const first = this.resourceTypes()[0];
    if (first && !this.typeId()) this.typeId.set(first.id);
  }

  toggleTopic(id: string): void {
    this.topicIds.update((ids) => (ids.includes(id) ? ids.filter((t) => t !== id) : [...ids, id]));
  }

  adjustDuration(delta: number): void {
    this.duration.update((v) => Math.max(MIN_DURATION, v + delta));
  }

  stepDifficulty(delta: -1 | 1): void {
    const order = this.difficulties;
    this.difficulty.update((v) => order[(order.indexOf(v) + delta + order.length) % order.length]!);
  }

  stepEnergy(delta: -1 | 1): void {
    const order = this.energies;
    this.energy.update((v) => order[(order.indexOf(v) + delta + order.length) % order.length]!);
  }

  async fetchUrlMetadata(): Promise<void> {
    const raw = this.url().trim();
    if (!raw) {
      this.error.set('Paste a URL first.');
      return;
    }
    this.error.set(null);
    const data = await this.preview.preview(raw);
    if (!data) {
      this.error.set(this.preview.error() ?? 'Could not read that URL.');
      return;
    }
    if (data.title && !this.title().trim()) this.title.set(data.title);
    if (data.description && !this.notes().trim()) this.notes.set(data.description);
    if (data.author) this.notes.set(`${this.notes()}\n\nBy ${data.author}`.trim());
    const match = this.resourceTypes().find(
      (t) => t.id === data.resourceTypeId || t.code.toLowerCase() === (data.resourceTypeCode ?? '').toLowerCase(),
    );
    if (match) this.typeId.set(match.id);
    this.toast.show('Metadata extracted', 'info');
  }

  async save(): Promise<void> {
    const title = this.title().trim();
    if (!title) {
      this.error.set('Give it a title to save it.');
      return;
    }
    const typeId = this.typeId() ?? this.resourceTypes()[0]?.id;
    if (!typeId) {
      this.error.set('No resource types available yet.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.resources.addResource({
        title,
        url: this.url().trim() || undefined,
        resourceTypeId: typeId,
        topicIds: this.topicIds(),
        difficulty: this.difficulty(),
        estimatedDurationMinutes: this.duration(),
        energyLevel: this.energy(),
        mentalState: this.mentalState() ?? undefined,
        status: this.status(),
        notes: this.notes().trim() || undefined,
      });
      this.toast.show(`Captured: ${title}`);
      this.reset();
      this.close();
    } catch {
      this.error.set('Could not save. Try again.');
    } finally {
      this.saving.set(false);
    }
  }

  private reset(): void {
    this.title.set('');
    this.url.set('');
    this.notes.set('');
    this.topicIds.set([]);
    this.difficulty.set('Medium');
    this.energy.set('Medium');
    this.mentalState.set(null);
    this.status.set('Pending');
    this.duration.set(25);
    this.preview.reset();
  }

  protected readonly RESOURCE_STATUS_LABELS = RESOURCE_STATUS_LABELS;
}
