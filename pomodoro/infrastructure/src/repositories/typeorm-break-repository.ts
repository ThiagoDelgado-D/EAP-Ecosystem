import type { UUID } from "domain-lib";
import type { Break, IBreakRepository } from "@pomodoro/domain";
import { IsNull, type Repository } from "typeorm";
import { BreakEntity } from "../entities/break.entity.js";

export class TypeOrmBreakRepository implements IBreakRepository {
  constructor(private readonly breakRepository: Repository<BreakEntity>) {}

  async save(newBreak: Break): Promise<Break> {
    await this.breakRepository.save(this.toEntity(newBreak));
    return newBreak;
  }

  async update(updatedBreak: Break): Promise<Break> {
    await this.breakRepository.save(this.toEntity(updatedBreak));
    return updatedBreak;
  }

  async findById(breakId: UUID): Promise<Break | null> {
    const entity = await this.breakRepository.findOne({
      where: { id: breakId },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findActiveByUserId(userId: UUID): Promise<Break | null> {
    const entity = await this.breakRepository.findOne({
      where: { userId, endedAt: IsNull() },
      order: { startedAt: "DESC" },
    });
    return entity ? this.toDomain(entity) : null;
  }

  private toEntity(activeBreak: Break): BreakEntity {
    const entity = new BreakEntity();
    entity.id = activeBreak.id;
    entity.userId = activeBreak.userId;
    entity.startedAt = activeBreak.startedAt;
    entity.durationSec = activeBreak.durationSec;
    entity.endedAt = activeBreak.endedAt ?? null;
    return entity;
  }

  private toDomain(entity: BreakEntity): Break {
    return {
      id: entity.id as UUID,
      userId: entity.userId as UUID,
      startedAt: entity.startedAt,
      durationSec: entity.durationSec,
      endedAt: entity.endedAt ?? undefined,
    };
  }
}
