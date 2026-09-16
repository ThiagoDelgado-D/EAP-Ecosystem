import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PomodoroRepository } from '@features/pomodoro/domain/pomodoro.repository';
import { mockPomodoroRepository } from '@features/pomodoro/application/mocks/mock-pomodoro.repository';
import type { Session } from '@features/pomodoro/domain/pomodoro.model';
import { WeeklySummaryComponent } from './weekly-summary.component';

function buildSession(startedAt: Date): Session {
  return { id: crypto.randomUUID(), userId: 'user-1', startedAt, completedAt: startedAt, plannedMin: 25 };
}

function setup(sessions: Session[] = []) {
  const repository = mockPomodoroRepository({ sessions });
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: PomodoroRepository, useValue: repository }],
  });
  const component = TestBed.createComponent(WeeklySummaryComponent).componentInstance;
  return { component, repository };
}

describe('WeeklySummaryComponent', () => {
  test('should surface a failed state when the history request rejects', async () => {
    const { component, repository } = setup();
    repository.getHistory = () => Promise.reject(new Error('network down'));

    await component.load();

    expect(component.failed()).toBe(true);
    expect(component.loading()).toBe(false);
  });

  test('should load this week totals from the repository on construction', async () => {
    const { component } = setup([buildSession(new Date())]);
    await component.load();

    expect(component.failed()).toBe(false);
    expect(component.summary()?.thisWeek.focus.sessionCount).toBe(1);
  });
});
