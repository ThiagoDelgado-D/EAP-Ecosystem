import type {
  ILearningResourceRepository,
  IResourceTypeRepository,
  ITopicRepository,
} from "@learning-resource/domain";
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  AddResourceDto,
  GetResourcesFilterDto,
  ToggleDifficultyDto,
  ToggleEnergyDto,
  ToggleStatusDto,
  UpdateResourceDto,
} from "./dto/request/index.js";
import {
  addResource,
  GetResourceById,
  getResourcesByFilter,
  listFormattedResourcesLearning,
  updateResource,
} from "@learning-resource/application";
import { BaseError, type CryptoService, type UUID } from "domain-lib";
import { toHttpException } from "../errors/domain-error-mapper.js";

@Controller("api/v1/learning-resources")
export class LearningResourceController {
  constructor(
    @Inject("ILearningResourceRepository")
    private readonly learningResourceRepository: ILearningResourceRepository,
    @Inject("ITopicRepository")
    private readonly topicRepository: ITopicRepository,
    @Inject("IResourceTypeRepository")
    private readonly resourceTypeRepository: IResourceTypeRepository,
    @Inject("ICryptoService")
    private readonly cryptoService: CryptoService,
  ) {}

  @Post()
  async create(@Body() dto: AddResourceDto) {
    const result = await addResource(
      {
        learningResourceRepository: this.learningResourceRepository,
        resourceTypeRepository: this.resourceTypeRepository,
        topicRepository: this.topicRepository,
        cryptoService: this.cryptoService,
      },
      dto,
    );

    if (result instanceof BaseError) toHttpException(result);
  }
  @Get()
  async list() {
    const result = await listFormattedResourcesLearning({
      learningResourceRepository: this.learningResourceRepository,
    });
    return result;
  }

  @Get("filter")
  async filter(@Query() query: GetResourcesFilterDto) {
    const result = await getResourcesByFilter(
      { learningResourceRepository: this.learningResourceRepository },
      { filters: query },
    );
    return result;
  }

  @Get(":id")
  async findOne(@Param("id") id: UUID) {
    const result = await GetResourceById(
      { learningResourceRepository: this.learningResourceRepository },
      { resourceId: id },
    );
    if (result instanceof BaseError) toHttpException(result);
    return result;
  }

  @Patch(":id")
  async update(@Param("id") id: UUID, @Body() dto: UpdateResourceDto) {
    const result = await updateResource(
      {
        learningResourceRepository: this.learningResourceRepository,
        resourceTypeRepository: this.resourceTypeRepository,
        topicRepository: this.topicRepository,
      },
      { id, ...dto },
    );
    if (result instanceof BaseError) toHttpException(result);
  }
}
