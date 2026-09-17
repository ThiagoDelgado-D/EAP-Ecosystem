import { TestBed } from '@angular/core/testing';
import { createPomodoroComponentTestProviders } from '@features/pomodoro/application/mocks/pomodoro-component-test-providers';
import { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import { TodayPanelComponent } from './today-panel.component';

describe('TodayPanelComponent', () => {
  function createProviders() {
    return createPomodoroComponentTestProviders(() => {});
  }

  function mount(providers: ReturnType<typeof createProviders>['providers']) {
    TestBed.configureTestingModule({ providers });
    const fixture = TestBed.createComponent(TodayPanelComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  const todayAt = (hours: number, minutes: number) => {
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  test('should total only sessions, ordered chronologically alongside breaks', async () => {
    const { providers, pomodoroRepository } = createProviders();
    const userId = crypto.randomUUID();
    const earlierSessionId = crypto.randomUUID();
    const laterSessionId = crypto.randomUUID();
    pomodoroRepository.sessions.push(
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
    pomodoroRepository.breaks.push({
      id: crypto.randomUUID(),
      userId,
      startedAt: todayAt(9, 25),
      durationSec: 300,
      endedAt: todayAt(9, 30),
    });

    const component = mount(providers);
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
    const { providers } = createProviders();
    const component = mount(providers);
    await Promise.resolve();

    expect(component.loading()).toBe(false);
    expect(component.blocks()).toEqual([]);
    expect(component.totalLabel()).toBe('<1m');
  });

  test('should compose a session block from its segments, real resource titles included, sorted by time spent', async () => {
    const { providers, pomodoroRepository, learningResourceRepository } = createProviders();
    const userId = crypto.randomUUID();
    const sessionId = crypto.randomUUID();
    const reactDocsResourceId = crypto.randomUUID();
    learningResourceRepository.resources = [
      {
        id: reactDocsResourceId,
        title: 'React Docs',
        difficulty: 'Medium',
        energyLevel: 'Medium',
        status: 'Pending',
        estimatedDuration: { value: 30, isEstimated: true },
        topicIds: [],
        typeId: crypto.randomUUID(),
        createdAt: todayAt(9, 0),
        updatedAt: todayAt(9, 0),
      },
    ];
    pomodoroRepository.sessions.push({
      id: sessionId,
      userId,
      startedAt: todayAt(9, 0),
      completedAt: todayAt(9, 25),
      plannedMin: 25,
    });
    pomodoroRepository.segments.push(
      {
        id: crypto.randomUUID(),
        sessionId,
        startSec: 0,
        endSec: 900,
        targetKind: 'resource',
        resourceId: reactDocsResourceId,
      },
      {
        id: crypto.randomUUID(),
        sessionId,
        startSec: 900,
        endSec: 1500,
        targetKind: 'free',
      },
    );

    const component = mount(providers);
    await Promise.resolve();
    // In the real app, the parent ActiveComponent triggers this load before the Today tab is ever opened.
    await TestBed.inject(PomodoroPickerService).load();

    const [block] = component.blocks();
    expect(block!.breakdown).toEqual([
      { label: 'React Docs', secs: 900 },
      { label: 'Free focus', secs: 600 },
    ]);
  });
});
