import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { BaseError, type CryptoService, type CurrentUser, type UUID } from "domain-lib";
import type {
  CandidateNodesPort,
  CandidateNodeEnergyLevel,
  IBreakRepository,
  ISessionRepository,
  LearningPathMembershipPort,
  NotificationPort,
} from "@pomodoro/domain";
import {
  attachOpenSegment,
  attributeSession,
  continueSession,
  endBreak,
  endSession,
  extendBreak,
  extendSession,
  getActiveBreak,
  getActiveSession,
  getBreakHistory,
  getSessionHistory,
  startBreak,
  startSession,
  suggestSessionTarget,
  switchTarget,
  type SegmentTargetInput,
} from "@pomodoro/application";
import {
  ExtendBreakDto,
  ExtendSessionDto,
  GetHistoryDto,
  StartSessionDto,
  SwitchTargetDto,
} from "./dto/request/index.js";
import { toHttpException } from "../errors/domain-error-mapper.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser as CurrentUserDecorator } from "../auth/current-user.decorator.js";

@UseGuards(JwtAuthGuard)
@Controller("api/v1/pomodoro")
export class PomodoroController {
  constructor(
    @Inject("IPomodoroSessionRepository")
    private readonly sessionRepository: ISessionRepository,
    @Inject("IPomodoroBreakRepository")
    private readonly breakRepository: IBreakRepository,
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
  async getActiveSession(@CurrentUserDecorator() currentUser: CurrentUser) {
    const result = await getActiveSession({
      sessionRepository: this.sessionRepository,
      notificationPort: this.notificationPort,
      currentUser,
    });
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Post("sessions")
  async startSession(
    @Body() dto: StartSessionDto,
    @CurrentUserDecorator() currentUser: CurrentUser,
  ) {
    const result = await startSession(
      {
        sessionRepository: this.sessionRepository,
        cryptoService: this.cryptoService,
        learningPathMembershipPort: this.learningPathMembershipPort,
        currentUser,
      },
      {
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
    @CurrentUserDecorator() currentUser: CurrentUser,
  ) {
    const result = await switchTarget(
      {
        sessionRepository: this.sessionRepository,
        cryptoService: this.cryptoService,
        learningPathMembershipPort: this.learningPathMembershipPort,
        currentUser,
      },
      { sessionId: id, target: dto.target as SegmentTargetInput },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Patch("sessions/:id/attach")
  async attachOpenSegment(
    @Param("id") id: UUID,
    @Body() dto: SwitchTargetDto,
    @CurrentUserDecorator() currentUser: CurrentUser,
  ) {
    const result = await attachOpenSegment(
      {
        sessionRepository: this.sessionRepository,
        learningPathMembershipPort: this.learningPathMembershipPort,
        currentUser,
      },
      { sessionId: id, target: dto.target as SegmentTargetInput },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Patch("sessions/:id/attribute")
  async attributeSession(
    @Param("id") id: UUID,
    @Body() dto: SwitchTargetDto,
    @CurrentUserDecorator() currentUser: CurrentUser,
  ) {
    const result = await attributeSession(
      {
        sessionRepository: this.sessionRepository,
        learningPathMembershipPort: this.learningPathMembershipPort,
        currentUser,
      },
      { sessionId: id, target: dto.target as SegmentTargetInput },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Post("sessions/:id/end")
  async endSession(
    @Param("id") id: UUID,
    @CurrentUserDecorator() currentUser: CurrentUser,
  ) {
    const result = await endSession(
      {
        sessionRepository: this.sessionRepository,
        notificationPort: this.notificationPort,
        currentUser,
      },
      { sessionId: id },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Post("sessions/:id/continue")
  async continueSession(
    @Param("id") id: UUID,
    @CurrentUserDecorator() currentUser: CurrentUser,
  ) {
    const result = await continueSession(
      {
        sessionRepository: this.sessionRepository,
        cryptoService: this.cryptoService,
        currentUser,
      },
      { sessionId: id },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Patch("sessions/:id/extend")
  async extendSession(
    @Param("id") id: UUID,
    @Body() dto: ExtendSessionDto,
    @CurrentUserDecorator() currentUser: CurrentUser,
  ) {
    const result = await extendSession(
      { sessionRepository: this.sessionRepository, currentUser },
      { sessionId: id, minutes: dto.minutes },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Get("breaks/active")
  async getActiveBreak(@CurrentUserDecorator() currentUser: CurrentUser) {
    const result = await getActiveBreak({
      breakRepository: this.breakRepository,
      currentUser,
    });
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Post("breaks")
  async startBreak(@CurrentUserDecorator() currentUser: CurrentUser) {
    const result = await startBreak({
      breakRepository: this.breakRepository,
      sessionRepository: this.sessionRepository,
      cryptoService: this.cryptoService,
      notificationPort: this.notificationPort,
      currentUser,
    });
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Patch("breaks/:id/extend")
  async extendBreak(
    @Param("id") id: UUID,
    @Body() dto: ExtendBreakDto,
    @CurrentUserDecorator() currentUser: CurrentUser,
  ) {
    const result = await extendBreak(
      { breakRepository: this.breakRepository, currentUser },
      { breakId: id, seconds: dto.seconds },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Post("breaks/:id/end")
  async endBreak(
    @Param("id") id: UUID,
    @CurrentUserDecorator() currentUser: CurrentUser,
  ) {
    const result = await endBreak(
      { breakRepository: this.breakRepository, currentUser },
      { breakId: id },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Get("suggestion")
  async suggestSessionTarget(
    @Query("energy") energy: CandidateNodeEnergyLevel | undefined,
    @CurrentUserDecorator() currentUser: CurrentUser,
  ) {
    const result = await suggestSessionTarget(
      {
        sessionRepository: this.sessionRepository,
        candidateNodesPort: this.candidateNodesPort,
        currentUser,
      },
      { energy },
    );
    if (result instanceof BaseError) throw toHttpException(result);
    return result;
  }

  @Get("history")
  async getHistory(
    @Query() query: GetHistoryDto,
    @CurrentUserDecorator() currentUser: CurrentUser,
  ) {
    const since = new Date(query.since);
    const until = query.until ? new Date(query.until) : undefined;

    const [sessionResult, breakResult] = await Promise.all([
      getSessionHistory(
        { sessionRepository: this.sessionRepository, currentUser },
        { since, until },
      ),
      getBreakHistory(
        { breakRepository: this.breakRepository, currentUser },
        { since, until },
      ),
    ]);

    if (sessionResult instanceof BaseError)
      throw toHttpException(sessionResult);
    if (breakResult instanceof BaseError) throw toHttpException(breakResult);

    return {
      sessions: sessionResult.sessions,
      segments: sessionResult.segments,
      breaks: breakResult,
    };
  }
}
