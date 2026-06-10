import type {
  ILearningResourceRepository,
  IResourceTypeRepository,
  ITopicRepository,
  ResourceFilters,
} from "@learning-resource/domain";
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
  Query,
} from "@nestjs/common";
import {
  AddResourceDto,
  PreviewUrlDto,
  ToggleDifficultyDto,
  ToggleEnergyDto,
  ToggleMentalStateDto,
  ToggleStatusDto,
  UpdateResourceDto,
} from "./dto/request/index.js";
import {
  addResource,
  deleteResource,
  GetResourceById,
  getResourcesByFilter,
  getSuggestions,
  previewUrl,
  toggleResourceDifficulty,
  toggleResourceEnergy,
  toggleMentalState,
  toggleStatus,
  updateResource,
  type IUrlMetadataService,
} from "@learning-resource/application";
import { BaseError, type CryptoService, type UUID } from "domain-lib";
import { toHttpException } from "../errors/domain-error-mapper.js";
import { isUUID } from "class-validator";

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
    @Inject("IUrlMetadataService")
    private readonly urlMetadataService: IUrlMetadataService,
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
  async listResources(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("q") q?: string,
    @Query("difficulty") difficulty?: string,
    @Query("energyLevel") energyLevel?: string,
    @Query("status") status?: string,
    @Query("mentalState") mentalState?: string,
    @Query("resourceTypeId") resourceTypeId?: string,
  ) {
    const filters: ResourceFilters = {};
    if (q) filters.q = q;
    if (difficulty) filters.difficulty = difficulty;
    if (energyLevel) filters.energyLevel = energyLevel;
    if (status) filters.status = status;
    if (mentalState) filters.mentalState = mentalState;
    if (resourceTypeId && isUUID(resourceTypeId)) filters.resourceTypeId = resourceTypeId as UUID;

    const parsedPage = parseInt(page ?? "", 10);
    const parsedPageSize = parseInt(pageSize ?? "", 10);

    return getResourcesByFilter(
      { learningResourceRepository: this.learningResourceRepository },
      {
        filters,
        page: Number.isNaN(parsedPage) ? 1 : parsedPage,
        pageSize: Number.isNaN(parsedPageSize) ? 20 : parsedPageSize,
      },
    );
  }

  @Get("suggestions")
  async suggestions(@Query("q") q?: string) {
    return getSuggestions(
      { learningResourceRepository: this.learningResourceRepository },
      q ?? "",
    );
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

  @Delete(":id")
  async remove(@Param("id") id: UUID) {
    const result = await deleteResource(
      { learningResourceRepository: this.learningResourceRepository },
      { id },
    );
    if (result instanceof BaseError) toHttpException(result);
  }

  @Patch(":id/difficulty")
  async toggleDifficulty(
    @Param("id") id: UUID,
    @Body() dto: ToggleDifficultyDto,
  ) {
    const result = await toggleResourceDifficulty(
      { learningResourceRepository: this.learningResourceRepository },
      { id, difficulty: dto.difficulty },
    );
    if (result instanceof BaseError) toHttpException(result);
  }

  @Patch(":id/energy")
  async toggleEnergy(@Param("id") id: UUID, @Body() dto: ToggleEnergyDto) {
    const result = await toggleResourceEnergy(
      { learningResourceRepository: this.learningResourceRepository },
      { id, energyLevel: dto.energyLevel },
    );
    if (result instanceof BaseError) toHttpException(result);
  }

  @Patch(":id/status")
  async toggleStatus(@Param("id") id: UUID, @Body() dto: ToggleStatusDto) {
    const result = await toggleStatus(
      { learningResourceRepository: this.learningResourceRepository },
      { id, status: dto.status },
    );
    if (result instanceof BaseError) toHttpException(result);
  }

  @Patch(":id/mental-state")
  async toggleMentalState(
    @Param("id") id: UUID,
    @Body() dto: ToggleMentalStateDto,
  ) {
    const result = await toggleMentalState(
      { learningResourceRepository: this.learningResourceRepository },
      { id, mentalState: dto.mentalState },
    );
    if (result instanceof BaseError) toHttpException(result);
  }

  @Post("preview")
  @HttpCode(200)
  async preview(@Body() dto: PreviewUrlDto) {
    const result = await previewUrl(
      {
        urlMetadataService: this.urlMetadataService,
        resourceTypeRepository: this.resourceTypeRepository,
      },
      { url: dto.url },
    );
    if (result instanceof BaseError) toHttpException(result);
    return result;
  }
}
