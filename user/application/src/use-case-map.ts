import type { UseCaseErrors } from "domain-lib";
import {
  requestSignIn,
  verifySignIn,
  completeOnboarding,
} from "./use-cases/index.js";

export const userUseCaseMap = {
  requestSignIn,
  verifySignIn,
  completeOnboarding,
} as const;

export type UserUseCaseMap = typeof userUseCaseMap;

export type UserDomainError = UseCaseErrors<UserUseCaseMap>;
