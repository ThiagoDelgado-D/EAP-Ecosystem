import { TestBed } from '@angular/core/testing';
import { ERROR_MESSAGES } from '@core/errors/error-messages';
import { offlineError } from '@core/errors/mocks/offline-error.fixture';
import { SessionRepository } from '@features/settings/domain/session.repository';
import {
  mockSessionRepository,
  sessionFixture,
  type MockedSessionRepository,
} from './mocks/mock-session.repository';
import { SessionService } from './session.service';

describe('SessionService', () => {
  const currentDevice = sessionFixture(true);
  const oldLaptop = sessionFixture(false);
  const borrowedPhone = sessionFixture(false);

  let sessionRepository: MockedSessionRepository;
  let service: SessionService;

  beforeEach(async () => {
    sessionRepository = mockSessionRepository([currentDevice, oldLaptop, borrowedPhone]);
    TestBed.configureTestingModule({
      providers: [SessionService, { provide: SessionRepository, useValue: sessionRepository }],
    });
    service = TestBed.inject(SessionService);
    await service.loadSessions();
  });

  test('should explain why the sessions could not load', async () => {
    vi.spyOn(sessionRepository, 'getSessions').mockRejectedValueOnce(offlineError());

    await service.loadSessions();

    expect(service.error()).toBe(ERROR_MESSAGES.NETWORK_ERROR);
  });

  test('should bring a session back and explain why when revoking it fails', async () => {
    vi.spyOn(sessionRepository, 'revokeSession').mockRejectedValueOnce(offlineError());

    await service.revokeSession(oldLaptop.id);

    expect(service.sessions()).toContainEqual(oldLaptop);
    expect(service.error()).toBe(ERROR_MESSAGES.NETWORK_ERROR);
  });

  test('should bring the other sessions back and explain why when signing them out fails', async () => {
    vi.spyOn(sessionRepository, 'revokeAllOtherSessions').mockRejectedValueOnce(offlineError());

    await service.revokeAllOtherSessions();

    expect(service.sessions()).toEqual(expect.arrayContaining([oldLaptop, borrowedPhone]));
    expect(service.error()).toBe(ERROR_MESSAGES.NETWORK_ERROR);
  });

  test('should leave no error once the other sessions are signed out', async () => {
    await service.revokeAllOtherSessions();

    expect(service.sessions()).toEqual([currentDevice]);
    expect(service.error()).toBeNull();
  });
});
