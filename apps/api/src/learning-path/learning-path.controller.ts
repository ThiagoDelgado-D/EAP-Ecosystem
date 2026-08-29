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
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { BaseError, type CryptoService, type JwtService, type UUID } from "domain-lib";
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
  updateLearningPathNodeProgress,
} from "@learning-resource/application";
import {
  AddLearningPathEdgeDto,
  AddLearningPathNodeDto,
  CreateLearningPathDto,
  UpdateLearningPathDto,
  UpdateLearningPathNodeDto,
  UpdateLearningPathNodeProgressDto,
} from "./dto/request/index.js";
import { toHttpException } from "../errors/domain-error-mapper.js";

@Controller("api/v1/learning-paths")
export class LearningPathController {
  constructor(
    @Inject("ILearningPathRepository")
    private readonly learningPathRepository: ILearningPathRepository,
    @Inject("ICryptoService")
    private readonly cryptoService: CryptoService,
    @Inject("IJwtService")
    private readonly jwtService: JwtService,
  ) {}

  private async resolveUserId(req: Request): Promise<UUID> {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) throw new UnauthorizedException();
    const token = authHeader.slice(7);
    const payload = await this.jwtService.verify(token);
    if (!payload?.sub) throw new UnauthorizedException();
    return payload.sub as UUID;
  }

  @Post()
  async create(@Body() dto: CreateLearningPathDto, @Req() req: Request) {
    const userId = await this.resolveUserId(req);
    const result = await createLearningPath(
      { learningPathRepository: this.learningPathRepository, cryptoService: this.cryptoService },
      { userId, ...dto },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Get()
  async list(@Req() req: Request) {
    const userId = await this.resolveUserId(req);
    const result = await listLearningPaths(
      { learningPathRepository: this.learningPathRepository },
      { userId },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Get(":id")
  async findOne(@Param("id") id: UUID, @Req() req: Request) {
    const userId = await this.resolveUserId(req);
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
    @Req() req: Request,
  ) {
    const userId = await this.resolveUserId(req);
    const result = await updateLearningPath(
      { learningPathRepository: this.learningPathRepository },
      { userId, pathId: id, ...dto },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Delete(":id")
  @HttpCode(200)
  async remove(@Param("id") id: UUID, @Req() req: Request) {
    const userId = await this.resolveUserId(req);
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
    @Req() req: Request,
  ) {
    const userId = await this.resolveUserId(req);
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
    @Req() req: Request,
  ) {
    const userId = await this.resolveUserId(req);
    const result = await updateLearningPathNode(
      { learningPathRepository: this.learningPathRepository },
      { userId, pathId: id, nodeId, ...dto },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Delete(":id/nodes/:nodeId")
  @HttpCode(200)
  async removeNode(@Param("id") id: UUID, @Param("nodeId") nodeId: UUID, @Req() req: Request) {
    const userId = await this.resolveUserId(req);
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
    @Req() req: Request,
  ) {
    const userId = await this.resolveUserId(req);
    const result = await updateLearningPathNodeProgress(
      { learningPathRepository: this.learningPathRepository },
      { userId, pathId: id, nodeId, progress: dto.progress },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Post(":id/edges")
  async addEdge(
    @Param("id") id: UUID,
    @Body() dto: AddLearningPathEdgeDto,
    @Req() req: Request,
  ) {
    const userId = await this.resolveUserId(req);
    const result = await addLearningPathEdge(
      { learningPathRepository: this.learningPathRepository, cryptoService: this.cryptoService },
      { userId, pathId: id, sourceNodeId: dto.sourceNodeId, targetNodeId: dto.targetNodeId },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Delete(":id/edges/:edgeId")
  @HttpCode(200)
  async removeEdge(@Param("id") id: UUID, @Param("edgeId") edgeId: UUID, @Req() req: Request) {
    const userId = await this.resolveUserId(req);
    const result = await deleteLearningPathEdge(
      { learningPathRepository: this.learningPathRepository },
      { userId, pathId: id, edgeId },
    );
    if (result instanceof BaseError) throw toHttpException(result);
  }
}
