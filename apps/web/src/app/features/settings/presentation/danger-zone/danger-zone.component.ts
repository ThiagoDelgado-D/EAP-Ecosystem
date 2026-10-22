import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PreferencesService } from '@features/settings/application/preferences.service';
import { SessionService } from '@features/settings/application/session.service';
import { AuthHttpService } from '@features/auth/infrastructure/auth-http.service';
import { AuthStore } from '@features/auth/application/auth.store';
import { ConfirmDialogService } from '@core/dialogs/confirm-dialog.service';
import { ToastService } from '@core/toast/toast.service';
import { ErrorNotifier } from '@core/errors/error-notifier.service';

@Component({
  selector: 'app-danger-zone',
  standalone: true,
  templateUrl: './danger-zone.component.html',
})
export class DangerZoneComponent {
  private readonly preferencesService = inject(PreferencesService);
  private readonly sessionService = inject(SessionService);
  private readonly authHttp = inject(AuthHttpService);
  private readonly authStore = inject(AuthStore);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toastService = inject(ToastService);
  private readonly errorNotifier = inject(ErrorNotifier);
  private readonly router = inject(Router);

  readonly saving = this.preferencesService.saving;

  async resetPreferences(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Reset preferences',
      message:
        'This will turn every module back on and restore the default dashboard widgets. This action cannot be undone.',
      confirmLabel: 'Reset',
    });
    if (!confirmed) return;

    try {
      await this.preferencesService.resetPreferences();
      this.toastService.show('Preferences reset successfully', 'success');
    } catch (error) {
      this.errorNotifier.notify(error);
    }
  }

  async revokeAllOtherSessions(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Sign out all other devices',
      message: 'All active sessions except your current one will be terminated immediately.',
      confirmLabel: 'Sign out others',
    });
    if (!confirmed) return;

    await this.sessionService.revokeAllOtherSessions();
    const failure = this.sessionService.error();
    if (failure) {
      this.toastService.show(failure, 'error');
      return;
    }
    this.toastService.show('All other sessions terminated', 'success');
  }

  async deleteAccount(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete account',
      message:
        'Your account and all associated data will be permanently deleted. This action cannot be undone.',
      confirmLabel: 'Delete account',
    });
    if (!confirmed) return;

    this.toastService.show(
      'Coming soon — account deletion will be available in a future version.',
      'info',
    );
  }
}
