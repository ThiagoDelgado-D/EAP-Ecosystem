import type { UUID } from "domain-lib";
import {
  EnergyLevel,
  MentalState,
  type IRecommendationContextRepository,
  type RecommendationContext,
} from "@recommendation/domain";
import type { Repository } from "typeorm";
import { RecommendationContextEntity } from "../entities/recommendation-context.entity.js";

export class TypeOrmRecommendationContextRepository
  implements IRecommendationContextRepository
{
  constructor(
    private readonly repository: Repository<RecommendationContextEntity>,
  ) {}

  async findByUserId(userId: UUID): Promise<RecommendationContext | null> {
    const entity = await this.repository.findOne({ where: { userId } });
    return entity ? this.toDomain(entity) : null;
  }

  async save(context: RecommendationContext): Promise<RecommendationContext> {
    await this.repository.save(this.toEntity(context));
    return context;
  }

  private toEntity(
    context: RecommendationContext,
  ): RecommendationContextEntity {
    const entity = new RecommendationContextEntity();
    entity.userId = context.userId;
    entity.energyLevel = context.energyLevel;
    entity.availableMinutes = context.availableMinutes ?? null;
    entity.mentalState = context.mentalState ?? null;
    entity.updatedAt = context.updatedAt;
    return entity;
  }

  private toDomain(
    entity: RecommendationContextEntity,
  ): RecommendationContext {
    return {
      userId: entity.userId as UUID,
      energyLevel: entity.energyLevel as EnergyLevel,
      availableMinutes: entity.availableMinutes ?? undefined,
      mentalState: (entity.mentalState as MentalState) ?? undefined,
      updatedAt: entity.updatedAt,
    };
  }
}
