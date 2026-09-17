import type { UseCaseErrors } from "domain-lib";
import { startSession } from "./use-cases/sessions/start-session.js";
import { switchTarget } from "./use-cases/sessions/switch-target.js";
import { endSession } from "./use-cases/sessions/end-session.js";
import { continueSession } from "./use-cases/sessions/continue-session.js";
import { startBreak } from "./use-cases/sessions/start-break.js";
import { getActiveBreak } from "./use-cases/sessions/get-active-break.js";
import { extendBreak } from "./use-cases/sessions/extend-break.js";
import { endBreak } from "./use-cases/sessions/end-break.js";
import { getLastSessionTarget } from "./use-cases/sessions/get-last-session-target.js";
import { getPathMomentum } from "./use-cases/sessions/get-path-momentum.js";
import { suggestSessionTarget } from "./use-cases/sessions/suggest-session-target.js";
import { getActiveSession } from "./use-cases/sessions/get-active-session.js";
import { attachOpenSegment } from "./use-cases/sessions/attach-open-segment.js";
import { attributeSession } from "./use-cases/sessions/attribute-session.js";
import { getSessionHistory } from "./use-cases/sessions/get-session-history.js";
import { getBreakHistory } from "./use-cases/sessions/get-break-history.js";

export const pomodoroUseCaseMap = {
  startSession,
  switchTarget,
  endSession,
  continueSession,
  startBreak,
  getActiveBreak,
  extendBreak,
  endBreak,
  getLastSessionTarget,
  getPathMomentum,
  suggestSessionTarget,
  getActiveSession,
  attachOpenSegment,
  attributeSession,
  getSessionHistory,
  getBreakHistory,
} as const;

export type PomodoroUseCaseMap = typeof pomodoroUseCaseMap;

export type PomodoroDomainError = UseCaseErrors<PomodoroUseCaseMap>;
