import type { UUID } from "domain-lib";
import type { ISessionRepository, Segment, Session } from "@pomodoro/domain";
import { SegmentTargetKind } from "@pomodoro/domain";
import { IsNull, Not, type Repository } from "typeorm";
import { SessionEntity } from "../entities/session.entity.js";
import { SegmentEntity } from "../entities/segment.entity.js";

export class TypeOrmSessionRepository implements ISessionRepository {
  constructor(
    private readonly sessionRepository: Repository<SessionEntity>,
    private readonly segmentRepository: Repository<SegmentEntity>,
  ) {}

  async save(session: Session): Promise<Session> {
    await this.sessionRepository.save(this.toSessionEntity(session));
    return session;
  }

  async update(session: Session): Promise<Session> {
    await this.sessionRepository.save(this.toSessionEntity(session));
    return session;
  }

  async delete(sessionId: UUID): Promise<void> {
    await this.sessionRepository.delete(sessionId);
  }

  async findById(sessionId: UUID): Promise<Session | null> {
    const entity = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });
    return entity ? this.toSessionDomain(entity) : null;
  }

  async findActiveByUserId(userId: UUID): Promise<Session | null> {
    const entity = await this.sessionRepository.findOne({
      where: { userId, completedAt: IsNull() },
      order: { startedAt: "DESC" },
    });
    return entity ? this.toSessionDomain(entity) : null;
  }

  async findMostRecentByUserId(userId: UUID): Promise<Session | null> {
    const entity = await this.sessionRepository.findOne({
      where: { userId, completedAt: Not(IsNull()) },
      order: { startedAt: "DESC" },
    });
    return entity ? this.toSessionDomain(entity) : null;
  }

  async saveSegment(segment: Segment): Promise<Segment> {
    await this.segmentRepository.save(this.toSegmentEntity(segment));
    return segment;
  }

  async updateSegment(segment: Segment): Promise<Segment> {
    await this.segmentRepository.save(this.toSegmentEntity(segment));
    return segment;
  }

  async findOpenSegmentBySessionId(sessionId: UUID): Promise<Segment | null> {
    const entity = await this.segmentRepository.findOne({
      where: { sessionId, endSec: IsNull() },
    });
    return entity ? this.toSegmentDomain(entity) : null;
  }

  async findSegmentsBySessionId(sessionId: UUID): Promise<Segment[]> {
    const entities = await this.segmentRepository.find({
      where: { sessionId },
      order: { startSec: "ASC" },
    });
    return entities.map((entity) => this.toSegmentDomain(entity));
  }

  async findSegmentsByUserIdSince(userId: UUID, since: Date): Promise<Segment[]> {
    const entities = await this.segmentRepository
      .createQueryBuilder("segment")
      .innerJoin(SessionEntity, "session", "session.id = segment.sessionId")
      .where("session.userId = :userId", { userId })
      .andWhere("session.startedAt >= :since", { since })
      .getMany();
    return entities.map((entity) => this.toSegmentDomain(entity));
  }

  private toSessionEntity(session: Session): SessionEntity {
    const entity = new SessionEntity();
    entity.id = session.id;
    entity.userId = session.userId;
    entity.startedAt = session.startedAt;
    entity.completedAt = session.completedAt ?? null;
    entity.intent = session.intent ?? null;
    entity.plannedMin = session.plannedMin;
    return entity;
  }

  private toSessionDomain(entity: SessionEntity): Session {
    return {
      id: entity.id as UUID,
      userId: entity.userId as UUID,
      startedAt: entity.startedAt,
      completedAt: entity.completedAt ?? undefined,
      intent: entity.intent ?? undefined,
      plannedMin: entity.plannedMin,
    };
  }

  private toSegmentEntity(segment: Segment): SegmentEntity {
    const entity = new SegmentEntity();
    entity.id = segment.id;
    entity.sessionId = segment.sessionId;
    entity.startSec = segment.startSec;
    entity.endSec = segment.endSec ?? null;
    entity.targetKind = segment.targetKind;
    entity.resourceId = segment.resourceId ?? null;
    entity.learningPathId = segment.learningPathId ?? null;
    entity.learningPathNodeId = segment.learningPathNodeId ?? null;
    return entity;
  }

  private toSegmentDomain(entity: SegmentEntity): Segment {
    const base = {
      id: entity.id as UUID,
      sessionId: entity.sessionId as UUID,
      startSec: entity.startSec,
      endSec: entity.endSec ?? undefined,
    };

    if (entity.targetKind === SegmentTargetKind.RESOURCE) {
      return {
        ...base,
        targetKind: SegmentTargetKind.RESOURCE,
        resourceId: entity.resourceId as UUID,
      };
    }

    if (entity.targetKind === SegmentTargetKind.NODE) {
      return {
        ...base,
        targetKind: SegmentTargetKind.NODE,
        learningPathId: entity.learningPathId as UUID,
        learningPathNodeId: entity.learningPathNodeId as UUID,
        resourceId: (entity.resourceId as UUID) ?? undefined,
      };
    }

    return { ...base, targetKind: SegmentTargetKind.FREE };
  }
}
