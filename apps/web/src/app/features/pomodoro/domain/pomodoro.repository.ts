import type {
  ActiveSessionSnapshot,
  CandidateEnergyLevel,
  EndSessionResult,
  SegmentTarget,
  Session,
  StartSessionPayload,
  SuggestedCandidate,
  SwitchTargetResult,
} from './pomodoro.model';

export abstract class PomodoroRepository {
  abstract startSession(payload: StartSessionPayload): Promise<Session>;
  abstract switchTarget(sessionId: string, target: SegmentTarget): Promise<SwitchTargetResult>;
  abstract endSession(sessionId: string): Promise<EndSessionResult>;
  abstract startBreak(): Promise<void>;
  abstract getSuggestion(energy?: CandidateEnergyLevel): Promise<SuggestedCandidate[]>;
  abstract getActiveSession(): Promise<ActiveSessionSnapshot | null>;
}
