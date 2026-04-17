import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LearningResourceService } from '@features/learning-resource/application/learning-resource.service.js';
import type {
  DifficultyLevel,
  EnergyLevel,
  LearningResource,
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
import { EnumBadgeComponent } from '@shared/components/enum-badge/enum-badge.component.js';
import type { EnumOption } from '@shared/components/enum-badge/enum-badge.types.js';

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
  private readonly repository = inject(LearningResourceRepository);

  readonly resource = signal<LearningResource | null>(null);
  readonly loading = this.resourceService.loading;
  readonly error = this.resourceService.error;
  readonly resourceTypes = this.resourceTypeService.resourceTypes.asReadonly();

  readonly toggleLoadingField = signal<string | null>(null);

  private resourceId: string | null = null;

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

  async onToggle(
    value: string,
    field: 'difficulty' | 'energy' | 'status' | 'mentalState',
  ): Promise<void> {
    const r = this.resource();
    if (!r) return;

    const prev = { ...r };
    this.toggleLoadingField.set(field);

    this.resource.update((res) => {
      if (!res) return res;
      if (field === 'difficulty') return { ...res, difficulty: value as DifficultyLevel };
      if (field === 'energy') return { ...res, energyLevel: value as EnergyLevel };
      if (field === 'status') return { ...res, status: value as ResourceStatus };
      if (field === 'mentalState') return { ...res, mentalState: value as MentalStateType };
      return res;
    });

    try {
      if (field === 'difficulty')
        await this.repository.toggleDifficulty(r.id, value as DifficultyLevel);
      else if (field === 'energy') await this.repository.toggleEnergy(r.id, value as EnergyLevel);
      else if (field === 'status')
        await this.repository.toggleStatus(r.id, value as ResourceStatus);
      else if (field === 'mentalState')
        await this.repository.toggleMentalState(r.id, value as MentalStateType);
    } catch {
      this.resource.set(prev);
      this.toastService.show(`Failed to update ${field}`, 'error');
    } finally {
      this.toggleLoadingField.set(null);
    }
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

  showComingSoon(): void {
    this.toastService.show('Coming soon – will be available in a future version.', 'info');
  }
}
