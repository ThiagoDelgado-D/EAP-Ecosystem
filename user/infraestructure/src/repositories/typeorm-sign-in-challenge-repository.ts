import type { ISignInChallengeRepository, SignInChallenge } from "@user/domain";
import type { UUID } from "domain-lib";
import { MoreThan, type Repository } from "typeorm";
import { SignInChallengeEntity } from "../entities/sign-in-challenge.entity.js";

export class TypeOrmSignInChallengeRepository implements ISignInChallengeRepository {
  constructor(private readonly repository: Repository<SignInChallengeEntity>) {}

  async save(challenge: SignInChallenge): Promise<void> {
    await this.repository.save(this.toEntity(challenge));
  }

  async findActiveByEmail(email: string): Promise<SignInChallenge | null> {
    const entity = await this.repository.findOne({
      where: {
        email,
        consumed: false,
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: "DESC" },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async consume(id: string): Promise<void> {
    await this.repository.update(id, { consumed: true });
  }

  async invalidateAllByEmail(email: string): Promise<void> {
    await this.repository.update(
      { email, consumed: false },
      { consumed: true },
    );
  }

  async incrementAttempts(id: string): Promise<void> {
    await this.repository.increment({ id }, "attempts", 1);
  }

  private toDomain(entity: SignInChallengeEntity): SignInChallenge {
    return {
      id: entity.id as UUID,
      email: entity.email,
      codeHash: entity.codeHash,
      expiresAt: entity.expiresAt,
      attempts: entity.attempts,
      consumed: entity.consumed,
      createdAt: entity.createdAt,
    };
  }

  private toEntity(challenge: SignInChallenge): SignInChallengeEntity {
    const entity = new SignInChallengeEntity();
    entity.id = challenge.id;
    entity.email = challenge.email;
    entity.codeHash = challenge.codeHash;
    entity.expiresAt = challenge.expiresAt;
    entity.attempts = challenge.attempts;
    entity.consumed = challenge.consumed;
    return entity;
  }
}
