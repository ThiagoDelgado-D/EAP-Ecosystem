import type { UseCaseErrors } from "domain-lib";
import { startSession } from "./use-cases/sessions/start-session.js";
import { switchTarget } from "./use-cases/sessions/switch-target.js";

export const pomodoroUseCaseMap = {
  startSession,
  switchTarget,
} as const;

export type PomodoroUseCaseMap = typeof pomodoroUseCaseMap;

export type PomodoroDomainError = UseCaseErrors<PomodoroUseCaseMap>;
