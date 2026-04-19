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
