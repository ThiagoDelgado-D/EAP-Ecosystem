import type { Entity } from "domain-lib";

export interface Session extends Entity {
  userId: string;
  /** SHA-256 hash of the opaque refresh token issued to the client. */
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  userAgent?: string | null;
  /** IPv4 or IPv6 address of the client at sign-in time. */
  ipAddress?: string | null;
  createdAt: Date;
}
