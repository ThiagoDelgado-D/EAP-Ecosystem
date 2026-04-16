import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { ConfirmDialogOptions } from './confirm-dialog.types';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly dialog = inject(MatDialog);

  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: options,
      panelClass: 'confirm-dark-dialog',
      autoFocus: false,
      width: '400px',
    });
    return dialogRef.afterClosed().toPromise() as Promise<boolean>;
  }
}
