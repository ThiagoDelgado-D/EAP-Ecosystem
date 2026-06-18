import type { IUserRepository, User } from "@user/domain";
import { DEFAULT_APPEARANCE, FeatureKey, LanguageCode, StartOfWeek, WidgetKey } from "@user/domain";
import type { UUID } from "domain-lib";
import type { Repository } from "typeorm";
import { UserEntity } from "../entities/user.entity.js";

export class TypeOrmUserRepository implements IUserRepository {
  constructor(private readonly repository: Repository<UserEntity>) {}

  async save(user: User): Promise<void> {
    await this.repository.save(this.toEntity(user));
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { email } });
    return entity ? this.toDomain(entity) : null;
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async update(user: User): Promise<void> {
    await this.repository.save(this.toEntity(user));
  }

  private toDomain(entity: UserEntity): User {
    return {
      id: entity.id as UUID,
      email: entity.email,
      firstName: entity.firstName,
      lastName: entity.lastName,
      userName: entity.userName ?? null,
      enabled: entity.enabled,
      onboardingCompleted: entity.onboardingCompleted,
      featureConfig: entity.featureConfig.filter((k): k is FeatureKey =>
        (Object.values(FeatureKey) as string[]).includes(k),
      ),
      widgetConfig: entity.widgetConfig.filter((k): k is WidgetKey =>
        (Object.values(WidgetKey) as string[]).includes(k),
      ),
      appearance: {
        language: (Object.values(LanguageCode) as string[]).includes(entity.language)
          ? (entity.language as LanguageCode)
          : DEFAULT_APPEARANCE.language,
        timezone: entity.timezone ?? DEFAULT_APPEARANCE.timezone,
        startOfWeek: (Object.values(StartOfWeek) as string[]).includes(entity.startOfWeek)
          ? (entity.startOfWeek as StartOfWeek)
          : DEFAULT_APPEARANCE.startOfWeek,
        reduceMotion: entity.reduceMotion ?? DEFAULT_APPEARANCE.reduceMotion,
        compactMode: entity.compactMode ?? DEFAULT_APPEARANCE.compactMode,
      },
      bio: entity.bio ?? undefined,
      avatar: (entity.avatar as UUID) ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toEntity(user: User): UserEntity {
    const entity = new UserEntity();
    entity.id = user.id;
    entity.email = user.email;
    entity.firstName = user.firstName;
    entity.lastName = user.lastName;
    entity.userName = user.userName ?? null;
    entity.enabled = user.enabled;
    entity.onboardingCompleted = user.onboardingCompleted;
    entity.featureConfig = user.featureConfig;
    entity.widgetConfig = user.widgetConfig;
    entity.language = user.appearance.language;
    entity.timezone = user.appearance.timezone;
    entity.startOfWeek = user.appearance.startOfWeek;
    entity.reduceMotion = user.appearance.reduceMotion;
    entity.compactMode = user.appearance.compactMode;
    entity.bio = user.bio ?? null;
    entity.avatar = user.avatar ?? null;
    return entity;
  }
}
