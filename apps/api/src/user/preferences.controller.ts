import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Patch,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import type { IUserRepository } from "@user/domain";
import {
  getFeatureConfig,
  getWidgetConfig,
  updateFeatureConfig,
  updateWidgetConfig,
} from "@user/application";
import { BaseError, type JwtService } from "domain-lib";
import { UpdateFeatureConfigDto } from "./dto/request/update-feature-config.dto.js";
import { UpdateWidgetConfigDto } from "./dto/request/update-widget-config.dto.js";
import { toHttpException } from "../errors/domain-error-mapper.js";
import type { Request } from "express";

@Controller("api/v1/preferences")
export class PreferencesController {
  constructor(
    @Inject("IUserRepository") private readonly userRepository: IUserRepository,
    @Inject("IJwtService") private readonly jwtService: JwtService,
  ) {}

  private async resolveUserId(req: Request): Promise<string> {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) throw new UnauthorizedException();
    const token = authHeader.slice(7);
    const payload = await this.jwtService.verify(token);
    if (!payload?.sub) throw new UnauthorizedException();
    return payload.sub;
  }

  @Get("features")
  async getFeatures(@Req() req: Request) {
    const userId = await this.resolveUserId(req);
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
    @Req() req: Request,
  ) {
    const userId = await this.resolveUserId(req);
    const result = await updateFeatureConfig(
      { userRepository: this.userRepository },
      { userId, featureConfig: dto.featureConfig },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Get("widgets")
  async getWidgets(@Req() req: Request) {
    const userId = await this.resolveUserId(req);
    const result = await getWidgetConfig(
      { userRepository: this.userRepository },
      { userId },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Patch("widgets")
  @HttpCode(200)
  async updateWidgets(@Body() dto: UpdateWidgetConfigDto, @Req() req: Request) {
    const userId = await this.resolveUserId(req);
    const result = await updateWidgetConfig(
      { userRepository: this.userRepository },
      { userId, widgetConfig: dto.widgetConfig },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }
}
