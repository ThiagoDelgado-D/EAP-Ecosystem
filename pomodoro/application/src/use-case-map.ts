import type { UseCaseErrors } from "domain-lib";
import { startSession } from "./use-cases/sessions/start-session.js";
import { switchTarget } from "./use-cases/sessions/switch-target.js";
import { endSession } from "./use-cases/sessions/end-session.js";
import { startBreak } from "./use-cases/sessions/start-break.js";

export const pomodoroUseCaseMap = {
  startSession,
  switchTarget,
  endSession,
  startBreak,
} as const;

export type PomodoroUseCaseMap = typeof pomodoroUseCaseMap;

export type PomodoroDomainError = UseCaseErrors<PomodoroUseCaseMap>;
