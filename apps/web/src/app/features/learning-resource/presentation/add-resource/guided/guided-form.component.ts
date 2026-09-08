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
import { LearningResourceService } from '@features/learning-resource/application/learning-resource.service';
import type {
  AddResourcePayload,
  DifficultyLevel,
  EnergyLevel,
  LearningResource,
  MentalStateType,
  ResourceStatus,
} from '@features/learning-resource/domain/learning-resource.model';
import {
  DIFFICULTY_LEVELS,
  ENERGY_LEVELS,
  MENTAL_STATE_LABELS,
  MENTAL_STATE_TYPES,
} from '@features/learning-resource/domain/learning-resource.constants';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import { LearningResourceHttpRepository } from '@features/learning-resource/infrastructure/learning-resource-http.repository';
import { ToastService } from '@core/toast/toast.service';
import { TopicService } from '@features/learning-resource/application/topic.service';
import { ResourceTypeService } from '@features/learning-resource/application/resource-type.service';
import { TopicHttpRepository } from '@features/learning-resource/infrastructure/topic-http.repository';
import { ResourceTypeHttpRepository } from '@features/learning-resource/infrastructure/resource-type-http.repository';
import { ResourceTypeRepository } from '@features/learning-resource/domain/resource-type.repository';
import { TopicRepository } from '@features/learning-resource/domain/topic.repository';

const LEVEL_SELECTED_CARD_CLASS: Record<string, string> = {
  Low: 'flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-energy-low/60 bg-energy-low/10 text-energy-low transition-all',
  Medium:
    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-energy-medium/60 bg-energy-medium/10 text-energy-medium transition-all',
  High: 'flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-energy-high/60 bg-energy-high/10 text-energy-high transition-all',
};

@Component({
  selector: 'app-guided-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './guided-form.component.html',
  providers: [
    TopicService,
    ResourceTypeService,
    LearningResourceService,
    { provide: TopicRepository, useClass: TopicHttpRepository },
    { provide: ResourceTypeRepository, useClass: ResourceTypeHttpRepository },
    { provide: LearningResourceRepository, useClass: LearningResourceHttpRepository },
  ],
})
export class GuidedFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly topicService = inject(TopicService);
  private readonly resourceTypeService = inject(ResourceTypeService);
  private readonly learningResourceService = inject(LearningResourceService);
  private readonly toastService = inject(ToastService);

  readonly topics = this.topicService.topics;
  readonly resourceTypes = this.resourceTypeService.resourceTypes;
  readonly loadingTopics = this.topicService.loading;
  readonly loadingTypes = this.resourceTypeService.loading;

  currentStep = 1;
  step1Form!: FormGroup;
  step2Form!: FormGroup;
  isSubmitting = false;
  submitError: string | null = null;

  readonly difficulties: readonly DifficultyLevel[] = DIFFICULTY_LEVELS;
  readonly energyLevels: readonly EnergyLevel[] = ENERGY_LEVELS;
  readonly mentalStates: { value: MentalStateType; label: string }[] = MENTAL_STATE_TYPES.map(
    (value) => ({ value, label: MENTAL_STATE_LABELS[value] }),
  );

  constructor() {
    this.step1Form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      typeId: ['', Validators.required],
      topicIds: [[], [Validators.required, Validators.minLength(1)]],
      url: [''],
      imageUrl: [''],
    });

    this.step2Form = this.fb.group({
      difficulty: ['Medium', Validators.required],
      energyLevel: ['Medium', Validators.required],
      mentalState: [null],
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

  toggleMentalState(value: MentalStateType): void {
    const current = this.step2Form.get('mentalState')?.value;
    this.step2Form.patchValue({ mentalState: current === value ? null : value });
  }

  nextStep(): void {
    if (this.step1Form.valid && this.step1Form.value.topicIds.length > 0) {
      this.currentStep = 2;
    } else {
      this.markFormGroupTouched(this.step1Form);
    }
  }

  prevStep(): void {
    this.currentStep = 1;
  }

  goBack(): void {
    this.router.navigate(['/add']);
  }

  getDifficultyIcon(difficulty: string): string {
    return ({ Low: '🌱', Medium: '⚡', High: '🔥' } as Record<string, string>)[difficulty] ?? '';
  }

  getEnergyIcon(energy: string): string {
    return ({ Low: '😌', Medium: '🧠', High: '🚀' } as Record<string, string>)[energy] ?? '';
  }

  getDifficultySelectedClass(d: string): string {
    return LEVEL_SELECTED_CARD_CLASS[d] ?? '';
  }

  getEnergySelectedClass(e: string): string {
    return LEVEL_SELECTED_CARD_CLASS[e] ?? '';
  }

  async onSubmit(): Promise<void> {
    const INITIAL_STATUS: ResourceStatus = 'Pending';
    if (!this.step2Form.valid) {
      this.markFormGroupTouched(this.step2Form);
      return;
    }

    this.isSubmitting = true;
    this.submitError = null;

    const payload: AddResourcePayload = {
      title: this.step1Form.value.title,
      url: this.step1Form.value.url || undefined,
      imageUrl: this.step1Form.value.imageUrl || undefined,
      notes: this.step2Form.value.notes || undefined,
      difficulty: this.step2Form.value.difficulty as LearningResource['difficulty'],
      energyLevel: this.step2Form.value.energyLevel as LearningResource['energyLevel'],
      mentalState: this.step2Form.value.mentalState ?? undefined,
      estimatedDurationMinutes: this.step2Form.value.estimatedDuration.value,
      topicIds: this.step1Form.value.topicIds,
      resourceTypeId: this.step1Form.value.typeId,
      status: INITIAL_STATUS,
    };

    try {
      await this.learningResourceService.addResource(payload);
      this.toastService.show('Resource created successfully');
      this.router.navigate(['/dashboard']);
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
      if (control instanceof FormGroup) this.markFormGroupTouched(control);
    });
  }
}
