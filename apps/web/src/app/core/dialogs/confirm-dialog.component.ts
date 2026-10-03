import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogOptions } from './confirm-dialog.types';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    <div class="p-6 max-w-sm">
      <h2 class="text-lg font-semibold text-ink-strong mb-2">
        {{ data.title || 'Confirm action' }}
      </h2>
      <p class="text-sm text-ink-dim leading-normal mb-6">{{ data.message }}</p>
      <div class="flex justify-end gap-3">
        <button
          (click)="onCancel()"
          class="px-4 py-2 text-sm font-medium text-ink-body hover:text-ink-strong transition-colors"
        >
          {{ data.cancelLabel || 'Cancel' }}
        </button>
        <button
          (click)="onConfirm()"
          class="px-4 py-2 text-sm font-medium rounded-lg bg-energy-high text-surface-raised hover:brightness-110 transition-[filter]"
        >
          {{ data.confirmLabel || 'Delete' }}
        </button>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogOptions,
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
