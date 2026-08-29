import {
  createParamDecorator,
  type ExecutionContext,
  InternalServerErrorException,
} from "@nestjs/common";
import type { Request } from "express";
import type { UUID } from "domain-lib";

export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UUID => {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (!req.userId) {
      throw new InternalServerErrorException(
        "CurrentUserId used without JwtAuthGuard",
      );
    }
    return req.userId;
  },
);
