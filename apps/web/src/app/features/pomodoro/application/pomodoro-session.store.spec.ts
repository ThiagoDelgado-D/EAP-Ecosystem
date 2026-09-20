import { TestBed } from '@angular/core/testing';
import { PomodoroRepository } from '@features/pomodoro/domain/pomodoro.repository';
import { mockPomodoroRepository } from './mocks/mock-pomodoro.repository';
import { mockAudio } from './mocks/mock-audio-element';
import { mockLocalStorage } from './mocks/mock-local-storage';
import { PomodoroSessionStore } from './pomodoro-session.store';

describe('PomodoroSessionStore', () => {
  let repository: ReturnType<typeof mockPomodoroRepository>;
  let store: PomodoroSessionStore;

  beforeEach(() => {
    repository = mockPomodoroRepository();
    TestBed.configureTestingModule({
      providers: [PomodoroSessionStore, { provide: PomodoroRepository, useValue: repository }],
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

    await store.start({
      plannedMin: 25,
      target: { kind: 'node', learningPathId: pathId, learningPathNodeId: nodeId },
    });

    expect(store.segments()).toEqual([
      {
        id: 'initial',
        sessionId: store.activeSession()!.id,
        startSec: 0,
        targetKind: 'node',
        learningPathId: pathId,
        learningPathNodeId: nodeId,
        resourceId: undefined,
      },
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
    const session = {
      id: sessionId,
      userId: crypto.randomUUID(),
      startedAt: new Date(),
      plannedMin: 50,
    };
    const segment = {
      id: crypto.randomUUID(),
      sessionId,
      startSec: 0,
      targetKind: 'free' as const,
    };
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

  test('should populate the active break on rehydrate when there is no active session', async () => {
    repository.breaks.push({
      id: crypto.randomUUID(),
      userId: crypto.randomUUID(),
      startedAt: new Date(),
      durationSec: 300,
    });

    const result = await store.rehydrate();

    expect(result).toBeNull();
    expect(store.phase()).toBe('break');
    expect(store.breakRemainingLabel()).toBe('05:00');
  });

  test('should retarget the open segment in place when attaching, keeping a single segment', async () => {
    await store.start({ plannedMin: 25, target: { kind: 'free' } });
    const pathId = crypto.randomUUID();
    const nodeId = crypto.randomUUID();

    await store.attachOpenSegment({
      kind: 'node',
      learningPathId: pathId,
      learningPathNodeId: nodeId,
    });

    const segments = store.segments();

    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({
      targetKind: 'node',
      learningPathId: pathId,
      learningPathNodeId: nodeId,
    });
  });

  describe('timer', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test('should count down remaining time once a session starts', async () => {
      await store.start({ plannedMin: 25, target: { kind: 'free' } });

      expect(store.remainingLabel()).toBe('25:00');

      vi.advanceTimersByTime(90 * 1000);

      expect(store.remainingLabel()).toBe('23:30');
    });

    test('should freeze the countdown while paused', async () => {
      await store.start({ plannedMin: 25, target: { kind: 'free' } });

      vi.advanceTimersByTime(10 * 1000);
      store.togglePause();
      vi.advanceTimersByTime(60 * 1000);

      expect(store.remainingLabel()).toBe('24:50');
    });

    test('should stop ticking and reset the countdown after the session ends', async () => {
      await store.start({ plannedMin: 25, target: { kind: 'free' } });
      vi.advanceTimersByTime(10 * 1000);

      await store.end();
      vi.advanceTimersByTime(60 * 1000);

      expect(store.elapsedSec()).toBe(0);
    });

    test('should resume ticking on rehydrate with paused reset to false', async () => {
      repository.sessions = [
        {
          id: crypto.randomUUID(),
          userId: crypto.randomUUID(),
          startedAt: new Date(),
          plannedMin: 25,
        },
      ];

      await store.rehydrate();

      expect(store.paused()).toBe(false);
      vi.advanceTimersByTime(30 * 1000);
      expect(store.elapsedSec()).toBe(30);
    });

    test('should show the boundary prompt once remaining time hits zero', async () => {
      await store.start({ plannedMin: 25, target: { kind: 'free' } });

      expect(store.plannedTimeReached()).toBe(false);

      vi.advanceTimersByTime(25 * 60 * 1000);
      TestBed.tick();

      expect(store.plannedTimeReached()).toBe(true);
    });

    test('continueAtPlannedTime should replace the active session and clear the prompt', async () => {
      const session = await store.start({ plannedMin: 25, target: { kind: 'free' } });
      vi.advanceTimersByTime(25 * 60 * 1000);
      TestBed.tick();

      await store.continueAtPlannedTime();

      expect(store.plannedTimeReached()).toBe(false);
      expect(store.activeSession()?.id).not.toBe(session!.id);
      expect(store.activeSession()?.completedAt).toBeUndefined();
    });

    test('extendFocusSession should grow the same session in place instead of starting a new one', async () => {
      const session = await store.start({ plannedMin: 25, target: { kind: 'free' } });

      await store.extendFocusSession(10);

      expect(store.activeSession()?.id).toBe(session!.id);
      expect(store.activeSession()?.plannedMin).toBe(35);
    });

    test('extendFocusSession should clear the boundary prompt and let it fire again later', async () => {
      await store.start({ plannedMin: 25, target: { kind: 'free' } });
      vi.advanceTimersByTime(25 * 60 * 1000);
      TestBed.tick();
      expect(store.plannedTimeReached()).toBe(true);

      await store.extendFocusSession(5);
      expect(store.plannedTimeReached()).toBe(false);

      vi.advanceTimersByTime(5 * 60 * 1000);
      TestBed.tick();
      expect(store.plannedTimeReached()).toBe(true);
    });
  });

  describe('auto-close safety net', () => {
    test('should populate justAutoClosed and leave activeSession null when the snapshot reports autoClosed', async () => {
      const closedSession = {
        id: crypto.randomUUID(),
        userId: crypto.randomUUID(),
        startedAt: new Date(Date.now() - 3600 * 1000),
        completedAt: new Date(),
        plannedMin: 25,
        autoCompleted: true,
      };
      repository.getActiveSession = async () => ({
        autoClosed: true,
        session: closedSession,
        segments: [],
      });

      const result = await store.rehydrate();

      expect(result).toBeNull();
      expect(store.activeSession()).toBeNull();
      expect(store.justAutoClosed()).toEqual({ session: closedSession, segments: [] });
    });

    test('clearAutoClosed should reset justAutoClosed to null', async () => {
      repository.getActiveSession = async () => ({
        autoClosed: true,
        session: {
          id: crypto.randomUUID(),
          userId: crypto.randomUUID(),
          startedAt: new Date(),
          completedAt: new Date(),
          plannedMin: 25,
        },
        segments: [],
      });
      await store.rehydrate();

      store.clearAutoClosed();

      expect(store.justAutoClosed()).toBeNull();
    });
  });

  describe('sound preference', () => {
    beforeEach(() => {
      vi.stubGlobal('localStorage', mockLocalStorage(null));
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    test('should default to enabled and flip when toggled', () => {
      expect(store.soundEnabled()).toBe(true);

      store.toggleSound();
      expect(store.soundEnabled()).toBe(false);

      store.toggleSound();
      expect(store.soundEnabled()).toBe(true);
    });

    test('should default the boundary sound to chime and allow choosing another one', () => {
      expect(store.soundId()).toBe('chime');

      store.setSoundId('kitchen');

      expect(store.soundId()).toBe('kitchen');
    });

    test('should default the volume to 0.6 and clamp out-of-range values', () => {
      expect(store.volume()).toBe(0.6);

      store.setVolume(0.2);
      expect(store.volume()).toBe(0.2);

      store.setVolume(5);
      expect(store.volume()).toBe(1);

      store.setVolume(-1);
      expect(store.volume()).toBe(0);
    });

    describe('boundary chime playback', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
      });

      test('should play the chosen sound at the chosen volume once the planned time is reached', async () => {
        const { AudioCtor, instances } = mockAudio();
        vi.stubGlobal('Audio', AudioCtor);
        store.setSoundId('digital');
        store.setVolume(0.3);

        await store.start({ plannedMin: 25, target: { kind: 'free' } });
        vi.advanceTimersByTime(25 * 60 * 1000);
        TestBed.tick();

        expect(instances).toHaveLength(1);
        expect(instances[0].src).toBe('/sounds/digital.mp3');
        expect(instances[0].volume).toBe(0.3);
        expect(instances[0].play).toHaveBeenCalled();
      });

      test('should not play a sound when muted', async () => {
        const { AudioCtor, instances } = mockAudio();
        vi.stubGlobal('Audio', AudioCtor);
        store.toggleSound();

        await store.start({ plannedMin: 25, target: { kind: 'free' } });
        vi.advanceTimersByTime(25 * 60 * 1000);
        TestBed.tick();

        expect(instances).toHaveLength(0);
      });
    });
  });

  describe('break', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test('should end the active session immediately when a break starts', async () => {
      await store.start({ plannedMin: 45, target: { kind: 'free' } });
      vi.advanceTimersByTime(30 * 60 * 1000);

      await store.startBreak();

      expect(store.activeSession()).toBeNull();
      expect(store.segments()).toEqual([]);
      expect(repository.sessions[0]?.completedAt).toBeDefined();
    });

    test('should keep the session active if starting the break fails', async () => {
      await store.start({ plannedMin: 25, target: { kind: 'free' } });
      repository.startBreak = async () => Promise.reject(new Error('network down'));

      await expect(store.startBreak()).rejects.toThrow('network down');

      expect(store.activeSession()).not.toBeNull();
      expect(store.phase()).toBe('focus');
    });

    test('should switch to the break phase with the duration the repository returns', async () => {
      await store.start({ plannedMin: 25, target: { kind: 'free' } });

      await store.startBreak();

      expect(store.phase()).toBe('break');
      expect(store.breakRemainingLabel()).toBe('05:00');
    });

    test('should add 5 minutes to the break when extended', async () => {
      await store.start({ plannedMin: 25, target: { kind: 'free' } });
      await store.startBreak();
      vi.advanceTimersByTime(4 * 60 * 1000);

      await store.extendBreak();

      expect(store.breakRemainingLabel()).toBe('06:00');
    });

    test('should start the break unpaused even if focus was paused beforehand', async () => {
      await store.start({ plannedMin: 25, target: { kind: 'free' } });
      store.togglePause();

      await store.startBreak();
      vi.advanceTimersByTime(30 * 1000);

      expect(store.paused()).toBe(false);
      expect(store.breakRemainingLabel()).toBe('04:30');
    });

    test('should return to idle, with no session, once the break ends', async () => {
      await store.start({ plannedMin: 25, target: { kind: 'free' } });
      await store.startBreak();
      vi.advanceTimersByTime(60 * 1000);

      await store.endBreak();
      vi.advanceTimersByTime(5 * 1000);

      expect(store.phase()).toBe('focus');
      expect(store.activeSession()).toBeNull();
      expect(store.elapsedSec()).toBe(0);
      expect(store.breakRemainingSec()).toBe(0);
    });
  });
});
