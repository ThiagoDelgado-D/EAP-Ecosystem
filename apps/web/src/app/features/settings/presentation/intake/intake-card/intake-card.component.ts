import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { messageOf } from '@core/errors/error-messages';
import type { IntakeAnswers } from '@features/auth/domain/intake.model';
import { IntakeHttpService } from '@features/auth/infrastructure/intake-http.service';
import {
  GOAL_OPTIONS,
  STUDY_STYLE_OPTIONS,
} from '@features/auth/presentation/onboarding/intake-options';
import { toneVar } from '@shared/utils/tone';
import { IntakeRetakeComponent } from '../intake-retake/intake-retake.component';

@Component({
  selector: 'app-intake-card',
  standalone: true,
  imports: [IntakeRetakeComponent],
  templateUrl: './intake-card.component.html',
})
export class IntakeCardComponent implements OnInit {
  private readonly intakeService = inject(IntakeHttpService);

  readonly toneVar = toneVar;
  readonly intake = signal<IntakeAnswers | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly retaking = signal(false);

  readonly answers = computed(() => {
    const intake = this.intake();
    if (!intake) return [];
    return [
      ...GOAL_OPTIONS.filter((option) => intake.goals.includes(option.key)),
      ...STUDY_STYLE_OPTIONS.filter((option) => option.key === intake.studyStyle),
    ];
  });

  async ngOnInit(): Promise<void> {
    try {
      this.intake.set(await this.intakeService.getIntake());
    } catch (error) {
      this.error.set(messageOf(error));
    } finally {
      this.loading.set(false);
    }
  }

  onApplied(intake: IntakeAnswers): void {
    this.intake.set(intake);
    this.retaking.set(false);
  }
}
