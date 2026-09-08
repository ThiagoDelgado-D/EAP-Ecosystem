import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
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
import { MatDialogModule } from '@angular/material/dialog';
import { EnumBadgeComponent } from '@shared/components/enum-badge/enum-badge.component';
import {
  DIFFICULTY_BADGE_OPTIONS,
  ENERGY_BADGE_OPTIONS,
  STATUS_BADGE_OPTIONS,
  MENTAL_STATE_BADGE_OPTIONS,
} from '@shared/components/enum-badge/enum-badge-options.js';

const FIELD_PATCHERS: Record<ToggleableField, (value: string) => Partial<LearningResource>> = {
  difficulty: (value) => ({ difficulty: value as DifficultyLevel }),
  energy: (value) => ({ energyLevel: value as EnergyLevel }),
  status: (value) => ({ status: value as ResourceStatus }),
  mentalState: (value) => ({ mentalState: value as MentalStateType }),
};

@Component({
  selector: 'app-resource-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MarkdownPipe, MatDialogModule, EnumBadgeComponent],
  providers: [
    LearningResourceService,
    ResourceTypeService,
    { provide: LearningResourceRepository, useClass: LearningResourceHttpRepository },
    { provide: ResourceTypeRepository, useClass: ResourceTypeHttpRepository },
  ],
  templateUrl: './resource-detail.component.html',
})
export class ResourceDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly resourceService = inject(LearningResourceService);
  private readonly resourceTypeService = inject(ResourceTypeService);
  private readonly toastService = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly resource = signal<LearningResource | null>(null);
  readonly loading = this.resourceService.loading;
  readonly error = this.resourceService.error;
  readonly resourceTypes = this.resourceTypeService.resourceTypes.asReadonly();
  readonly toggleLoadingField = signal<string | null>(null);

  private resourceId: string | null = null;

  readonly difficultyOptions = DIFFICULTY_BADGE_OPTIONS;
  readonly energyOptions = ENERGY_BADGE_OPTIONS;
  readonly statusOptions = STATUS_BADGE_OPTIONS;
  readonly mentalStateOptions = MENTAL_STATE_BADGE_OPTIONS;

  ngOnInit(): void {
    this.resourceTypeService.loadAll();
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
      confirmButtonClass: 'bg-red-600 hover:bg-red-500 text-white',
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
    if (!type) return { label: 'Resource', icon: 'document', color: 'bg-slate-800 text-slate-400' };
    const TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
      video: { label: 'Video', icon: 'video', color: 'bg-violet-950/70 text-violet-400' },
      article: { label: 'Article', icon: 'article', color: 'bg-sky-950/70 text-sky-400' },
      book: { label: 'Book', icon: 'book', color: 'bg-amber-950/70 text-amber-400' },
      course: { label: 'Course', icon: 'course', color: 'bg-emerald-950/70 text-emerald-400' },
      audio: { label: 'Audio', icon: 'audio', color: 'bg-pink-950/70 text-pink-400' },
      document: { label: 'Document', icon: 'document', color: 'bg-slate-800 text-slate-400' },
      toolkit: { label: 'Toolkit', icon: 'toolkit', color: 'bg-orange-950/70 text-orange-400' },
    };
    return (
      TYPE_META[type.code.toLowerCase()] ?? {
        label: type.displayName,
        icon: 'document',
        color: 'bg-slate-800 text-slate-400',
      }
    );
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

  showComingSoon(): void {
    this.toastService.show('Coming soon – will be available in a future version.', 'info');
  }
}
