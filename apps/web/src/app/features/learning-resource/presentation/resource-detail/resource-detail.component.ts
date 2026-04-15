import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LearningResourceService } from '@features/learning-resource/application/learning-resource.service.js';
import {
  DifficultyLevel,
  EnergyLevel,
  LearningResource,
  ResourceStatus,
} from '@features/learning-resource/domain/learning-resource.model.js';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository.js';
import { LearningResourceHttpRepository } from '@features/learning-resource/infrastructure/learning-resource-http.repository.js';
import { ResourceTypeService } from '@features/learning-resource/application/resource-type.service.js';
import { ResourceTypeRepository } from '@features/learning-resource/domain/resource-type.repository.js';
import { ResourceTypeHttpRepository } from '@features/learning-resource/infrastructure/resource-type-http.repository.js';
import { MarkdownPipe } from '@shared/pipes/markdown.pipe.js';
import { ToastService } from '@core/toast/toast.service.js';

@Component({
  selector: 'app-resource-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MarkdownPipe],
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

  readonly resource = signal<LearningResource | null>(null);
  readonly loading = this.resourceService.loading;
  readonly error = this.resourceService.error;

  readonly resourceTypes = this.resourceTypeService.resourceTypes.asReadonly();
  ngOnInit(): void {
    this.resourceTypeService.loadAll();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadResource(id);
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
    const id = this.resource()?.id;
    if (id) this.router.navigate(['/resources', id, 'edit']);
  }

  deleteResource(): void {
    alert('Delete not yet implemented');
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

  showComingSoon(): void {
    this.toastService.show('Coming soon – will be available in a future version.', 'info');
  }
}
