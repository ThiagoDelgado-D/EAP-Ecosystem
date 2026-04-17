import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { type Observable, tap } from "rxjs";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const handlerName = context.getHandler().name;
    const start = Date.now();

    this.logRequest(req, handlerName);

    return next.handle().pipe(
      tap({
        next: () => {
          const res = ctx.getResponse<Response>();
          this.logResponse(
            req.method,
            req.url,
            handlerName,
            res.statusCode,
            Date.now() - start,
          );
        },
        error: (err: { status?: number }) => {
          this.logResponse(
            req.method,
            req.url,
            handlerName,
            err.status ?? 500,
            Date.now() - start,
          );
        },
      }),
    );
  }

  private logRequest(req: Request, handlerName: string): void {
    const { method, url, body, query } = req;

    const hasBody =
      ["POST", "PATCH", "PUT"].includes(method) &&
      body &&
      Object.keys(body).length > 0;

    const hasQuery = query && Object.keys(query).length > 0;

    const header = `→ ${method.padEnd(6)} [${handlerName}]`.padEnd(32) + ` ${url}`;
    this.logger.log(header);

    if (hasQuery) {
      this.logger.debug(`  query: ${this.serialize(query)}`);
    }

    if (hasBody) {
      this.logger.log(`  body:  ${this.serialize(body)}`);
    }
  }

  private logResponse(
    method: string,
    url: string,
    handlerName: string,
    statusCode: number,
    duration: number,
  ): void {
    const icon = statusCode >= 500 ? "✕" : statusCode >= 400 ? "!" : "←";
    const label = `${icon} ${statusCode}`;
    const msg = `${label.padEnd(8)} [${handlerName}]`.padEnd(32) + ` ${url}  +${duration}ms`;

    if (statusCode >= 500) {
      this.logger.error(msg);
    } else if (statusCode >= 400) {
      this.logger.warn(msg);
    } else {
      this.logger.log(msg);
    }
  }

  private serialize(obj: unknown): string {
    const str = JSON.stringify(obj);
    return str.length > 300 ? str.slice(0, 300) + "…" : str;
  }
}
