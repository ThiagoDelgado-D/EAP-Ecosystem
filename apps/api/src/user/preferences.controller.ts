import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import type { IUserRepository, UserAppearancePreferences } from "@user/domain";
import {
  getFeatureConfig,
  getWidgetConfig,
  getUserAppearance,
  updateFeatureConfig,
  updateWidgetConfig,
  updateUserAppearance,
  resetPreferences,
} from "@user/application";
import { BaseError, type UUID } from "domain-lib";
import { UpdateFeatureConfigDto } from "./dto/request/update-feature-config.dto.js";
import { UpdateWidgetConfigDto } from "./dto/request/update-widget-config.dto.js";
import { UpdateUserAppearanceDto } from "./dto/request/update-user-appearance.dto.js";
import { toHttpException } from "../errors/domain-error-mapper.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUserId } from "../auth/current-user-id.decorator.js";

@UseGuards(JwtAuthGuard)
@Controller("api/v1/preferences")
export class PreferencesController {
  constructor(
    @Inject("IUserRepository") private readonly userRepository: IUserRepository,
  ) {}

  @Get("features")
  async getFeatures(@CurrentUserId() userId: UUID) {
    const result = await getFeatureConfig(
      { userRepository: this.userRepository },
      { userId },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Patch("features")
  @HttpCode(200)
  async updateFeatures(
    @Body() dto: UpdateFeatureConfigDto,
    @CurrentUserId() userId: UUID,
  ) {
    const result = await updateFeatureConfig(
      { userRepository: this.userRepository },
      { userId, featureConfig: dto.featureConfig },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Get("widgets")
  async getWidgets(@CurrentUserId() userId: UUID) {
    const result = await getWidgetConfig(
      { userRepository: this.userRepository },
      { userId },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Patch("widgets")
  @HttpCode(200)
  async updateWidgets(
    @Body() dto: UpdateWidgetConfigDto,
    @CurrentUserId() userId: UUID,
  ) {
    const result = await updateWidgetConfig(
      { userRepository: this.userRepository },
      { userId, widgetConfig: dto.widgetConfig },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Get("appearance")
  async getAppearance(@CurrentUserId() userId: UUID) {
    const result = await getUserAppearance(
      { userRepository: this.userRepository },
      { userId },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Patch("appearance")
  @HttpCode(200)
  async updateAppearance(
    @Body() dto: UpdateUserAppearanceDto,
    @CurrentUserId() userId: UUID,
  ) {
    const result = await updateUserAppearance(
      { userRepository: this.userRepository },
      { userId, appearance: dto as Partial<UserAppearancePreferences> },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Post("reset")
  @HttpCode(200)
  async resetPreferences(@CurrentUserId() userId: UUID) {
    const result = await resetPreferences(
      { userRepository: this.userRepository },
      { userId },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }
}
