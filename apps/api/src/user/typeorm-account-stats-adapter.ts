import type { UUID } from "domain-lib";
import type { AccountStats, AccountStatsPort } from "@user/domain";
import {
  LearningPathEntity,
  LearningResourceEntity,
} from "@learning-resource/infrastructure";
import { PomodoroSessionEntity } from "@pomodoro/infrastructure";
import { Not, IsNull, type Repository } from "typeorm";

export class TypeOrmAccountStatsAdapter implements AccountStatsPort {
  constructor(
    private readonly resourceRepository: Repository<LearningResourceEntity>,
    private readonly pathRepository: Repository<LearningPathEntity>,
    private readonly pomodoroSessionRepository: Repository<PomodoroSessionEntity>,
  ) {}

  async countFor(userId: UUID): Promise<AccountStats> {
    const [resources, paths, sessions] = await Promise.all([
      this.resourceRepository.count({ where: { userId } }),
      this.pathRepository.count({ where: { userId } }),
      this.pomodoroSessionRepository.count({
        where: { userId, completedAt: Not(IsNull()) },
      }),
    ]);

    return { resources, paths, sessions };
  }
}
