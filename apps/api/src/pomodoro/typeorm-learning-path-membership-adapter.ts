import type { UUID } from "domain-lib";
import type {
  LearningPathMembership,
  LearningPathMembershipPort,
} from "@pomodoro/domain";
import { LearningPathEntity, LearningPathNodeEntity } from "@learning-resource/infrastructure";
import type { Repository } from "typeorm";

export class TypeOrmLearningPathMembershipAdapter
  implements LearningPathMembershipPort
{
  constructor(
    private readonly nodeRepository: Repository<LearningPathNodeEntity>,
  ) {}

  async findPathsForResource(resourceId: UUID): Promise<LearningPathMembership[]> {
    const rows = await this.nodeRepository
      .createQueryBuilder("node")
      .innerJoin(LearningPathEntity, "path", "path.id = node.pathId")
      .select("path.id", "pathId")
      .addSelect("path.title", "pathTitle")
      .addSelect("node.id", "nodeId")
      .where("node.learningResourceId = :resourceId", { resourceId })
      .getRawMany<{ pathId: string; pathTitle: string; nodeId: string }>();

    return rows.map((row) => ({
      pathId: row.pathId as UUID,
      pathTitle: row.pathTitle,
      nodeId: row.nodeId as UUID,
    }));
  }
}
