import type { SignInChallenge } from "../entities/sign-in-challenge.js";

export interface ISignInChallengeRepository {
  save(challenge: SignInChallenge): Promise<void>;
  findActiveByEmail(email: string): Promise<SignInChallenge | null>;
  consume(id: string): Promise<void>;
  invalidateAllByEmail(email: string): Promise<void>;
  incrementAttempts(id: string): Promise<void>;
}
