import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import { LearningPathHttpRepository } from '@features/learning-path/infrastructure/learning-path-http.repository';
import type { LearningPath } from '@features/learning-path/domain/learning-path.model';
import type { EditLearningPathDialogData } from './edit-learning-path-dialog.types';

@Component({
  selector: 'app-edit-learning-path-dialog',
  standalone: true,
  templateUrl: './edit-learning-path-dialog.component.html',
  providers: [{ provide: LearningPathRepository, useClass: LearningPathHttpRepository }],
  imports: [FormsModule],
})
export class EditLearningPathDialogComponent {
  private readonly data = inject<EditLearningPathDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<EditLearningPathDialogComponent, LearningPath | undefined>,
  );
  private readonly repository = inject(LearningPathRepository);

  readonly title = signal(this.data.path.title);
  readonly description = signal(this.data.path.description ?? '');

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  async submit(): Promise<void> {
    const title = this.title().trim();
    if (!title || this.submitting()) return;

    this.submitting.set(true);
    this.errorMessage.set(null);
    try {
      const updated = await this.repository.update(this.data.path.id, {
        title,
        description: this.description().trim() || undefined,
      });
      this.dialogRef.close(updated);
    } catch {
      this.errorMessage.set('No se pudo guardar. Probá de nuevo.');
    } finally {
      this.submitting.set(false);
    }
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}
