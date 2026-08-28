import type { Repository } from "typeorm";
import type { UUID } from "domain-lib";
import type {
  ILearningPathRepository,
  LearningPath,
  LearningPathEdge,
  LearningPathNode,
  LearningPathNodePatch,
  LearningPathPatch,
  LearningPathWithNodes,
  NodeProgress,
  PathMode,
  PathSource,
  StubScope,
} from "@learning-resource/domain";
import { LearningPathEntity } from "../entities/learning-path.entity.js";
import { LearningPathNodeEntity } from "../entities/learning-path-node.entity.js";
import { LearningPathEdgeEntity } from "../entities/learning-path-edge.entity.js";

export class TypeOrmLearningPathRepository implements ILearningPathRepository {
  constructor(
    private readonly pathRepository: Repository<LearningPathEntity>,
    private readonly nodeRepository: Repository<LearningPathNodeEntity>,
    private readonly edgeRepository: Repository<LearningPathEdgeEntity>,
  ) {}

  async findAllByUserId(userId: UUID): Promise<LearningPath[]> {
    const entities = await this.pathRepository.find({ where: { userId } });
    return entities.map((e) => this.toDomainPath(e));
  }

  async findById(id: UUID): Promise<LearningPath | null> {
    const entity = await this.pathRepository.findOneBy({ id });
    return entity ? this.toDomainPath(entity) : null;
  }

  async findByIdWithNodes(id: UUID): Promise<LearningPathWithNodes | null> {
    const pathEntity = await this.pathRepository.findOneBy({ id });
    if (!pathEntity) return null;

    const [nodeEntities, edgeEntities] = await Promise.all([
      this.nodeRepository.find({ where: { pathId: id }, order: { order: "ASC" } }),
      this.edgeRepository.find({ where: { pathId: id } }),
    ]);

    return {
      path: this.toDomainPath(pathEntity),
      nodes: nodeEntities.map((e) => this.toDomainNode(e)),
      edges: edgeEntities.map((e) => this.toDomainEdge(e)),
    };
  }

  async save(path: LearningPath): Promise<LearningPath> {
    const entity = this.toPathEntity(path);
    await this.pathRepository.save(entity);
    return path;
  }

  async update(id: UUID, patch: LearningPathPatch): Promise<LearningPath> {
    const updateData: Partial<LearningPathEntity> = {};
    if (patch.title !== undefined) updateData.title = patch.title;
    if (patch.description !== undefined) updateData.description = patch.description ?? null;

    if (Object.keys(updateData).length > 0) {
      updateData.updatedAt = new Date();
      await this.pathRepository.update(id, updateData);
    }

    const entity = await this.pathRepository.findOneByOrFail({ id });
    return this.toDomainPath(entity);
  }

  async delete(id: UUID): Promise<void> {
    await this.pathRepository.delete(id);
  }

  async saveNode(node: LearningPathNode): Promise<LearningPathNode> {
    const entity = this.toNodeEntity(node);
    await this.nodeRepository.save(entity);
    return node;
  }

  async updateNode(id: UUID, patch: LearningPathNodePatch): Promise<LearningPathNode> {
    const updateData: Partial<LearningPathNodeEntity> = {};
    if (patch.title !== undefined) updateData.title = patch.title;
    if (patch.description !== undefined) updateData.description = patch.description ?? null;
    if (patch.externalUrl !== undefined) updateData.externalUrl = patch.externalUrl ?? null;
    if (patch.order !== undefined) updateData.order = patch.order ?? null;
    if (patch.progress !== undefined) updateData.progress = patch.progress;
    if (patch.learningResourceId !== undefined) {
      updateData.learningResourceId = patch.learningResourceId;
    }
    if (patch.stubScope !== undefined) updateData.stubScope = patch.stubScope;

    if (Object.keys(updateData).length > 0) {
      updateData.updatedAt = new Date();
      await this.nodeRepository.update(id, updateData);
    }

    const entity = await this.nodeRepository.findOneByOrFail({ id });
    return this.toDomainNode(entity);
  }

  async deleteNode(id: UUID): Promise<void> {
    await this.nodeRepository.delete(id);
  }

  async findNodeById(id: UUID): Promise<LearningPathNode | null> {
    const entity = await this.nodeRepository.findOneBy({ id });
    return entity ? this.toDomainNode(entity) : null;
  }

  async saveEdge(edge: LearningPathEdge): Promise<LearningPathEdge> {
    const entity = this.toEdgeEntity(edge);
    await this.edgeRepository.save(entity);
    return edge;
  }

  async deleteEdge(id: UUID): Promise<void> {
    await this.edgeRepository.delete(id);
  }

  async findEdgesByPathId(pathId: UUID): Promise<LearningPathEdge[]> {
    const entities = await this.edgeRepository.find({ where: { pathId } });
    return entities.map((e) => this.toDomainEdge(e));
  }

  private toDomainPath(entity: LearningPathEntity): LearningPath {
    return {
      id: entity.id as UUID,
      userId: entity.userId as UUID,
      title: entity.title,
      description: entity.description ?? undefined,
      mode: entity.mode as PathMode,
      source: entity.source as PathSource,
      sourceSlug: entity.sourceSlug ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toPathEntity(path: LearningPath): LearningPathEntity {
    const entity = new LearningPathEntity();
    entity.id = path.id;
    entity.userId = path.userId;
    entity.title = path.title;
    entity.description = path.description ?? null;
    entity.mode = path.mode;
    entity.source = path.source;
    entity.sourceSlug = path.sourceSlug ?? null;
    entity.createdAt = path.createdAt;
    entity.updatedAt = path.updatedAt;
    return entity;
  }

  private toDomainNode(entity: LearningPathNodeEntity): LearningPathNode {
    const base = {
      id: entity.id as UUID,
      pathId: entity.pathId as UUID,
      title: entity.title,
      description: entity.description ?? undefined,
      externalUrl: entity.externalUrl ?? undefined,
      order: entity.order ?? undefined,
      progress: entity.progress as NodeProgress,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };

    if (entity.learningResourceId) {
      return { ...base, learningResourceId: entity.learningResourceId as UUID };
    }
    return { ...base, stubScope: (entity.stubScope ?? "path-local") as StubScope };
  }

  private toNodeEntity(node: LearningPathNode): LearningPathNodeEntity {
    const entity = new LearningPathNodeEntity();
    entity.id = node.id;
    entity.pathId = node.pathId;
    entity.title = node.title;
    entity.description = node.description ?? null;
    entity.externalUrl = node.externalUrl ?? null;
    entity.order = node.order ?? null;
    entity.progress = node.progress;
    entity.learningResourceId = node.learningResourceId ?? null;
    entity.stubScope = node.stubScope ?? null;
    entity.createdAt = node.createdAt;
    entity.updatedAt = node.updatedAt;
    return entity;
  }

  private toDomainEdge(entity: LearningPathEdgeEntity): LearningPathEdge {
    return {
      id: entity.id as UUID,
      pathId: entity.pathId as UUID,
      sourceNodeId: entity.sourceNodeId as UUID,
      targetNodeId: entity.targetNodeId as UUID,
    };
  }

  private toEdgeEntity(edge: LearningPathEdge): LearningPathEdgeEntity {
    const entity = new LearningPathEdgeEntity();
    entity.id = edge.id;
    entity.pathId = edge.pathId;
    entity.sourceNodeId = edge.sourceNodeId;
    entity.targetNodeId = edge.targetNodeId;
    return entity;
  }
}
