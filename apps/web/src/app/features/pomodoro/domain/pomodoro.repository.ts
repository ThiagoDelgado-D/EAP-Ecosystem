import type {
  ActiveSessionSnapshot,
  CandidateEnergyLevel,
  EndSessionResult,
  Segment,
  SegmentTarget,
  Session,
  StartSessionPayload,
  SuggestedCandidate,
  SwitchTargetResult,
} from './pomodoro.model';

export abstract class PomodoroRepository {
  abstract startSession(payload: StartSessionPayload): Promise<Session>;
  abstract switchTarget(sessionId: string, target: SegmentTarget): Promise<SwitchTargetResult>;
  abstract attachOpenSegment(sessionId: string, target: SegmentTarget): Promise<Segment>;
  abstract endSession(sessionId: string): Promise<EndSessionResult>;
  abstract startBreak(): Promise<void>;
  abstract getSuggestion(energy?: CandidateEnergyLevel): Promise<SuggestedCandidate[]>;
  abstract getActiveSession(): Promise<ActiveSessionSnapshot | null>;
}
