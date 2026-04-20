import type { ISessionRepository, Session } from "@user/domain";
import type { UUID } from "domain-lib";
import { IsNull, type Repository } from "typeorm";
import { SessionEntity } from "../entities/session.entity.js";

export class TypeOrmSessionRepository implements ISessionRepository {
  constructor(private readonly repository: Repository<SessionEntity>) {}

  async save(session: Session): Promise<void> {
    await this.repository.save(this.toEntity(session));
  }

  async findByRefreshTokenHash(hash: string): Promise<Session | null> {
    const entity = await this.repository.findOne({
      where: { refreshTokenHash: hash },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findById(id: string): Promise<Session | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async revoke(id: string): Promise<void> {
    await this.repository.update(id, { revokedAt: new Date() });
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.repository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async findActiveByUserId(userId: string): Promise<Session[]> {
    const entities = await this.repository.find({
      where: { userId, revokedAt: IsNull() },
    });
    return entities.map((e) => this.toDomain(e));
  }

  private toDomain(entity: SessionEntity): Session {
    return {
      id: entity.id as UUID,
      userId: entity.userId,
      refreshTokenHash: entity.refreshTokenHash,
      expiresAt: entity.expiresAt,
      revokedAt: entity.revokedAt,
      userAgent: entity.userAgent ?? undefined,
      createdAt: entity.createdAt,
    };
  }

  private toEntity(session: Session): SessionEntity {
    const entity = new SessionEntity();
    entity.id = session.id;
    entity.userId = session.userId;
    entity.refreshTokenHash = session.refreshTokenHash;
    entity.expiresAt = session.expiresAt;
    entity.revokedAt = session.revokedAt ?? null;
    entity.userAgent = session.userAgent ?? null;
    entity.createdAt = session.createdAt;
    return entity;
  }
}
