import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConfirmDialogService } from '@core/dialogs/confirm-dialog.service';
import { ERROR_MESSAGES } from '@core/errors/error-messages';
import { offlineError } from '@core/errors/mocks/offline-error.fixture';
import { ToastService } from '@core/toast/toast.service';
import { PreferencesService } from '@features/settings/application/preferences.service';
import { SessionService } from '@features/settings/application/session.service';
import { mockPreferencesRepository } from '@features/settings/application/mocks/mock-preferences.repository';
import {
  mockSessionRepository,
  sessionFixture,
} from '@features/settings/application/mocks/mock-session.repository';
import { PreferencesRepository } from '@features/settings/domain/preferences.repository';
import { SessionRepository } from '@features/settings/domain/session.repository';
import { DangerZoneComponent } from './danger-zone.component';

const SIGNED_OUT_OTHERS_TOAST = 'All other sessions terminated';
const ERROR_TOAST_TYPE = 'error';
const SUCCESS_TOAST_TYPE = 'success';

describe('DangerZoneComponent', () => {
  function setup() {
    const sessionRepository = mockSessionRepository([sessionFixture(true), sessionFixture(false)]);
    const preferencesRepository = mockPreferencesRepository();
    TestBed.configureTestingModule({
      imports: [DangerZoneComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        SessionService,
        PreferencesService,
        { provide: SessionRepository, useValue: sessionRepository },
        { provide: PreferencesRepository, useValue: preferencesRepository },
        { provide: ConfirmDialogService, useValue: { confirm: () => Promise.resolve(true) } },
      ],
    });
    const toast = TestBed.inject(ToastService);
    vi.spyOn(toast, 'show');
    return {
      component: TestBed.createComponent(DangerZoneComponent).componentInstance,
      sessionRepository,
      preferencesRepository,
      toast,
    };
  }

  test('should report why signing out the other devices failed instead of confirming it', async () => {
    const { component, sessionRepository, toast } = setup();
    vi.spyOn(sessionRepository, 'revokeAllOtherSessions').mockRejectedValueOnce(offlineError());

    await component.revokeAllOtherSessions();

    expect(toast.show).toHaveBeenCalledWith(ERROR_MESSAGES.NETWORK_ERROR, ERROR_TOAST_TYPE);
    expect(toast.show).not.toHaveBeenCalledWith(SIGNED_OUT_OTHERS_TOAST, expect.anything());
  });

  test('should confirm once the other devices are signed out', async () => {
    const { component, toast } = setup();

    await component.revokeAllOtherSessions();

    expect(toast.show).toHaveBeenCalledWith(SIGNED_OUT_OTHERS_TOAST, SUCCESS_TOAST_TYPE);
  });
});
