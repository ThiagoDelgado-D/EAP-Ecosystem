import type {
  Identity,
  IdentityProvider,
  IIdentityRepository,
} from "@user/domain";

export interface MockedIdentityRepository extends IIdentityRepository {
  identities: Identity[];
  reset(): void;
  clear(): void;
  count(): number;
}

export function mockIdentityRepository(
  initialIdentities: Identity[] = [],
): MockedIdentityRepository {
  return {
    identities: [...initialIdentities],

    async save(identity: Identity): Promise<void> {
      const index = this.identities.findIndex((i) => i.id === identity.id);
      if (index >= 0) {
        this.identities[index] = identity;
      } else {
        this.identities.push(identity);
      }
    },

    async findByProvider(
      provider: IdentityProvider,
      providerSubject: string,
    ): Promise<Identity | null> {
      return (
        this.identities.find(
          (i) => i.provider === provider && i.providerSubject === providerSubject,
        ) ?? null
      );
    },

    async findAllByUserId(userId: string): Promise<Identity[]> {
      return this.identities.filter((i) => i.userId === userId);
    },

    reset(): void {
      this.identities = [];
    },

    clear(): void {
      this.identities = [];
    },

    count(): number {
      return this.identities.length;
    },
  };
}
