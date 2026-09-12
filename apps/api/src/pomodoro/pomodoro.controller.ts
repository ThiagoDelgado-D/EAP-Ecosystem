import { Body, Controller, Get, HttpCode, Inject, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { BaseError, type CryptoService, type UUID } from "domain-lib";
import type {
  CandidateNodesPort,
  CandidateNodeEnergyLevel,
  ISessionRepository,
  LearningPathMembershipPort,
  NotificationPort,
} from "@pomodoro/domain";
import {
  attachOpenSegment,
  endSession,
  getActiveSession,
  startBreak,
  startSession,
  suggestSessionTarget,
  switchTarget,
  type SegmentTargetInput,
} from "@pomodoro/application";
import { StartSessionDto, SwitchTargetDto } from "./dto/request/index.js";
import { toHttpException } from "../errors/domain-error-mapper.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUserId } from "../auth/current-user-id.decorator.js";

@UseGuards(JwtAuthGuard)
@Controller("api/v1/pomodoro")
export class PomodoroController {
  constructor(
    @Inject("IPomodoroSessionRepository")
    private readonly sessionRepository: ISessionRepository,
    @Inject("ICryptoService")
    private readonly cryptoService: CryptoService,
    @Inject("ILearningPathMembershipPort")
    private readonly learningPathMembershipPort: LearningPathMembershipPort,
    @Inject("INotificationPort")
    private readonly notificationPort: NotificationPort,
    @Inject("ICandidateNodesPort")
    private readonly candidateNodesPort: CandidateNodesPort,
  ) {}

  @Get("sessions/active")
  async getActiveSession(@CurrentUserId() userId: UUID) {
    const result = await getActiveSession(
      { sessionRepository: this.sessionRepository },
      { userId },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Post("sessions")
  async startSession(
    @Body() dto: StartSessionDto,
    @CurrentUserId() userId: UUID,
  ) {
    const result = await startSession(
      {
        sessionRepository: this.sessionRepository,
        cryptoService: this.cryptoService,
        learningPathMembershipPort: this.learningPathMembershipPort,
      },
      {
        userId,
        plannedMin: dto.plannedMin,
        intent: dto.intent,
        target: dto.target as SegmentTargetInput,
      },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Patch("sessions/:id/target")
  async switchTarget(
    @Param("id") id: UUID,
    @Body() dto: SwitchTargetDto,
    @CurrentUserId() userId: UUID,
  ) {
    const result = await switchTarget(
      {
        sessionRepository: this.sessionRepository,
        cryptoService: this.cryptoService,
        learningPathMembershipPort: this.learningPathMembershipPort,
      },
      { userId, sessionId: id, target: dto.target as SegmentTargetInput },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Patch("sessions/:id/attach")
  async attachOpenSegment(
    @Param("id") id: UUID,
    @Body() dto: SwitchTargetDto,
    @CurrentUserId() userId: UUID,
  ) {
    const result = await attachOpenSegment(
      {
        sessionRepository: this.sessionRepository,
        learningPathMembershipPort: this.learningPathMembershipPort,
      },
      { userId, sessionId: id, target: dto.target as SegmentTargetInput },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Post("sessions/:id/end")
  async endSession(@Param("id") id: UUID, @CurrentUserId() userId: UUID) {
    const result = await endSession(
      {
        sessionRepository: this.sessionRepository,
        notificationPort: this.notificationPort,
      },
      { userId, sessionId: id },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Post("breaks")
  @HttpCode(200)
  async startBreak() {
    await startBreak({ notificationPort: this.notificationPort });
  }

  @Get("suggestion")
  async suggestSessionTarget(
    @Query("energy") energy: CandidateNodeEnergyLevel | undefined,
    @CurrentUserId() userId: UUID,
  ) {
    const result = await suggestSessionTarget(
      {
        sessionRepository: this.sessionRepository,
        candidateNodesPort: this.candidateNodesPort,
      },
      { userId, energy },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }
}
