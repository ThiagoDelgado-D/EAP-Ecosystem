import type {
  ISignInChallengeRepository,
  SignInChallenge,
} from "@user/domain";

export interface MockedSignInChallengeRepository
  extends ISignInChallengeRepository {
  challenges: SignInChallenge[];
  reset(): void;
  clear(): void;
  count(): number;
}

export function mockSignInChallengeRepository(
  initialChallenges: SignInChallenge[] = [],
): MockedSignInChallengeRepository {
  return {
    challenges: [...initialChallenges],

    async save(challenge: SignInChallenge): Promise<void> {
      const index = this.challenges.findIndex((c) => c.id === challenge.id);
      if (index >= 0) {
        this.challenges[index] = challenge;
      } else {
        this.challenges.push(challenge);
      }
    },

    async findActiveByEmail(email: string): Promise<SignInChallenge | null> {
      return (
        this.challenges.find(
          (c) => c.email === email && !c.consumed && c.expiresAt > new Date(),
        ) ?? null
      );
    },

    async consume(id: string): Promise<void> {
      const index = this.challenges.findIndex((c) => c.id === id);
      if (index >= 0) {
        this.challenges[index] = { ...this.challenges[index], consumed: true };
      }
    },

    async invalidateAllByEmail(email: string): Promise<void> {
      this.challenges = this.challenges.map((c) =>
        c.email === email && !c.consumed ? { ...c, consumed: true } : c,
      );
    },

    async incrementAttempts(id: string): Promise<void> {
      const index = this.challenges.findIndex((c) => c.id === id);
      if (index >= 0) {
        this.challenges[index] = {
          ...this.challenges[index],
          attempts: this.challenges[index].attempts + 1,
        };
      }
    },

    reset(): void {
      this.challenges = [];
    },

    clear(): void {
      this.challenges = [];
    },

    count(): number {
      return this.challenges.length;
    },
  };
}
