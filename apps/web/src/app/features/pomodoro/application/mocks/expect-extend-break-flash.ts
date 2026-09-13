import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { expect, vi } from 'vitest';

interface ExtendBreakComponent {
  justExtended(): boolean;
  extendBreak(): void;
}

export async function expectExtendBreakFlash(
  component: ExtendBreakComponent,
  store: PomodoroSessionStore,
): Promise<void> {
  vi.useFakeTimers();
  await store.start({ plannedMin: 25, target: { kind: 'free' } });
  await store.startBreak();

  component.extendBreak();

  expect(component.justExtended()).toBe(true);
  vi.advanceTimersByTime(900);
  expect(component.justExtended()).toBe(false);
  vi.useRealTimers();
}
