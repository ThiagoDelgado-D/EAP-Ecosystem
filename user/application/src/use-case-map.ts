import type { UseCaseErrors } from "domain-lib";
import { requestSignIn, verifySignIn } from "./use-cases/index.js";

export const userUseCaseMap = {
  requestSignIn,
  verifySignIn,
} as const;

export type UserUseCaseMap = typeof userUseCaseMap;

export type UserDomainError = UseCaseErrors<UserUseCaseMap>;
