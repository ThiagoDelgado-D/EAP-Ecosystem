import type { UseCaseErrors } from "domain-lib";
import { startSession } from "./use-cases/sessions/start-session.js";
import { switchTarget } from "./use-cases/sessions/switch-target.js";
import { endSession } from "./use-cases/sessions/end-session.js";
import { startBreak } from "./use-cases/sessions/start-break.js";
import { getLastSessionTarget } from "./use-cases/sessions/get-last-session-target.js";
import { getPathMomentum } from "./use-cases/sessions/get-path-momentum.js";
import { suggestSessionTarget } from "./use-cases/sessions/suggest-session-target.js";
import { getActiveSession } from "./use-cases/sessions/get-active-session.js";
import { attachOpenSegment } from "./use-cases/sessions/attach-open-segment.js";

export const pomodoroUseCaseMap = {
  startSession,
  switchTarget,
  endSession,
  startBreak,
  getLastSessionTarget,
  getPathMomentum,
  suggestSessionTarget,
  getActiveSession,
  attachOpenSegment,
} as const;

export type PomodoroUseCaseMap = typeof pomodoroUseCaseMap;

export type PomodoroDomainError = UseCaseErrors<PomodoroUseCaseMap>;
