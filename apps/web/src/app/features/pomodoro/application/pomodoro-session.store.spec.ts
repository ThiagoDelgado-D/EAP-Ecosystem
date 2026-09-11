import { TestBed } from '@angular/core/testing';
import { PomodoroRepository } from '@features/pomodoro/domain/pomodoro.repository';
import { mockPomodoroRepository } from './mocks/mock-pomodoro.repository';
import { PomodoroSessionStore } from './pomodoro-session.store';

describe('PomodoroSessionStore', () => {
  let repository: ReturnType<typeof mockPomodoroRepository>;
  let store: PomodoroSessionStore;

  beforeEach(() => {
    repository = mockPomodoroRepository();
    TestBed.configureTestingModule({
      providers: [
        PomodoroSessionStore,
        { provide: PomodoroRepository, useValue: repository },
      ],
    });
    store = TestBed.inject(PomodoroSessionStore);
  });

  test('should load suggestions from the repository', async () => {
    repository.suggestions = [
      {
        pathId: crypto.randomUUID(),
        pathTitle: 'Rust for Backend Engineers',
        nodeId: crypto.randomUUID(),
        nodeTitle: 'Trait Objects',
        score: 50,
        why: ['In progress'],
      },
    ];

    await store.loadSuggestions();

    expect(store.suggestions()).toEqual(repository.suggestions);
    expect(store.suggestionsLoading()).toBe(false);
    expect(store.suggestionsError()).toBe(false);
  });

  test('should flag suggestionsError when fetching suggestions fails', async () => {
    repository.getSuggestion = async () => Promise.reject(new Error('network down'));

    await store.loadSuggestions();

    expect(store.suggestions()).toEqual([]);
    expect(store.suggestionsError()).toBe(true);
  });

  test('should clear a previous suggestionsError on a successful retry', async () => {
    repository.getSuggestion = async () => Promise.reject(new Error('network down'));
    await store.loadSuggestions();
    repository.getSuggestion = async () => repository.suggestions;

    await store.loadSuggestions();

    expect(store.suggestionsError()).toBe(false);
  });

  test('should set the active session and clear the error after a successful start', async () => {
    const session = await store.start({ plannedMin: 25, target: { kind: 'free' } });

    expect(session).toEqual(store.activeSession());
    expect(store.activeSession()?.plannedMin).toBe(25);
    expect(store.error()).toBeNull();
    expect(store.starting()).toBe(false);
  });

  test('should set an error and leave activeSession null when starting fails', async () => {
    repository.startSession = async () => Promise.reject(new Error('network down'));

    const session = await store.start({ plannedMin: 25, target: { kind: 'free' } });

    expect(session).toBeUndefined();
    expect(store.activeSession()).toBeNull();
    expect(store.error()).toBe('We could not start the session.');
  });

  test('should clear the active session after ending it', async () => {
    await store.start({ plannedMin: 25, target: { kind: 'free' } });

    const result = await store.end();

    expect(result?.discarded).toBe(false);
    expect(store.activeSession()).toBeNull();
  });

  test('should do nothing when ending with no active session', async () => {
    const result = await store.end();

    expect(result).toBeUndefined();
  });

  test('should seed a synthetic initial segment matching the starting target', async () => {
    const pathId = crypto.randomUUID();
    const nodeId = crypto.randomUUID();

    await store.start({ plannedMin: 25, target: { kind: 'node', learningPathId: pathId, learningPathNodeId: nodeId } });

    expect(store.segments()).toEqual([
      { id: 'initial', sessionId: store.activeSession()!.id, startSec: 0, targetKind: 'node', learningPathId: pathId, learningPathNodeId: nodeId, resourceId: undefined },
    ]);
  });

  test('should close the previous segment and open a new one when switching target', async () => {
    await store.start({ plannedMin: 25, target: { kind: 'free' } });

    const resourceId = crypto.randomUUID();
    await store.switchTarget({ kind: 'resource', resourceId });

    const segs = store.segments();
    expect(segs).toHaveLength(2);
    expect(segs[0].endSec).toBeDefined();
    expect(segs[1].targetKind).toBe('resource');
    expect(store.switchingTarget()).toBe(false);
  });

  test('should clear segments after ending the session', async () => {
    await store.start({ plannedMin: 25, target: { kind: 'free' } });

    await store.end();

    expect(store.segments()).toEqual([]);
  });

  test('should populate the active session and its segments on rehydrate', async () => {
    const sessionId = crypto.randomUUID();
    const session = { id: sessionId, userId: crypto.randomUUID(), startedAt: new Date(), plannedMin: 50 };
    const segment = { id: crypto.randomUUID(), sessionId, startSec: 0, targetKind: 'free' as const };
    repository.sessions.push(session);
    repository.segments.push(segment);

    const result = await store.rehydrate();

    expect(result).toEqual(session);
    expect(store.activeSession()).toEqual(session);
    expect(store.segments()).toEqual([segment]);
    expect(store.rehydrating()).toBe(false);
  });

  test('should return null from rehydrate when there is no active session', async () => {
    const result = await store.rehydrate();

    expect(result).toBeNull();
    expect(store.activeSession()).toBeNull();
  });
});
