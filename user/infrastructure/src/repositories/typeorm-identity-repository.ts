import type {
  IIdentityRepository,
  Identity,
  IdentityProvider,
} from "@user/domain";
import type { UUID } from "domain-lib";
import type { Repository } from "typeorm";
import { IdentityEntity } from "../entities/identity.entity.js";

export class TypeOrmIdentityRepository implements IIdentityRepository {
  constructor(private readonly repository: Repository<IdentityEntity>) {}

  async save(identity: Identity): Promise<void> {
    await this.repository.save(this.toEntity(identity));
  }

  async findByProvider(
    provider: IdentityProvider,
    providerSubject: string,
  ): Promise<Identity | null> {
    const entity = await this.repository.findOne({
      where: { provider, providerSubject },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAllByUserId(userId: string): Promise<Identity[]> {
    const entities = await this.repository.find({ where: { userId } });
    return entities.map((e) => this.toDomain(e));
  }

  private toDomain(entity: IdentityEntity): Identity {
    return {
      id: entity.id as UUID,
      userId: entity.userId,
      provider: entity.provider as IdentityProvider,
      providerSubject: entity.providerSubject,
      verified: entity.verified,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toEntity(identity: Identity): IdentityEntity {
    const entity = new IdentityEntity();
    entity.id = identity.id;
    entity.userId = identity.userId;
    entity.provider = identity.provider;
    entity.providerSubject = identity.providerSubject;
    entity.verified = identity.verified;
    return entity;
  }
}
