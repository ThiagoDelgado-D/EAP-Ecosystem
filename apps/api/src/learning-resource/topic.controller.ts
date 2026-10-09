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
import type { ITopicRepository } from "@learning-resource/domain";
import { createTopic, deleteTopic, getTopics, updateTopic } from "@learning-resource/application";
import { BaseError, type CryptoService, type CurrentUser, type UUID } from "domain-lib";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser as CurrentUserDecorator } from "../auth/current-user.decorator.js";
import { toHttpException } from "../errors/domain-error-mapper.js";
import { CreateTopicDto, UpdateTopicDto } from "./dto/request/index.js";

@UseGuards(JwtAuthGuard)
@Controller("api/v1/topics")
export class TopicController {
  constructor(
    @Inject("ITopicRepository")
    private readonly topicRepository: ITopicRepository,
    @Inject("ICryptoService")
    private readonly cryptoService: CryptoService,
  ) {}

  @Get()
  async list(@CurrentUserDecorator() currentUser: CurrentUser) {
    return getTopics({ topicRepository: this.topicRepository, currentUser });
  }

  @Post()
  async create(@Body() dto: CreateTopicDto, @CurrentUserDecorator() currentUser: CurrentUser) {
    const result = await createTopic(
      { topicRepository: this.topicRepository, cryptoService: this.cryptoService, currentUser },
      { name: dto.name, color: dto.color },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Patch(":id")
  async update(
    @Param("id") id: UUID,
    @Body() dto: UpdateTopicDto,
    @CurrentUserDecorator() currentUser: CurrentUser,
  ) {
    const result = await updateTopic(
      { topicRepository: this.topicRepository, currentUser },
      { topicId: id, name: dto.name, color: dto.color },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Delete(":id")
  @HttpCode(200)
  async remove(@Param("id") id: UUID, @CurrentUserDecorator() currentUser: CurrentUser) {
    const result = await deleteTopic(
      { topicRepository: this.topicRepository, currentUser },
      { topicId: id },
    );
    if (result instanceof BaseError) throw toHttpException(result);
  }
}
