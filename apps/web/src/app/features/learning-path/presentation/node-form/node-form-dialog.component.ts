import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import { LearningPathHttpRepository } from '@features/learning-path/infrastructure/learning-path-http.repository';
import type { LearningPathNode } from '@features/learning-path/domain/learning-path.model';
import type { NodeFormDialogData } from './node-form-dialog.types';

@Component({
  selector: 'app-node-form-dialog',
  standalone: true,
  templateUrl: './node-form-dialog.component.html',
  providers: [{ provide: LearningPathRepository, useClass: LearningPathHttpRepository }],
  imports: [FormsModule],
})
export class NodeFormDialogComponent {
  private readonly data = inject<NodeFormDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<NodeFormDialogComponent, LearningPathNode | undefined>,
  );
  private readonly repository = inject(LearningPathRepository);

  readonly isEditing = !!this.data.node;

  readonly title = signal(this.data.node?.title ?? '');
  readonly description = signal(this.data.node?.description ?? '');
  readonly externalUrl = signal(this.data.node?.externalUrl ?? '');

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  async submit(): Promise<void> {
    const title = this.title().trim();
    if (!title || this.submitting()) return;

    this.submitting.set(true);
    this.errorMessage.set(null);
    try {
      const node = this.data.node
        ? await this.repository.updateNode(this.data.pathId, this.data.node.id, {
            title,
            description: this.description().trim() || undefined,
            externalUrl: this.externalUrl().trim() || undefined,
          })
        : await this.repository.addNode(this.data.pathId, {
            title,
            description: this.description().trim() || undefined,
            externalUrl: this.externalUrl().trim() || undefined,
          });
      this.dialogRef.close(node);
    } catch {
      this.errorMessage.set('No se pudo guardar el nodo. Revisá los datos y probá de nuevo.');
    } finally {
      this.submitting.set(false);
    }
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}
