import type {
  EndSessionResult,
  SegmentTarget,
  Session,
  StartSessionPayload,
  SwitchTargetResult,
} from './pomodoro.model';

export abstract class PomodoroRepository {
  abstract startSession(payload: StartSessionPayload): Promise<Session>;
  abstract switchTarget(sessionId: string, target: SegmentTarget): Promise<SwitchTargetResult>;
  abstract endSession(sessionId: string): Promise<EndSessionResult>;
  abstract startBreak(): Promise<void>;
}
