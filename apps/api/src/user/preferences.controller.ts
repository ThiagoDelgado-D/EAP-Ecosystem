import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Patch,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import type {
  AccountStatsPort,
  EntitlementsProvider,
  IUserRepository,
  UserAppearancePreferences,
} from "@user/domain";
import {
  getAccountStats,
  getEnabledModules,
  getWidgetConfig,
  getUserAppearance,
  updateEnabledModules,
  updateWidgetConfig,
  updateUserAppearance,
  resetPreferences,
  previewIntakeSetup,
  getIntake,
  applyIntake,
} from "@user/application";
import { BaseError, type UUID } from "domain-lib";
import { UpdateEnabledModulesDto } from "./dto/request/update-enabled-modules.dto.js";
import { UpdateWidgetConfigDto } from "./dto/request/update-widget-config.dto.js";
import { UpdateUserAppearanceDto } from "./dto/request/update-user-appearance.dto.js";
import { IntakeAnswersDto } from "./dto/request/intake-answers.dto.js";
import { ApplyIntakeDto } from "./dto/request/apply-intake.dto.js";
import { toHttpException } from "../errors/domain-error-mapper.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUserId } from "../auth/current-user-id.decorator.js";

@UseGuards(JwtAuthGuard)
@Controller("api/v1/preferences")
export class PreferencesController {
  constructor(
    @Inject("IUserRepository") private readonly userRepository: IUserRepository,
    @Inject("IAccountStatsPort") private readonly accountStatsPort: AccountStatsPort,
    @Inject("IEntitlementsProvider")
    private readonly entitlementsProvider: EntitlementsProvider,
  ) {}

  @Get("stats")
  async getStats(@CurrentUserId() userId: UUID) {
    return getAccountStats({ accountStatsPort: this.accountStatsPort }, { userId });
  }

  @Get("modules")
  async getModules(@CurrentUserId() userId: UUID) {
    const result = await getEnabledModules(
      {
        userRepository: this.userRepository,
        entitlementsProvider: this.entitlementsProvider,
      },
      { userId },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Patch("modules")
  @HttpCode(200)
  async updateModules(
    @Body() dto: UpdateEnabledModulesDto,
    @CurrentUserId() userId: UUID,
  ) {
    const result = await updateEnabledModules(
      {
        userRepository: this.userRepository,
        entitlementsProvider: this.entitlementsProvider,
      },
      { userId, enabledModules: dto.enabledModules },
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

  @Get("intake")
  async getIntake(@CurrentUserId() userId: UUID) {
    const result = await getIntake({ userRepository: this.userRepository }, { userId });
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Put("intake")
  @HttpCode(200)
  async applyIntake(@Body() dto: ApplyIntakeDto, @CurrentUserId() userId: UUID) {
    const result = await applyIntake(
      {
        userRepository: this.userRepository,
        entitlementsProvider: this.entitlementsProvider,
      },
      {
        userId,
        intake: { goals: dto.intake.goals, studyStyle: dto.intake.studyStyle },
        enabledModules: dto.enabledModules,
        weeklyGoalMinutes: dto.weeklyGoalMinutes,
      },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Post("intake/preview")
  @HttpCode(200)
  previewIntake(@Body() dto: IntakeAnswersDto) {
    return previewIntakeSetup({
      intake: { goals: dto.goals, studyStyle: dto.studyStyle },
    });
  }

  @Post("reset")
  @HttpCode(200)
  async resetPreferences(@CurrentUserId() userId: UUID) {
    const result = await resetPreferences(
      {
        userRepository: this.userRepository,
        entitlementsProvider: this.entitlementsProvider,
      },
      { userId },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }
}
