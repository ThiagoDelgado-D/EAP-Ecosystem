import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogOptions } from './confirm-dialog.types';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    <div class="p-6 max-w-sm bg-slate-900 border border-slate-800 rounded-xl">
      <h2 class="text-lg font-semibold text-slate-100 mb-2">
        {{ data.title || 'Confirm action' }}
      </h2>
      <p class="text-sm text-slate-400 mb-6">{{ data.message }}</p>
      <div class="flex justify-end gap-3">
        <button
          (click)="onCancel()"
          class="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors"
        >
          {{ data.cancelLabel || 'Cancel' }}
        </button>
        <button
          (click)="onConfirm()"
          [class]="data.confirmButtonClass || 'bg-red-600 hover:bg-red-500 text-white'"
          class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
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
