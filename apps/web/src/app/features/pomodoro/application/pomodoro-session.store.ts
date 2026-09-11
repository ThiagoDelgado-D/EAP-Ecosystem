import { Injectable, inject, signal } from '@angular/core';
import { PomodoroRepository } from '@features/pomodoro/domain/pomodoro.repository';
import type {
  CandidateEnergyLevel,
  EndSessionResult,
  Segment,
  SegmentTarget,
  Session,
  StartSessionPayload,
  SuggestedCandidate,
} from '@features/pomodoro/domain/pomodoro.model';

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

  readonly activeSession = signal<Session | null>(null);
  readonly segments = signal<Segment[]>([]);
  readonly suggestions = signal<SuggestedCandidate[]>([]);
  readonly suggestionsLoading = signal(false);
  readonly starting = signal(false);
  readonly switchingTarget = signal(false);
  readonly error = signal<string | null>(null);

  async loadSuggestions(energy?: CandidateEnergyLevel): Promise<void> {
    this.suggestionsLoading.set(true);
    try {
      this.suggestions.set(await this.repository.getSuggestion(energy));
    } catch {
      this.suggestions.set([]);
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
      const { closedSegment, openedSegment } = await this.repository.switchTarget(session.id, target);
      this.segments.update((segs) => [...segs.slice(0, -1), closedSegment, openedSegment]);
    } finally {
      this.switchingTarget.set(false);
    }
  }

  async end(): Promise<EndSessionResult | undefined> {
    const session = this.activeSession();
    if (!session) return undefined;
    const result = await this.repository.endSession(session.id);
    this.activeSession.set(null);
    this.segments.set([]);
    return result;
  }
}
