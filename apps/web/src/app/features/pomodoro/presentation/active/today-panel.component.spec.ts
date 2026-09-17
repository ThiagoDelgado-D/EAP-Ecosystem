import { TestBed } from '@angular/core/testing';
import { PomodoroRepository } from '@features/pomodoro/domain/pomodoro.repository';
import { mockPomodoroRepository } from '@features/pomodoro/application/mocks/mock-pomodoro.repository';
import { TodayPanelComponent } from './today-panel.component';

describe('TodayPanelComponent', () => {
  function setup(repository: ReturnType<typeof mockPomodoroRepository>) {
    TestBed.configureTestingModule({
      providers: [{ provide: PomodoroRepository, useValue: repository }],
    });
    const fixture = TestBed.createComponent(TodayPanelComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  test('should total only sessions, ordered chronologically alongside breaks', async () => {
    const repository = mockPomodoroRepository();
    const userId = crypto.randomUUID();
    const earlierSessionId = crypto.randomUUID();
    const laterSessionId = crypto.randomUUID();
    const todayAt = (hours: number, minutes: number) => {
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    };
    repository.sessions.push(
      {
        id: laterSessionId,
        userId,
        startedAt: todayAt(9, 30),
        completedAt: todayAt(9, 55),
        plannedMin: 25,
      },
      {
        id: earlierSessionId,
        userId,
        startedAt: todayAt(9, 0),
        completedAt: todayAt(9, 25),
        plannedMin: 25,
      },
    );
    repository.breaks.push({
      id: crypto.randomUUID(),
      userId,
      startedAt: todayAt(9, 25),
      durationSec: 300,
      endedAt: todayAt(9, 30),
    });

    const component = setup(repository);
    await Promise.resolve();

    expect(component.loading()).toBe(false);
    expect(component.totalLabel()).toBe('50m');
    expect(component.blocks().map((block) => block.key)).toEqual([
      `session:${earlierSessionId}`,
      expect.stringMatching(/^break:/),
      `session:${laterSessionId}`,
    ]);
    expect(component.blocks().every((block) => !block.ongoing)).toBe(true);
  });

  test('should show nothing yet when there is no history for today', async () => {
    const component = setup(mockPomodoroRepository());
    await Promise.resolve();

    expect(component.loading()).toBe(false);
    expect(component.blocks()).toEqual([]);
    expect(component.totalLabel()).toBe('<1m');
  });
});
