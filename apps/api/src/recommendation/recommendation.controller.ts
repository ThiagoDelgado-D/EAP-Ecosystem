import { Body, Controller, Get, Inject, Post, UseGuards } from "@nestjs/common";
import { BaseError, type CurrentUser } from "domain-lib";
import type {
  IRecommendationContextRepository,
  LearningPathCandidatesPort,
  LearningResourceCandidatesPort,
} from "@recommendation/domain";
import { getRecommendations, setRecommendationContext } from "@recommendation/application";
import { SetRecommendationContextDto } from "./dto/request/index.js";
import { toHttpException } from "../errors/domain-error-mapper.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser as CurrentUserDecorator } from "../auth/current-user.decorator.js";

@UseGuards(JwtAuthGuard)
@Controller("api/v1/recommendations")
export class RecommendationController {
  constructor(
    @Inject("IRecommendationContextRepository")
    private readonly recommendationContextRepository: IRecommendationContextRepository,
    @Inject("ILearningResourceCandidatesPort")
    private readonly learningResourceCandidatesPort: LearningResourceCandidatesPort,
    @Inject("ILearningPathCandidatesPort")
    private readonly learningPathCandidatesPort: LearningPathCandidatesPort,
  ) {}

  @Get()
  async getRecommendations(@CurrentUserDecorator() currentUser: CurrentUser) {
    const result = await getRecommendations({
      recommendationContextRepository: this.recommendationContextRepository,
      learningResourceCandidatesPort: this.learningResourceCandidatesPort,
      learningPathCandidatesPort: this.learningPathCandidatesPort,
      currentUser,
    });
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Post("context")
  async setRecommendationContext(
    @Body() dto: SetRecommendationContextDto,
    @CurrentUserDecorator() currentUser: CurrentUser,
  ) {
    const result = await setRecommendationContext(
      {
        recommendationContextRepository: this.recommendationContextRepository,
        currentUser,
      },
      {
        energyLevel: dto.energyLevel,
        availableMinutes: dto.availableMinutes,
        mentalState: dto.mentalState,
      },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }
}
