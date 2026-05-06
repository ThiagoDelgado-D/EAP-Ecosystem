import type { UseCaseErrors } from "domain-lib";
import {
  requestSignIn,
  verifySignIn,
  completeOnboarding,
  getFeatureConfig,
  updateFeatureConfig,
  getWidgetConfig,
  updateWidgetConfig,
  getActiveSessions,
  revokeSession,
  revokeAllOtherSessions,
} from "./use-cases/index.js";

export const userUseCaseMap = {
  requestSignIn,
  verifySignIn,
  completeOnboarding,
  getFeatureConfig,
  updateFeatureConfig,
  getWidgetConfig,
  updateWidgetConfig,
  getActiveSessions,
  revokeSession,
  revokeAllOtherSessions,
} as const;

export type UserUseCaseMap = typeof userUseCaseMap;

export type UserDomainError = UseCaseErrors<UserUseCaseMap>;
