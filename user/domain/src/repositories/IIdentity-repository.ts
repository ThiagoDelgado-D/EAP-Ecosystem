import type { Identity, IdentityProvider } from '../entities/identity.js';

export interface IIdentityRepository {
  save(identity: Identity): Promise<void>;
  findByProvider(
    provider: IdentityProvider,
    providerSubject: string,
  ): Promise<Identity | null>;
  findAllByUserId(userId: string): Promise<Identity[]>;
}
