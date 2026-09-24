import {
  createParamDecorator,
  type ExecutionContext,
  InternalServerErrorException,
} from "@nestjs/common";
import type { Request } from "express";
import type { CurrentUser as CurrentUserEntity } from "domain-lib";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserEntity => {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (!req.userId) {
      throw new InternalServerErrorException(
        "CurrentUser used without JwtAuthGuard",
      );
    }
    return { id: req.userId };
  },
);
