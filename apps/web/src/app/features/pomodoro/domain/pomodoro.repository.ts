import type {
  ActiveSessionSnapshot,
  Break,
  CandidateEnergyLevel,
  EndSessionResult,
  HistorySnapshot,
  Segment,
  SegmentTarget,
  Session,
  StartSessionPayload,
  SuggestedCandidate,
  SwitchTargetResult,
} from './pomodoro.model';

export abstract class PomodoroRepository {
  abstract switchTarget(sessionId: string, target: SegmentTarget): Promise<SwitchTargetResult>;
  abstract attachOpenSegment(sessionId: string, target: SegmentTarget): Promise<Segment>;

  abstract startBreak(): Promise<Break>;
  abstract getActiveBreak(): Promise<Break | null>;
  abstract extendBreak(breakId: string, seconds: number): Promise<Break>;
  abstract endBreak(breakId: string): Promise<Break>;

  abstract startSession(payload: StartSessionPayload): Promise<Session>;
  abstract getActiveSession(): Promise<ActiveSessionSnapshot | null>;
  abstract endSession(sessionId: string): Promise<EndSessionResult>;
  abstract getSuggestion(energy?: CandidateEnergyLevel): Promise<SuggestedCandidate[]>;
  abstract getHistory(since: Date, until?: Date): Promise<HistorySnapshot>;
  abstract attributeSession(sessionId: string, target: SegmentTarget): Promise<Segment[]>;
}
