import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import type { ITopicRepository } from "@learning-resource/domain";
import { getTopics } from "@learning-resource/application";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";

@UseGuards(JwtAuthGuard)
@Controller("api/v1/topics")
export class TopicController {
  constructor(
    @Inject("ITopicRepository")
    private readonly topicRepository: ITopicRepository,
  ) {}

  @Get()
  async list() {
    return await getTopics({ topicRepository: this.topicRepository });
  }
}
