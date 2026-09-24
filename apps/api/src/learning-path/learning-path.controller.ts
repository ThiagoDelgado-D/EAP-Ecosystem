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
import { BaseError, type CryptoService, type CurrentUser, type UUID } from "domain-lib";
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
  listLearningPathsWithNodes,
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
import { CurrentUser as CurrentUserDecorator } from "../auth/current-user.decorator.js";

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
    @CurrentUserDecorator() currentUser: CurrentUser,
  ) {
    const result = await createLearningPath(
      { learningPathRepository: this.learningPathRepository, cryptoService: this.cryptoService, currentUser },
      dto,
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Get()
  async list(@CurrentUserDecorator() currentUser: CurrentUser) {
    return listLearningPaths({ learningPathRepository: this.learningPathRepository, currentUser });
  }

  @Get("with-nodes")
  async listWithNodes(@CurrentUserDecorator() currentUser: CurrentUser) {
    return listLearningPathsWithNodes({ learningPathRepository: this.learningPathRepository, currentUser });
  }

  @Get(":id")
  async findOne(@Param("id") id: UUID, @CurrentUserDecorator() currentUser: CurrentUser) {
    const result = await getLearningPath(
      { learningPathRepository: this.learningPathRepository, currentUser },
      { pathId: id },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Patch(":id")
  async update(
    @Param("id") id: UUID,
    @Body() dto: UpdateLearningPathDto,
    @CurrentUserDecorator() currentUser: CurrentUser,
  ) {
    const result = await updateLearningPath(
      { learningPathRepository: this.learningPathRepository, currentUser },
      { pathId: id, ...dto },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Delete(":id")
  @HttpCode(200)
  async remove(@Param("id") id: UUID, @CurrentUserDecorator() currentUser: CurrentUser) {
    const result = await deleteLearningPath(
      { learningPathRepository: this.learningPathRepository, currentUser },
      { pathId: id },
    );
    if (result instanceof BaseError) throw toHttpException(result);
  }

  @Post(":id/nodes")
  async addNode(
    @Param("id") id: UUID,
    @Body() dto: AddLearningPathNodeDto,
    @CurrentUserDecorator() currentUser: CurrentUser,
  ) {
    const result = await addLearningPathNode(
      { learningPathRepository: this.learningPathRepository, cryptoService: this.cryptoService, currentUser },
      { pathId: id, ...dto },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Patch(":id/nodes/:nodeId")
  async updateNode(
    @Param("id") id: UUID,
    @Param("nodeId") nodeId: UUID,
    @Body() dto: UpdateLearningPathNodeDto,
    @CurrentUserDecorator() currentUser: CurrentUser,
  ) {
    const result = await updateLearningPathNode(
      { learningPathRepository: this.learningPathRepository, currentUser },
      { pathId: id, nodeId, ...dto },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Delete(":id/nodes/:nodeId")
  @HttpCode(200)
  async removeNode(
    @Param("id") id: UUID,
    @Param("nodeId") nodeId: UUID,
    @CurrentUserDecorator() currentUser: CurrentUser,
  ) {
    const result = await deleteLearningPathNode(
      { learningPathRepository: this.learningPathRepository, currentUser },
      { pathId: id, nodeId },
    );
    if (result instanceof BaseError) throw toHttpException(result);
  }

  @Patch(":id/nodes/:nodeId/progress")
  async updateNodeProgress(
    @Param("id") id: UUID,
    @Param("nodeId") nodeId: UUID,
    @Body() dto: UpdateLearningPathNodeProgressDto,
    @CurrentUserDecorator() currentUser: CurrentUser,
  ) {
    const result = await updateLearningPathNodeProgress(
      { learningPathRepository: this.learningPathRepository, currentUser },
      { pathId: id, nodeId, progress: dto.progress },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Patch(":id/nodes/:nodeId/position")
  async updateNodePosition(
    @Param("id") id: UUID,
    @Param("nodeId") nodeId: UUID,
    @Body() dto: UpdateLearningPathNodePositionDto,
    @CurrentUserDecorator() currentUser: CurrentUser,
  ) {
    const result = await updateLearningPathNodePosition(
      { learningPathRepository: this.learningPathRepository, currentUser },
      { pathId: id, nodeId, x: dto.x, y: dto.y },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Post(":id/edges")
  async addEdge(
    @Param("id") id: UUID,
    @Body() dto: AddLearningPathEdgeDto,
    @CurrentUserDecorator() currentUser: CurrentUser,
  ) {
    const result = await addLearningPathEdge(
      { learningPathRepository: this.learningPathRepository, cryptoService: this.cryptoService, currentUser },
      { pathId: id, sourceNodeId: dto.sourceNodeId, targetNodeId: dto.targetNodeId },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Delete(":id/edges/:edgeId")
  @HttpCode(200)
  async removeEdge(
    @Param("id") id: UUID,
    @Param("edgeId") edgeId: UUID,
    @CurrentUserDecorator() currentUser: CurrentUser,
  ) {
    const result = await deleteLearningPathEdge(
      { learningPathRepository: this.learningPathRepository, currentUser },
      { pathId: id, edgeId },
    );
    if (result instanceof BaseError) throw toHttpException(result);
  }
}
