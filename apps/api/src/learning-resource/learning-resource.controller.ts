import type {
  ILearningResourceRepository,
  IResourceTypeRepository,
  ITopicRepository,
} from "@learning-resource/domain";
import { Body, Controller, Inject, Post } from "@nestjs/common";
import {
  AddResourceDto,
  GetResourcesFilterDto,
  ToggleDifficultyDto,
  ToggleEnergyDto,
  ToggleStatusDto,
  UpdateResourceDto,
} from "./dto/request/index.js";
import { addResource } from "@learning-resource/application";
import { BaseError, type CryptoService } from "domain-lib";
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
}
