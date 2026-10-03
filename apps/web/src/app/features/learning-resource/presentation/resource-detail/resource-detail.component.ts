import { Component, inject, signal, OnInit, computed, effect } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LearningResourceService,
  type ToggleableField,
} from '@features/learning-resource/application/learning-resource.service.js';
import type {
  LearningResource,
  DifficultyLevel,
  EnergyLevel,
  MentalStateType,
  ResourceStatus,
} from '@features/learning-resource/domain/learning-resource.model.js';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository.js';
import { LearningResourceHttpRepository } from '@features/learning-resource/infrastructure/learning-resource-http.repository.js';
import { ResourceTypeService } from '@features/learning-resource/application/resource-type.service.js';
import { ResourceTypeRepository } from '@features/learning-resource/domain/resource-type.repository.js';
import { ResourceTypeHttpRepository } from '@features/learning-resource/infrastructure/resource-type-http.repository.js';
import { MarkdownPipe } from '@shared/pipes/markdown.pipe.js';
import { ToastService } from '@core/toast/toast.service.js';
import { ConfirmDialogService } from '@core/dialogs/confirm-dialog.service.js';
import { PageTitleService } from '@core/title/page-title.service';
import { ResourceLibraryService } from '@features/learning-resource/application/resource-library.service.js';
import { TopicService } from '@features/learning-resource/application/topic.service.js';
import { TopicRepository } from '@features/learning-resource/domain/topic.repository.js';
import { TopicHttpRepository } from '@features/learning-resource/infrastructure/topic-http.repository.js';
import { MatDialogModule } from '@angular/material/dialog';
import { EnumBadgeComponent } from '@shared/components/enum-badge/enum-badge.component';
import {
  DIFFICULTY_BADGE_OPTIONS,
  ENERGY_BADGE_OPTIONS,
  STATUS_BADGE_OPTIONS,
  MENTAL_STATE_BADGE_OPTIONS,
} from '@shared/components/enum-badge/enum-badge-options.js';
import {
  MENTAL_STATE_LABELS,
  RESOURCE_STATUS_LABELS,
} from '@features/learning-resource/domain/learning-resource.constants.js';

const TYPE_TONE: Record<string, string> = {
  video: 'info',
  article: 'pine',
  book: 'ochre',
  course: 'ember',
  audio: 'plum',
  document: 'slate',
  toolkit: 'info',
};

const TYPE_LABELS: Record<string, string> = {
  video: 'Video',
  article: 'Article',
  book: 'Book',
  course: 'Course',
  audio: 'Audio',
  document: 'Document',
  toolkit: 'Toolkit',
};

const TYPE_GLYPH: Record<string, string> = {  video: '▶',
  article: '¶',
  book: '❡',
  course: '≡',
  audio: '◍',
  document: '{}',
  toolkit: '⑂',
};

type DetailTab = 'summary' | 'notes';

const FIELD_PATCHERS: Record<ToggleableField, (value: string) => Partial<LearningResource>> = {
  difficulty: (value) => ({ difficulty: value as DifficultyLevel }),
  energy: (value) => ({ energyLevel: value as EnergyLevel }),
  status: (value) => ({ status: value as ResourceStatus }),
  mentalState: (value) => ({ mentalState: value as MentalStateType }),
};

@Component({
  selector: 'app-resource-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MarkdownPipe, MatDialogModule, EnumBadgeComponent],
  providers: [
    LearningResourceService,
    ResourceTypeService,
    TopicService,
    { provide: LearningResourceRepository, useClass: LearningResourceHttpRepository },
    { provide: ResourceTypeRepository, useClass: ResourceTypeHttpRepository },
    { provide: TopicRepository, useClass: TopicHttpRepository },
  ],
  templateUrl: './resource-detail.component.html',
})
export class ResourceDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly resourceService = inject(LearningResourceService);
  private readonly resourceTypeService = inject(ResourceTypeService);
  private readonly topicService = inject(TopicService);
  private readonly libraryService = inject(ResourceLibraryService);
  private readonly toastService = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly pageTitle = inject(PageTitleService);

  readonly resource = signal<LearningResource | null>(null);
  readonly loading = this.resourceService.loading;
  readonly error = this.resourceService.error;
  readonly resourceTypes = this.resourceTypeService.resourceTypes.asReadonly();
  readonly topics = this.topicService.topics;
  readonly toggleLoadingField = signal<string | null>(null);
  readonly tab = signal<DetailTab>('summary');
  readonly notesDraft = signal('');
  readonly savingNotes = signal(false);

  private resourceId: string | null = null;

  constructor() {
    effect(() => {
      const title = this.resource()?.title;
      if (title) this.pageTitle.set(title);
    });
  }

  readonly difficultyOptions = DIFFICULTY_BADGE_OPTIONS;
  readonly energyOptions = ENERGY_BADGE_OPTIONS;
  readonly statusOptions = STATUS_BADGE_OPTIONS;
  readonly mentalStateOptions = MENTAL_STATE_BADGE_OPTIONS;
  readonly STATUS_LABELS = RESOURCE_STATUS_LABELS;
  readonly MENTAL_LABELS = MENTAL_STATE_LABELS;

  ngOnInit(): void {
    void this.resourceTypeService.loadAll();
    void this.topicService.loadAll();
    this.resourceId = this.route.snapshot.paramMap.get('id');
    if (this.resourceId) {
      this.loadResource(this.resourceId);
    } else {
      this.router.navigate(['/resources']);
    }
  }

  async loadResource(id: string): Promise<void> {
    try {
      const data = await this.resourceService.getById(id);
      this.resource.set(data);
      this.notesDraft.set(data.notes ?? '');
      this.libraryService.trackRecent(id);
    } catch {}
  }

  goBack(): void {
    this.router.navigate(['/resources']);
  }

  editResource(): void {
    if (this.resourceId) {
      this.router.navigate(['/resources', this.resourceId, 'edit']);
    }
  }

  async deleteResource(): Promise<void> {
    if (!this.resourceId) {
      this.toastService.show('Resource ID is missing', 'error');
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete resource',
      message: `Are you sure you want to delete this resource? This action cannot be undone.`,
      confirmLabel: 'Delete',
    });

    if (!confirmed) return;

    try {
      await this.resourceService.deleteResource(this.resourceId);
      this.toastService.show('Resource deleted successfully', 'success');
      this.router.navigate(['/resources']);
    } catch (error) {
      console.error('Delete error:', error);
      this.toastService.show('Failed to delete resource. Please try again.', 'error');
    }
  }

  getTypeMeta(typeId: string) {
    const type = this.resourceTypes().find((t) => t.id === typeId);
    if (!type) return { label: 'Resource', glyph: 'R', tone: 'slate' as const };
    const key = type.code.toLowerCase();
    return {
      label: TYPE_LABELS[key] ?? type.displayName,
      glyph: TYPE_GLYPH[key] ?? 'R',
      tone: TYPE_TONE[key] ?? 'pine',
    };
  }

  coverStyle(title: string, tone: string): string {
    let h = 0;
    for (let i = 0; i < title.length; i += 1) h = (h * 31 + title.charCodeAt(i)) % 360;
    return `--cover-h: ${h}deg; --cover-a: var(--tone-${tone});`;
  }

  topicChips(resource: LearningResource): { name: string; color?: string }[] {
    const byId = new Map(this.topics().map((t) => [t.id, t]));
    return resource.topicIds
      .map((id) => byId.get(id))
      .filter((t): t is NonNullable<typeof t> => !!t)
      .map((t) => ({ name: t.name, color: t.color ?? undefined }));
  }

  sourceHost(resource: LearningResource): string | null {
    if (!resource.url) return null;
    try {
      return new URL(resource.url).hostname.replace(/^www\./, '');
    } catch {
      return null;
    }
  }

  urlDisplay(resource: LearningResource): string {
    if (!resource.url) return '';
    return resource.url.replace(/^https?:\/\//, '');
  }

  relativeLabel(date: Date): string {
    const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  isSaved(): boolean {
    const id = this.resource()?.id;
    return id ? this.libraryService.isSaved(id) : false;
  }

  toggleSaved(): void {
    const id = this.resource()?.id;
    if (id) this.libraryService.toggleSaved(id);
  }

  async saveNotes(): Promise<void> {
    if (!this.resourceId) return;
    this.savingNotes.set(true);
    try {
      await this.resourceService.updateResource(this.resourceId, {
        notes: this.notesDraft(),
      });
      this.patchResource({ notes: this.notesDraft() });
      this.toastService.show('Notes saved', 'success');
    } catch {
      this.toastService.show('Failed to save notes', 'error');
    } finally {
      this.savingNotes.set(false);
    }
  }

  async onToggle(value: string, field: ToggleableField): Promise<void> {
    if (!this.resourceId) return;
    this.toggleLoadingField.set(field);
    try {
      await this.resourceService.toggleField(this.resourceId, field, value);
      this.patchResource(FIELD_PATCHERS[field](value));
    } catch {
      this.toastService.show(`Failed to update ${field}`, 'error');
    } finally {
      this.toggleLoadingField.set(null);
    }
  }

  private patchResource(patch: Partial<LearningResource>): void {
    const current = this.resource();
    if (current) {
      this.resource.set({ ...current, ...patch });
    }
  }
}
