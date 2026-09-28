import type { UUID } from "domain-lib";
import type {
  LearningResourceCandidate,
  LearningResourceCandidatesPort,
} from "@recommendation/domain";
import { LearningResourceEntity } from "@learning-resource/infrastructure";
import { Not, type Repository } from "typeorm";

export class TypeOrmLearningResourceCandidatesAdapter
  implements LearningResourceCandidatesPort
{
  constructor(
    private readonly resourceRepository: Repository<LearningResourceEntity>,
  ) {}

  async findCandidates(userId: UUID): Promise<LearningResourceCandidate[]> {
    const resources = await this.resourceRepository.find({
      where: { userId, status: Not("completed") },
    });

    return resources.map((resource) => ({
      resourceId: resource.id as UUID,
      title: resource.title,
      energyLevel:
        resource.energyLevel as LearningResourceCandidate["energyLevel"],
      mentalState:
        (resource.mentalState as LearningResourceCandidate["mentalState"]) ??
        undefined,
      estimatedMinutes: resource.estimatedDurationMinutes ?? undefined,
      lastViewed: resource.lastViewedAt ?? undefined,
    }));
  }
}
