import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TopicRepository } from '../../domain/topic.repository';
import { ResourceTypeRepository } from '../../domain/resource-type.repository';
import { TopicHttpRepository } from '../../infrastructure/topic-http.repository';
import { ResourceTypeHttpRepository } from '../../infrastructure/resource-type-http.repository';
import { TopicService } from '../../application/topic.service';
import { ResourceTypeService } from '../../application/resource-type.service';
import { LearningResourceService } from '@features/learning-resource/application/learning-resource.service';
import {
  LearningResource,
  ResourceStatus,
} from '@features/learning-resource/domain/learning-resource.model';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import { LearningResourceHttpRepository } from '@features/learning-resource/infrastructure/learning-resource-http.repository';
import { ThemeService } from '@core/theme/theme.service';
import { ToastService } from '@core/toast/toast.service.js';

@Component({
  selector: 'app-add-resource',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './add-resource.component.html',
  providers: [
    TopicService,
    ResourceTypeService,
    LearningResourceService,
    { provide: TopicRepository, useClass: TopicHttpRepository },
    { provide: ResourceTypeRepository, useClass: ResourceTypeHttpRepository },
    { provide: LearningResourceRepository, useClass: LearningResourceHttpRepository },
  ],
})
export class AddResourceComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly topicService = inject(TopicService);
  private readonly resourceTypeService = inject(ResourceTypeService);
  private readonly learningResourceService = inject(LearningResourceService);
  readonly themeService = inject(ThemeService);
  private readonly toastService = inject(ToastService);

  readonly topics = this.topicService.topics;
  readonly resourceTypes = this.resourceTypeService.resourceTypes;
  readonly loadingTopics = this.topicService.loading;
  readonly loadingTypes = this.resourceTypeService.loading;

  currentStep = 1;
  step1Form: FormGroup;
  step2Form: FormGroup;
  isSubmitting = false;
  submitError: string | null = null;

  readonly difficulties = ['Low', 'Medium', 'High'];
  readonly energyLevels = ['Low', 'Medium', 'High'];

  constructor() {
    this.step1Form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      typeId: ['', Validators.required],
      topicIds: [[], Validators.required],
      url: [''],
    });

    this.step2Form = this.fb.group({
      difficulty: ['Medium', Validators.required],
      energyLevel: ['Medium', Validators.required],
      estimatedDuration: this.fb.group({
        value: [30, [Validators.required, Validators.min(1)]],
        isEstimated: [true],
      }),
      notes: [''],
    });
  }

  async ngOnInit(): Promise<void> {
    await Promise.all([this.topicService.loadAll(), this.resourceTypeService.loadAll()]);
  }

  isTopicSelected(topicId: string): boolean {
    return (this.step1Form.get('topicIds')?.value || []).includes(topicId);
  }

  onTopicToggle(topicId: string): void {
    const current: string[] = this.step1Form.get('topicIds')?.value || [];
    const updated = current.includes(topicId)
      ? current.filter((id) => id !== topicId)
      : [...current, topicId];
    this.step1Form.patchValue({ topicIds: updated });
    this.step1Form.get('topicIds')?.markAsTouched();
  }

  nextStep(): void {
    if (this.step1Form.valid) {
      this.currentStep = 2;
    } else {
      this.markFormGroupTouched(this.step1Form);
    }
  }

  prevStep(): void {
    this.currentStep = 1;
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  getDifficultyIcon(difficulty: string): string {
    const map: Record<string, string> = {
      Low: '🌱',
      Medium: '⚡',
      High: '🔥',
    };
    return map[difficulty] ?? '';
  }

  getEnergyIcon(energy: string): string {
    const map: Record<string, string> = {
      Low: '😌',
      Medium: '🧠',
      High: '🚀',
    };
    return map[energy] ?? '';
  }

  getDifficultySelectedClass(d: string): string {
    const map: Record<string, string> = {
      Low: 'flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 transition-all',
      Medium:
        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 transition-all',
      High: 'flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 transition-all',
    };
    return map[d] ?? '';
  }

  getEnergySelectedClass(e: string): string {
    const map: Record<string, string> = {
      Low: 'flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 transition-all',
      Medium:
        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 transition-all',
      High: 'flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 transition-all',
    };
    return map[e] ?? '';
  }

  async onSubmit(): Promise<void> {
    const INITIAL_RESOURCE_STATUS: ResourceStatus = 'Pending';
    if (!this.step2Form.valid) {
      this.markFormGroupTouched(this.step2Form);
      return;
    }

    this.isSubmitting = true;
    this.submitError = null;

    const payload = {
      title: this.step1Form.value.title,
      url: this.step1Form.value.url || undefined,
      notes: this.step2Form.value.notes || undefined,
      difficulty: this.step2Form.value.difficulty as LearningResource['difficulty'],
      energyLevel: this.step2Form.value.energyLevel as LearningResource['energyLevel'],
      estimatedDuration: {
        value: this.step2Form.value.estimatedDuration.value,
        isEstimated: this.step2Form.value.estimatedDuration.isEstimated,
      },
      topicIds: this.step1Form.value.topicIds,
      typeId: this.step1Form.value.typeId,
      status: INITIAL_RESOURCE_STATUS,
    };

    try {
      await this.learningResourceService.addResource(payload);
      this.toastService.show('Resource created successfully');
      this.router.navigate(['/']);
    } catch {
      this.toastService.show('Failed to create resource. Please try again.', 'error');
      this.submitError = 'Failed to create resource. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
