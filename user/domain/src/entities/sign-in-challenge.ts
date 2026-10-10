import type { Entity } from "domain-lib";

export interface SignInChallenge extends Entity {
  email: string;
  /** bcrypt hash of the 6-digit code sent to the user. */
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  consumed: boolean;
  createdAt: Date;
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

export const SIGN_IN_REQUEST_BACKOFF = {
  BASE_DELAY_MS: MINUTE_MS,
  MAX_DELAY_MS: HOUR_MS,
  WINDOW_MS: 24 * HOUR_MS,
} as const;
