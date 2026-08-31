import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { BaseError, type CryptoService, type UUID } from "domain-lib";
import type { ILearningPathRepository } from "@learning-resource/domain";
import {
  addLearningPathEdge,
  addLearningPathNode,
  createLearningPath,
  deleteLearningPath,
  deleteLearningPathEdge,
  deleteLearningPathNode,
  getLearningPath,
  listLearningPaths,
  updateLearningPath,
  updateLearningPathNode,
  updateLearningPathNodePosition,
  updateLearningPathNodeProgress,
} from "@learning-resource/application";
import {
  AddLearningPathEdgeDto,
  AddLearningPathNodeDto,
  CreateLearningPathDto,
  UpdateLearningPathDto,
  UpdateLearningPathNodeDto,
  UpdateLearningPathNodePositionDto,
  UpdateLearningPathNodeProgressDto,
} from "./dto/request/index.js";
import { toHttpException } from "../errors/domain-error-mapper.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUserId } from "../auth/current-user-id.decorator.js";

@UseGuards(JwtAuthGuard)
@Controller("api/v1/learning-paths")
export class LearningPathController {
  constructor(
    @Inject("ILearningPathRepository")
    private readonly learningPathRepository: ILearningPathRepository,
    @Inject("ICryptoService")
    private readonly cryptoService: CryptoService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateLearningPathDto,
    @CurrentUserId() userId: UUID,
  ) {
    const result = await createLearningPath(
      { learningPathRepository: this.learningPathRepository, cryptoService: this.cryptoService },
      { userId, ...dto },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Get()
  async list(@CurrentUserId() userId: UUID) {
    const result = await listLearningPaths(
      { learningPathRepository: this.learningPathRepository },
      { userId },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Get(":id")
  async findOne(@Param("id") id: UUID, @CurrentUserId() userId: UUID) {
    const result = await getLearningPath(
      { learningPathRepository: this.learningPathRepository },
      { userId, pathId: id },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Patch(":id")
  async update(
    @Param("id") id: UUID,
    @Body() dto: UpdateLearningPathDto,
    @CurrentUserId() userId: UUID,
  ) {
    const result = await updateLearningPath(
      { learningPathRepository: this.learningPathRepository },
      { userId, pathId: id, ...dto },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Delete(":id")
  @HttpCode(200)
  async remove(@Param("id") id: UUID, @CurrentUserId() userId: UUID) {
    const result = await deleteLearningPath(
      { learningPathRepository: this.learningPathRepository },
      { userId, pathId: id },
    );
    if (result instanceof BaseError) throw toHttpException(result);
  }

  @Post(":id/nodes")
  async addNode(
    @Param("id") id: UUID,
    @Body() dto: AddLearningPathNodeDto,
    @CurrentUserId() userId: UUID,
  ) {
    const result = await addLearningPathNode(
      { learningPathRepository: this.learningPathRepository, cryptoService: this.cryptoService },
      { userId, pathId: id, ...dto },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Patch(":id/nodes/:nodeId")
  async updateNode(
    @Param("id") id: UUID,
    @Param("nodeId") nodeId: UUID,
    @Body() dto: UpdateLearningPathNodeDto,
    @CurrentUserId() userId: UUID,
  ) {
    const result = await updateLearningPathNode(
      { learningPathRepository: this.learningPathRepository },
      { userId, pathId: id, nodeId, ...dto },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Delete(":id/nodes/:nodeId")
  @HttpCode(200)
  async removeNode(
    @Param("id") id: UUID,
    @Param("nodeId") nodeId: UUID,
    @CurrentUserId() userId: UUID,
  ) {
    const result = await deleteLearningPathNode(
      { learningPathRepository: this.learningPathRepository },
      { userId, pathId: id, nodeId },
    );
    if (result instanceof BaseError) throw toHttpException(result);
  }

  @Patch(":id/nodes/:nodeId/progress")
  async updateNodeProgress(
    @Param("id") id: UUID,
    @Param("nodeId") nodeId: UUID,
    @Body() dto: UpdateLearningPathNodeProgressDto,
    @CurrentUserId() userId: UUID,
  ) {
    const result = await updateLearningPathNodeProgress(
      { learningPathRepository: this.learningPathRepository },
      { userId, pathId: id, nodeId, progress: dto.progress },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Patch(":id/nodes/:nodeId/position")
  async updateNodePosition(
    @Param("id") id: UUID,
    @Param("nodeId") nodeId: UUID,
    @Body() dto: UpdateLearningPathNodePositionDto,
    @CurrentUserId() userId: UUID,
  ) {
    const result = await updateLearningPathNodePosition(
      { learningPathRepository: this.learningPathRepository },
      { userId, pathId: id, nodeId, x: dto.x, y: dto.y },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Post(":id/edges")
  async addEdge(
    @Param("id") id: UUID,
    @Body() dto: AddLearningPathEdgeDto,
    @CurrentUserId() userId: UUID,
  ) {
    const result = await addLearningPathEdge(
      { learningPathRepository: this.learningPathRepository, cryptoService: this.cryptoService },
      { userId, pathId: id, sourceNodeId: dto.sourceNodeId, targetNodeId: dto.targetNodeId },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Delete(":id/edges/:edgeId")
  @HttpCode(200)
  async removeEdge(
    @Param("id") id: UUID,
    @Param("edgeId") edgeId: UUID,
    @CurrentUserId() userId: UUID,
  ) {
    const result = await deleteLearningPathEdge(
      { learningPathRepository: this.learningPathRepository },
      { userId, pathId: id, edgeId },
    );
    if (result instanceof BaseError) throw toHttpException(result);
  }
}
