import type { Entity, TimestampedEntity } from "domain-lib";

export const IdentityProvider = {
  MAGIC_LINK: "magic-link",
  GOOGLE: "google",
  GITHUB: "github",
} as const;

export type IdentityProvider =
  (typeof IdentityProvider)[keyof typeof IdentityProvider];
export interface Identity extends Entity, TimestampedEntity {
  userId: string;
  provider: IdentityProvider;
  /** Provider-side subject: email for magic-link, OAuth sub for social. */
  providerSubject: string;
  verified: boolean;
}
