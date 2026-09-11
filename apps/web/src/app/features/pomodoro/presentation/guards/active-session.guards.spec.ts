import { TestBed } from '@angular/core/testing';
import { UrlTree, provideRouter } from '@angular/router';
import { PomodoroRepository } from '@features/pomodoro/domain/pomodoro.repository';
import { mockPomodoroRepository } from '@features/pomodoro/application/mocks/mock-pomodoro.repository';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { redirectIfActiveSessionGuard, requireActiveSessionGuard } from './active-session.guards';

function setup() {
  const repository = mockPomodoroRepository();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      PomodoroSessionStore,
      { provide: PomodoroRepository, useValue: repository },
    ],
  });
  const store = TestBed.inject(PomodoroSessionStore);
  return { repository, store };
}

function runGuard(guard: typeof requireActiveSessionGuard) {
  return TestBed.runInInjectionContext(() => guard({} as never, {} as never));
}

describe('requireActiveSessionGuard', () => {
  test('should allow activation when the store already has an active session', async () => {
    const { store } = setup();
    store.activeSession.set({
      id: crypto.randomUUID(),
      userId: crypto.randomUUID(),
      startedAt: new Date(),
      plannedMin: 25,
    });

    const result = await runGuard(requireActiveSessionGuard);

    expect(result).toBe(true);
  });

  test('should allow activation after rehydrating finds an active session', async () => {
    const { repository } = setup();
    repository.sessions.push({
      id: crypto.randomUUID(),
      userId: crypto.randomUUID(),
      startedAt: new Date(),
      plannedMin: 25,
    });

    const result = await runGuard(requireActiveSessionGuard);

    expect(result).toBe(true);
  });

  test('should redirect to the start screen when there is no active session', async () => {
    setup();

    const result = await runGuard(requireActiveSessionGuard);

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/pomodoro');
  });
});

describe('redirectIfActiveSessionGuard', () => {
  test('should redirect to the active screen when the store already has an active session', async () => {
    const { store } = setup();
    store.activeSession.set({
      id: crypto.randomUUID(),
      userId: crypto.randomUUID(),
      startedAt: new Date(),
      plannedMin: 25,
    });

    const result = await runGuard(redirectIfActiveSessionGuard);

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/pomodoro/active');
  });

  test('should redirect to the active screen after rehydrating finds an active session', async () => {
    const { repository } = setup();
    repository.sessions.push({
      id: crypto.randomUUID(),
      userId: crypto.randomUUID(),
      startedAt: new Date(),
      plannedMin: 25,
    });

    const result = await runGuard(redirectIfActiveSessionGuard);

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/pomodoro/active');
  });

  test('should allow activation when there is no active session', async () => {
    setup();

    const result = await runGuard(redirectIfActiveSessionGuard);

    expect(result).toBe(true);
  });
});
