import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { ConfirmDialogOptions } from './confirm-dialog.types';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly dialog = inject(MatDialog);

  async confirm(options: ConfirmDialogOptions): Promise<boolean> {
    const dialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogOptions, boolean>(
      ConfirmDialogComponent,
      {
        data: options,
        panelClass: 'confirm-dark-dialog',
        autoFocus: false,
        width: '400px',
      },
    );

    const result = await firstValueFrom(dialogRef.afterClosed());
    return result ?? false;
  }
}
