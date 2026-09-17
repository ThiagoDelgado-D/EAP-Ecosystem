import { TestBed } from '@angular/core/testing';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { expect, vi } from 'vitest';

interface PlannedTimeReachedComponent {
  plannedTimeReached(): boolean;
  keepGoing(): Promise<void>;
}

export async function expectPlannedTimeReachedFlow(
  component: PlannedTimeReachedComponent,
  store: PomodoroSessionStore,
): Promise<void> {
  const session = await store.start({ plannedMin: 25, target: { kind: 'free' } });

  expect(component.plannedTimeReached()).toBe(false);

  vi.advanceTimersByTime(25 * 60 * 1000);
  TestBed.tick();

  expect(component.plannedTimeReached()).toBe(true);

  await component.keepGoing();

  expect(component.plannedTimeReached()).toBe(false);
  expect(store.activeSession()?.id).not.toBe(session!.id);
}
