import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { PomodoroRepository } from '@features/pomodoro/domain/pomodoro.repository';
import { mockPomodoroRepository } from '@features/pomodoro/application/mocks/mock-pomodoro.repository';
import { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import type { Segment, Session } from '@features/pomodoro/domain/pomodoro.model';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import { mockLearningPathRepository } from '@features/learning-path/application/mocks/mock-learning-path.repository';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import { mockLearningResourceRepository } from '@features/learning-resource/application/mocks/mock-learning-resource.repository';
import { WeeklySummaryComponent, WEEK_LOG_SCOPE } from './weekly-summary.component';

function buildSession(startedAt: Date): Session {
  return { id: crypto.randomUUID(), userId: 'user-1', startedAt, completedAt: startedAt, plannedMin: 25 };
}

function buildFreeSegment(sessionId: string, endSec = 1500): Segment {
  return { id: crypto.randomUUID(), sessionId, startSec: 0, endSec, targetKind: 'free' };
}

function setup(sessions: Session[] = [], segments: Segment[] = []) {
  const repository = mockPomodoroRepository({ sessions, segments });
  const dialogOpen = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      PomodoroPickerService,
      { provide: PomodoroRepository, useValue: repository },
      { provide: LearningPathRepository, useValue: mockLearningPathRepository() },
      { provide: LearningResourceRepository, useValue: mockLearningResourceRepository() },
      { provide: MatDialog, useValue: { open: dialogOpen } },
    ],
  });
  const component = TestBed.createComponent(WeeklySummaryComponent).componentInstance;
  return { component, repository, dialogOpen };
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

  test('should build a 7-day log alongside the summary', async () => {
    const { component } = setup([buildSession(new Date())]);
    await component.load();

    expect(component.dayLog()).toHaveLength(7);
    expect(component.dayLog().filter((day) => day.sessionCount > 0)).toHaveLength(1);
  });

  test('should toggle a session open and closed by id', async () => {
    const session = buildSession(new Date());
    const { component } = setup([session]);
    await component.load();

    expect(component.isOpen(session.id)).toBe(false);

    component.toggleSession(session.id);
    expect(component.isOpen(session.id)).toBe(true);

    component.toggleSession(session.id);
    expect(component.isOpen(session.id)).toBe(false);
  });

  test('should only keep one session open at a time', async () => {
    const first = buildSession(new Date());
    const second = buildSession(new Date());
    const { component } = setup([first, second]);
    await component.load();

    component.toggleSession(first.id);
    component.toggleSession(second.id);

    expect(component.isOpen(first.id)).toBe(false);
    expect(component.isOpen(second.id)).toBe(true);
  });

  test('should filter the day log to loose sessions when the unattributed scope is picked', async () => {
    const attributed = buildSession(new Date());
    const loose = buildSession(new Date());
    const segments = [
      { id: crypto.randomUUID(), sessionId: attributed.id, startSec: 0, endSec: 900, targetKind: 'resource' as const, resourceId: crypto.randomUUID() },
      buildFreeSegment(loose.id),
    ];
    const { component } = setup([attributed, loose], segments);
    await component.load();

    expect(component.allCount()).toBe(2);
    expect(component.unattributedCount()).toBe(1);

    component.setScope(WEEK_LOG_SCOPE.UNATTRIBUTED);
    const today = component.dayLog().find((day) => day.sessionCount > 0)!;

    expect(component.visibleSessions(today)).toHaveLength(1);
    expect(component.visibleSessions(today)[0]!.session.id).toBe(loose.id);
  });

  test('should attribute a loose session through the picker dialog and reload', async () => {
    const session = buildSession(new Date());
    const segments = [buildFreeSegment(session.id)];
    const { component, repository, dialogOpen } = setup([session], segments);
    await component.load();
    const target = { kind: 'resource' as const, resourceId: crypto.randomUUID() };
    dialogOpen.mockReturnValue({ afterClosed: () => of(target) });
    const attributeSpy = vi.spyOn(repository, 'attributeSession');

    const day = component.dayLog().find((d) => d.sessionCount > 0)!;
    const daySession = day.sessions[0]!;
    expect(component.isLoose(daySession)).toBe(true);

    await component.attributeSession(daySession);

    expect(attributeSpy).toHaveBeenCalledWith(session.id, target);
    expect(component.attributing()).toBeNull();
  });

  test('should not attribute anything when the picker dialog is dismissed', async () => {
    const session = buildSession(new Date());
    const segments = [buildFreeSegment(session.id)];
    const { component, repository, dialogOpen } = setup([session], segments);
    await component.load();
    dialogOpen.mockReturnValue({ afterClosed: () => of(undefined) });
    const attributeSpy = vi.spyOn(repository, 'attributeSession');

    const day = component.dayLog().find((d) => d.sessionCount > 0)!;
    await component.attributeSession(day.sessions[0]!);

    expect(attributeSpy).not.toHaveBeenCalled();
  });
});
