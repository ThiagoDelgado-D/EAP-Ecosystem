import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import { TOO_MANY_REQUESTS_ERROR } from "./rate-limits.js";

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected override throwThrottlingException(): Promise<void> {
    return Promise.reject(
      new HttpException(
        { error: TOO_MANY_REQUESTS_ERROR },
        HttpStatus.TOO_MANY_REQUESTS,
      ),
    );
  }
}
