import type { Entity } from "domain-lib";

export interface Session extends Entity {
  userId: string;
  /** bcrypt hash of the opaque refresh token issued to the client. */
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  userAgent?: string | null;
  createdAt: Date;
}
