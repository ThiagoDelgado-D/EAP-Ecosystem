import { EnvironmentInjector, Injectable, computed, inject, signal } from '@angular/core';
import { PomodoroRepository } from '@features/pomodoro/domain/pomodoro.repository';
import type {
  Break,
  CandidateEnergyLevel,
  EndSessionResult,
  Segment,
  SegmentTarget,
  Session,
  StartSessionPayload,
  SuggestedCandidate,
} from '@features/pomodoro/domain/pomodoro.model';

export type PomodoroPhase = 'focus' | 'break';

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function syntheticInitialSegment(sessionId: string, target: SegmentTarget): Segment {
  const base = { id: 'initial', sessionId, startSec: 0 };
  if (target.kind === 'node') {
    return {
      ...base,
      targetKind: 'node',
      learningPathId: target.learningPathId,
      learningPathNodeId: target.learningPathNodeId,
      resourceId: target.resourceId,
    };
  }
  if (target.kind === 'resource') {
    return { ...base, targetKind: 'resource', resourceId: target.resourceId };
  }
  return { ...base, targetKind: 'free' };
}

@Injectable()
export class PomodoroSessionStore {
  private readonly repository = inject(PomodoroRepository);
  private readonly injector = inject(EnvironmentInjector);
  private miniWidgetOrchestratorLoaded = false;

  readonly activeSession = signal<Session | null>(null);
  readonly segments = signal<Segment[]>([]);
  readonly suggestions = signal<SuggestedCandidate[]>([]);
  readonly suggestionsLoading = signal(false);
  readonly suggestionsError = signal(false);
  readonly starting = signal(false);
  readonly switchingTarget = signal(false);
  readonly rehydrating = signal(false);
  readonly error = signal<string | null>(null);

  readonly paused = signal(false);
  readonly phase = signal<PomodoroPhase>('focus');
  private readonly now = signal(new Date());
  private intervalId: ReturnType<typeof setInterval> | null = null;

  readonly activeBreak = signal<Break | null>(null);
  private readonly breakNow = signal(new Date());

  readonly elapsedSec = computed(() => {
    const session = this.activeSession();
    if (!session) return 0;
    return Math.max(0, Math.floor((this.now().getTime() - session.startedAt.getTime()) / 1000));
  });

  readonly totalSec = computed(() => (this.activeSession()?.plannedMin ?? 0) * 60);

  readonly remainingSec = computed(() => Math.max(0, this.totalSec() - this.elapsedSec()));

  readonly remainingLabel = computed(() => formatClock(this.remainingSec()));

  readonly progressFraction = computed(() => {
    const total = this.totalSec();
    return total > 0 ? Math.min(1, this.elapsedSec() / total) : 0;
  });

  readonly breakElapsedSec = computed(() => {
    const startedAt = this.activeBreak()?.startedAt;
    if (!startedAt) return 0;
    return Math.max(0, Math.floor((this.breakNow().getTime() - startedAt.getTime()) / 1000));
  });

  readonly breakRemainingSec = computed(() =>
    Math.max(0, (this.activeBreak()?.durationSec ?? 0) - this.breakElapsedSec()),
  );

  readonly breakRemainingLabel = computed(() => formatClock(this.breakRemainingSec()));

  readonly breakProgressFraction = computed(() => {
    const total = this.activeBreak()?.durationSec ?? 0;
    return total > 0 ? Math.min(1, this.breakElapsedSec() / total) : 0;
  });

  togglePause(): void {
    this.paused.update((v) => !v);
  }

  async startBreak(): Promise<void> {
    if (this.activeSession()) await this.end();
    const activeBreak = await this.repository.startBreak();
    this.activeBreak.set(activeBreak);
    this.breakNow.set(new Date());
    this.phase.set('break');
    this.startTicking();
  }

  async extendBreak(seconds = 300): Promise<void> {
    const activeBreak = this.activeBreak();
    if (!activeBreak) return;
    const extended = await this.repository.extendBreak(activeBreak.id, seconds);
    this.activeBreak.set(extended);
  }

  async endBreak(): Promise<void> {
    const activeBreak = this.activeBreak();
    if (!activeBreak) return;
    await this.repository.endBreak(activeBreak.id);
    this.stopTicking();
    this.phase.set('focus');
    this.activeBreak.set(null);
    this.paused.set(false);
  }

  private startTicking(): void {
    this.stopTicking();
    this.paused.set(false);
    this.now.set(new Date());
    this.intervalId = setInterval(() => {
      if (this.paused()) return;
      if (this.phase() === 'break') this.breakNow.set(new Date());
      else this.now.set(new Date());
    }, 1000);
    this.ensureMiniWidgetOrchestrator();
  }

  private stopTicking(): void {
    if (this.intervalId !== null) clearInterval(this.intervalId);
    this.intervalId = null;
  }

  private ensureMiniWidgetOrchestrator(): void {
    if (this.miniWidgetOrchestratorLoaded) return;
    this.miniWidgetOrchestratorLoaded = true;
    import('./pomodoro-mini-widget-orchestrator.service')
      .then(({ PomodoroMiniWidgetOrchestratorService }) => {
        this.injector.get(PomodoroMiniWidgetOrchestratorService);
      })
      .catch(() => {});
  }

  async rehydrate(): Promise<Session | null> {
    this.rehydrating.set(true);
    try {
      const snapshot = await this.repository.getActiveSession();
      if (snapshot) {
        this.activeSession.set(snapshot.session);
        this.segments.set(snapshot.segments);
        this.phase.set('focus');
        this.startTicking();
        return snapshot.session;
      }

      const activeBreak = await this.repository.getActiveBreak();
      if (activeBreak) {
        this.activeBreak.set(activeBreak);
        this.breakNow.set(new Date());
        this.phase.set('break');
        this.startTicking();
      }
      return null;
    } catch {
      return null;
    } finally {
      this.rehydrating.set(false);
    }
  }

  async loadSuggestions(energy?: CandidateEnergyLevel): Promise<void> {
    this.suggestionsLoading.set(true);
    this.suggestionsError.set(false);
    try {
      this.suggestions.set(await this.repository.getSuggestion(energy));
    } catch {
      this.suggestions.set([]);
      this.suggestionsError.set(true);
    } finally {
      this.suggestionsLoading.set(false);
    }
  }

  async start(payload: StartSessionPayload): Promise<Session | undefined> {
    this.starting.set(true);
    this.error.set(null);
    try {
      const session = await this.repository.startSession(payload);
      this.activeSession.set(session);
      this.segments.set([syntheticInitialSegment(session.id, payload.target)]);
      this.phase.set('focus');
      this.startTicking();
      return session;
    } catch {
      this.error.set('We could not start the session.');
      return undefined;
    } finally {
      this.starting.set(false);
    }
  }

  async switchTarget(target: SegmentTarget): Promise<void> {
    const session = this.activeSession();
    if (!session) return;
    this.switchingTarget.set(true);
    try {
      const { closedSegment, openedSegment } = await this.repository.switchTarget(
        session.id,
        target,
      );
      this.segments.update((segs) => [...segs.slice(0, -1), closedSegment, openedSegment]);
    } finally {
      this.switchingTarget.set(false);
    }
  }

  async attachOpenSegment(target: SegmentTarget): Promise<void> {
    const session = this.activeSession();
    if (!session) return;
    const segment = await this.repository.attachOpenSegment(session.id, target);
    this.segments.update((segs) => [...segs.slice(0, -1), segment]);
  }

  async end(): Promise<EndSessionResult | undefined> {
    const session = this.activeSession();
    if (!session) return undefined;
    const result = await this.repository.endSession(session.id);
    this.stopTicking();
    this.activeSession.set(null);
    this.segments.set([]);
    this.phase.set('focus');
    this.activeBreak.set(null);
    return result;
  }
}
