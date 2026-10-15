import { TestBed } from '@angular/core/testing';
import { ErrorNotifier } from '@core/errors/error-notifier.service';
import { offlineError } from '@core/errors/mocks/offline-error.fixture';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { PomodoroRepository } from '@features/pomodoro/domain/pomodoro.repository';
import { expect, vi, type Mock } from 'vitest';

interface FinishBreakComponent {
  finishBreak(): Promise<void>;
}

export async function expectFailedFinishBreakToStay(
  component: FinishBreakComponent,
  store: PomodoroSessionStore,
  navigateByUrl: Mock,
): Promise<void> {
  await store.start({ plannedMin: 25, target: { kind: 'free' } });
  await store.startBreak();
  const offline = offlineError();
  vi.spyOn(TestBed.inject(PomodoroRepository), 'endBreak').mockRejectedValueOnce(offline);
  const notify = vi.spyOn(TestBed.inject(ErrorNotifier), 'notify');

  await component.finishBreak();

  expect(notify).toHaveBeenCalledWith(offline);
  expect(store.phase()).toBe('break');
  expect(navigateByUrl).not.toHaveBeenCalled();
}
