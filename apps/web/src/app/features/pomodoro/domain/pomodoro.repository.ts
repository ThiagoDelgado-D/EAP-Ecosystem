import type {
  Break,
  CandidateEnergyLevel,
  ContinueSessionResult,
  EndSessionResult,
  GetActiveSessionResult,
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
  abstract getActiveSession(): Promise<GetActiveSessionResult | null>;
  abstract endSession(sessionId: string): Promise<EndSessionResult>;
  abstract continueSession(sessionId: string): Promise<ContinueSessionResult>;
  abstract extendSession(sessionId: string, minutes: number): Promise<Session>;
  abstract getSuggestion(energy?: CandidateEnergyLevel): Promise<SuggestedCandidate[]>;
  abstract getHistory(since: Date, until?: Date): Promise<HistorySnapshot>;
  abstract attributeSession(sessionId: string, target: SegmentTarget): Promise<Segment[]>;
}
