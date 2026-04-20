import type { Entity, TimestampedEntity } from "domain-lib";

export type IdentityProvider = "magic-link" | "google" | "github";

export interface Identity extends Entity, TimestampedEntity {
  userId: string;
  provider: IdentityProvider;
  /** Provider-side subject: email for magic-link, OAuth sub for social. */
  providerSubject: string;
  verified: boolean;
}
