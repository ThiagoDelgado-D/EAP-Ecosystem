import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LearningResourceService } from '@features/learning-resource/application/learning-resource.service';
import {
  DifficultyLevel,
  EnergyLevel,
  LearningResource,
  UpdateResourcePayload,
} from '@features/learning-resource/domain/learning-resource.model';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import { LearningResourceHttpRepository } from '@features/learning-resource/infrastructure/learning-resource-http.repository';
import { TopicService } from '@features/learning-resource/application/topic.service';
import { ResourceTypeService } from '@features/learning-resource/application/resource-type.service';
import { TopicRepository } from '@features/learning-resource/domain/topic.repository';
import { TopicHttpRepository } from '@features/learning-resource/infrastructure/topic-http.repository';
import { ResourceTypeRepository } from '@features/learning-resource/domain/resource-type.repository';
import { ResourceTypeHttpRepository } from '@features/learning-resource/infrastructure/resource-type-http.repository';
import { ToastService } from '@core/toast/toast.service';

@Component({
  selector: 'app-edit-resource',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  providers: [
    LearningResourceService,
    TopicService,
    ResourceTypeService,
    { provide: LearningResourceRepository, useClass: LearningResourceHttpRepository },
    { provide: TopicRepository, useClass: TopicHttpRepository },
    { provide: ResourceTypeRepository, useClass: ResourceTypeHttpRepository },
  ],
  templateUrl: './edit-resource.component.html',
})
export class EditResourceComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly resourceService = inject(LearningResourceService);
  private readonly topicService = inject(TopicService);
  private readonly resourceTypeService = inject(ResourceTypeService);
  private readonly toastService = inject(ToastService);

  readonly resource = signal<LearningResource | null>(null);
  readonly loading = this.resourceService.loading;
  readonly error = this.resourceService.error;
  readonly topics = this.topicService.topics;
  readonly resourceTypes = this.resourceTypeService.resourceTypes;

  isSubmitting = false;
  private resourceId: string | null = null;

  form!: FormGroup;

  readonly difficulties: DifficultyLevel[] = ['Low', 'Medium', 'High'];
  readonly energyLevels: EnergyLevel[] = ['Low', 'Medium', 'High'];

  readonly impactRating = computed<number>(() => {
    const resource = this.resource();
    if (!resource) return 0;
    const diffScore = { Low: 6, Medium: 8, High: 10 }[resource.difficulty] ?? 7;
    const energyScore = { Low: 5, Medium: 7, High: 9 }[resource.energyLevel] ?? 7;
    return Math.round(((diffScore + energyScore) / 2) * 10) / 10;
  });

  readonly estimatedLoad = computed<string>(() => {
    const r = this.resource();
    if (!r) return 'Moderate';
    if (r.energyLevel === 'High' && r.difficulty === 'High') return 'Peak Focus';
    if (r.energyLevel === 'High' || r.difficulty === 'High') return 'High Load';
    if (r.energyLevel === 'Low' && r.difficulty === 'Low') return 'Light Session';
    return 'Moderate';
  });

  readonly architectTips = computed<string[]>(() => {
    const r = this.resource();
    if (!r) return [];
    const tips: string[] = [];
    if (r.difficulty === 'High') {
      tips.push(
        'High-difficulty resources should be paired with "High" energy status to ensure users are mentally prepared.',
      );
    }
    const trendingTopics = this.topics()
      .filter((t) => r.topicIds.includes(t.id))
      .map((t) => t.name);
    if (trendingTopics.length > 0) {
      tips.push(
        `Topics like ${trendingTopics.slice(0, 2).join(' and ')} are currently trending in the Pulse.`,
      );
    }
    if (r.title.length > 40) {
      tips.push('Keep titles concise. A shorter title is optimal for desktop and mobile layouts.');
    } else {
      tips.push(
        `"${r.title.split(' ').slice(0, 3).join(' ')}..." is optimal for desktop and mobile layouts.`,
      );
    }
    return tips;
  });

  ngOnInit(): void {
    this.resourceId = this.route.snapshot.paramMap.get('id');
    if (!this.resourceId) {
      this.router.navigate(['/resources']);
      return;
    }

    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      typeId: ['', Validators.required],
      estimatedDurationMinutes: [30, [Validators.required, Validators.min(1)]],
      topicIds: [[]],
      difficulty: ['Medium' as DifficultyLevel, Validators.required],
      energyLevel: ['Medium' as EnergyLevel, Validators.required],
    });

    Promise.all([this.topicService.loadAll(), this.resourceTypeService.loadAll()])
      .then(() => this.loadResource(this.resourceId!))
      .catch(() => {
        this.toastService.show('Failed to load form data. Please try again.', 'error');
        this.router.navigate(['/resources']);
      });
  }

  async loadResource(id: string): Promise<void> {
    try {
      const data = await this.resourceService.getById(id);

      this.resource.set(data);
      this.form.patchValue({
        title: data.title,
        typeId: data.typeId,
        estimatedDurationMinutes: data.estimatedDuration.value,
        topicIds: data.topicIds,
        difficulty: data.difficulty,
        energyLevel: data.energyLevel,
      });
    } catch {
      this.router.navigate(['/resources']);
    }
  }

  isTopicSelected(topicId: string): boolean {
    return (this.form.get('topicIds')?.value ?? []).includes(topicId);
  }

  toggleTopic(topicId: string): void {
    const current: string[] = this.form.get('topicIds')?.value ?? [];
    const updated = current.includes(topicId)
      ? current.filter((id) => id !== topicId)
      : [...current, topicId];
    this.form.patchValue({ topicIds: updated });

    const r = this.resource();
    if (r) this.resource.set({ ...r, topicIds: updated });
  }

  selectDifficulty(level: DifficultyLevel): void {
    this.form.patchValue({ difficulty: level });
    const r = this.resource();
    if (r) this.resource.set({ ...r, difficulty: level });
  }

  selectEnergy(level: EnergyLevel): void {
    this.form.patchValue({ energyLevel: level });
    const r = this.resource();
    if (r) this.resource.set({ ...r, energyLevel: level });
  }

  getTopicLabel(id: string): string {
    return this.topics().find((t) => t.id === id)?.name ?? id;
  }

  getTypeName(typeId: string): string {
    return this.resourceTypes().find((t) => t.id === typeId)?.displayName ?? 'Unknown';
  }

  getDifficultyBarClass(level: DifficultyLevel): string {
    const map: Record<DifficultyLevel, string> = {
      Low: 'bg-emerald-500',
      Medium: 'bg-yellow-500',
      High: 'bg-orange-500',
    };
    return map[level];
  }

  getEnergyBarClass(level: EnergyLevel): string {
    const map: Record<EnergyLevel, string> = {
      Low: 'bg-emerald-500',
      Medium: 'bg-yellow-500',
      High: 'bg-orange-500',
    };
    return map[level];
  }

  getDifficultyTextClass(level: DifficultyLevel): string {
    const map: Record<DifficultyLevel, string> = {
      Low: 'text-emerald-400',
      Medium: 'text-yellow-400',
      High: 'text-orange-400',
    };
    return map[level];
  }

  getEnergyTextClass(level: EnergyLevel): string {
    const map: Record<EnergyLevel, string> = {
      Low: 'text-emerald-400',
      Medium: 'text-yellow-400',
      High: 'text-orange-400',
    };
    return map[level];
  }

  getDifficultyBtnClass(level: DifficultyLevel): string {
    const selected = this.form.get('difficulty')?.value === level;
    const base =
      'flex-1 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer';
    if (selected) {
      const map: Record<DifficultyLevel, string> = {
        Low: 'border-emerald-600/70 bg-emerald-950/50 text-emerald-300',
        Medium: 'border-yellow-600/70 bg-yellow-950/50 text-yellow-300',
        High: 'border-orange-600/70 bg-orange-950/50 text-orange-300',
      };
      return `${base} ${map[level]}`;
    }
    return `${base} border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:text-slate-300`;
  }

  getEnergyBtnClass(level: EnergyLevel): string {
    const selected = this.form.get('energyLevel')?.value === level;
    const base =
      'flex-1 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer';
    if (selected) {
      const map: Record<EnergyLevel, string> = {
        Low: 'border-emerald-600/70 bg-emerald-950/50 text-emerald-300',
        Medium: 'border-yellow-600/70 bg-yellow-950/50 text-yellow-300',
        High: 'border-orange-600/70 bg-orange-950/50 text-orange-300',
      };
      return `${base} ${map[level]}`;
    }
    return `${base} border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:text-slate-300`;
  }

  goBack(): void {
    this.router.navigate(['/resources', this.resourceId]);
  }

  cancel(): void {
    this.router.navigate(['/resources', this.resourceId]);
  }

  async onSubmit(): Promise<void> {
    if (!this.form.valid || !this.resourceId) return;

    const original = this.resource();
    if (!original) return;

    this.isSubmitting = true;
    const v = this.form.value;

    const payload: UpdateResourcePayload = {};
    if (v.title !== original.title) payload.title = v.title;
    if (v.typeId !== original.typeId) payload.typeId = v.typeId;
    if (v.estimatedDurationMinutes !== original.estimatedDuration.value) {
      payload.estimatedDurationMinutes = v.estimatedDurationMinutes;
    }
    const topicsChanged =
      JSON.stringify([...v.topicIds].sort()) !== JSON.stringify([...original.topicIds].sort());
    if (topicsChanged) payload.topicIds = v.topicIds;

    try {
      if (Object.keys(payload).length > 0) {
        await this.resourceService.updateResource(this.resourceId, payload);
      }
      if (v.difficulty !== original.difficulty) {
        await this.resourceService.toggleDifficulty(this.resourceId, v.difficulty);
      }
      if (v.energyLevel !== original.energyLevel) {
        await this.resourceService.toggleEnergy(this.resourceId, v.energyLevel);
      }
      this.toastService.show('Resource updated successfully', 'success');
      this.router.navigate(['/resources', this.resourceId]);
    } catch {
      this.toastService.show('Failed to update resource. Please try again.', 'error');
    } finally {
      this.isSubmitting = false;
    }
  }
}
