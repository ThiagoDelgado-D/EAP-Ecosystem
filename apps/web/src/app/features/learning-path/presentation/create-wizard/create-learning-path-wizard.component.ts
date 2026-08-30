import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import { LearningPathHttpRepository } from '@features/learning-path/infrastructure/learning-path-http.repository';
import {
  PATH_MODE,
  PATH_SOURCE,
  type LearningPath,
  type PathMode,
} from '@features/learning-path/domain/learning-path.model';

interface WizardQuestion {
  question: string;
  hint: string;
  yesLabel: string;
  yesMode: PathMode;
  noLabel: string;
  noMode: PathMode;
}

const WIZARD_QUESTIONS: WizardQuestion[] = [
  {
    question: '¿Todos los temas deben estudiarse en un orden fijo?',
    hint: 'Una secuencia estricta, o libertad para saltar entre temas.',
    yesLabel: 'Sí — un orden fijo',
    yesMode: PATH_MODE.SEQUENTIAL,
    noLabel: 'No — flexible',
    noMode: PATH_MODE.GRAPH,
  },
  {
    question: '¿Hay temas opcionales o rutas alternativas hacia el mismo destino?',
    hint: 'Ramas, desvíos "opcionales", más de un camino posible.',
    yesLabel: 'Sí — hay ramas',
    yesMode: PATH_MODE.GRAPH,
    noLabel: 'No — un solo camino',
    noMode: PATH_MODE.SEQUENTIAL,
  },
  {
    question: '¿Es un mapa de referencia para explorar libremente, en vez de un recorrido paso a paso?',
    hint: 'Un mapa de conocimiento con prerequisitos, vs. una lista ordenada.',
    yesLabel: 'Sí — un mapa para explorar',
    yesMode: PATH_MODE.GRAPH,
    noLabel: 'No — un recorrido a seguir',
    noMode: PATH_MODE.SEQUENTIAL,
  },
];

const TOTAL_STEPS = 5;

@Component({
  selector: 'app-create-learning-path-wizard',
  standalone: true,
  templateUrl: './create-learning-path-wizard.component.html',
  providers: [{ provide: LearningPathRepository, useClass: LearningPathHttpRepository }],
  imports: [FormsModule],
})
export class CreateLearningPathWizardComponent {
  private readonly dialogRef = inject(MatDialogRef<CreateLearningPathWizardComponent, LearningPath | undefined>);
  private readonly repository = inject(LearningPathRepository);

  readonly PATH_MODE = PATH_MODE;
  readonly TOTAL_STEPS = TOTAL_STEPS;
  readonly questions = WIZARD_QUESTIONS;

  readonly step = signal(0);
  readonly title = signal('');
  readonly description = signal('');
  readonly answers = signal<Array<PathMode | null>>([null, null, null]);
  private readonly manualMode = signal<PathMode | null>(null);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly currentQuestion = computed<WizardQuestion | null>(() => {
    const step = this.step();
    return step >= 1 && step <= 3 ? this.questions[step - 1] : null;
  });

  readonly score = computed(() => this.answers().filter((a) => a === PATH_MODE.GRAPH).length);
  readonly answeredCount = computed(() => this.answers().filter((a) => a !== null).length);
  readonly suggestedMode = computed<PathMode>(() =>
    this.score() >= 2 ? PATH_MODE.GRAPH : PATH_MODE.SEQUENTIAL,
  );
  readonly effectiveMode = computed<PathMode>(() => this.manualMode() ?? this.suggestedMode());

  readonly meterPositionPercent = computed(() =>
    this.answeredCount() === 0 ? 50 : (this.score() / 3) * 100,
  );
  readonly meterLeaning = computed<PathMode | null>(() =>
    this.answeredCount() < 3 ? null : this.suggestedMode(),
  );

  readonly canAdvance = computed(() => {
    const step = this.step();
    if (step === 0) return this.title().trim().length > 0;
    if (step >= 1 && step <= 3) return this.answers()[step - 1] !== null;
    return true;
  });

  next(): void {
    if (this.canAdvance() && this.step() < TOTAL_STEPS - 1) this.step.update((s) => s + 1);
  }

  back(): void {
    if (this.step() > 0) this.step.update((s) => s - 1);
  }

  selectAnswer(mode: PathMode): void {
    const index = this.step() - 1;
    this.answers.update((current) => {
      const copy = [...current];
      copy[index] = mode;
      return copy;
    });
  }

  selectMode(mode: PathMode): void {
    this.manualMode.set(mode);
  }

  isSuggested(mode: PathMode): boolean {
    return this.suggestedMode() === mode;
  }

  isChosen(mode: PathMode): boolean {
    return this.effectiveMode() === mode;
  }

  async submit(): Promise<void> {
    const title = this.title().trim();
    if (!title || this.submitting()) return;

    this.submitting.set(true);
    this.errorMessage.set(null);
    try {
      const created = await this.repository.create({
        title,
        description: this.description().trim() || undefined,
        mode: this.effectiveMode(),
        source: PATH_SOURCE.MANUAL,
      });
      this.dialogRef.close(created);
    } catch {
      this.errorMessage.set('No se pudo crear el Learning Path. Probá de nuevo.');
    } finally {
      this.submitting.set(false);
    }
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}
