import { HttpStatus, Injectable, type ExecutionContext } from "@nestjs/common";
import { ThrottlerGuard, type ThrottlerLimitDetail } from "@nestjs/throttler";
import { TooManyRequestsError } from "domain-lib";
import { ApiErrorException } from "../errors/api-error-exception.js";

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected override throwThrottlingException(
    _context: ExecutionContext,
    { timeToBlockExpire }: ThrottlerLimitDetail,
  ): Promise<void> {
    return Promise.reject(
      new ApiErrorException(
        new TooManyRequestsError(timeToBlockExpire),
        HttpStatus.TOO_MANY_REQUESTS,
      ),
    );
  }
}
