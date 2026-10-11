import { Test } from "@nestjs/testing";
import {
  Controller,
  Get,
  HttpStatus,
  PayloadTooLargeException,
  UnauthorizedException,
  type INestApplication,
} from "@nestjs/common";
import request from "supertest";
import { TooManyRequestsError, UnauthorizedError, UnexpectedError } from "domain-lib";
import { GlobalExceptionFilter } from "./http-exception-filter.js";
import { ApiErrorException } from "../errors/api-error-exception.js";

const RETRY_AFTER_SECONDS = 42;

@Controller("test")
class TestController {
  @Get("api-error")
  throwApiError() {
    throw new ApiErrorException(
      new TooManyRequestsError(RETRY_AFTER_SECONDS),
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  @Get("unauthorized")
  throwUnauthorized() {
    throw new UnauthorizedException();
  }

  @Get("payload-too-large")
  throwPayloadTooLarge() {
    throw new PayloadTooLargeException();
  }

  @Get("unknown-error")
  throwUnknown() {
    throw new Error("unexpected");
  }
}

describe("GlobalExceptionFilter", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [TestController],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterAll(async () => await app.close());

  it("should send an API error's body with its status", () => {
    return request(app.getHttpServer())
      .get("/test/api-error")
      .expect(HttpStatus.TOO_MANY_REQUESTS)
      .expect({
        error: new TooManyRequestsError().name,
        retryAfterSeconds: RETRY_AFTER_SECONDS,
      });
  });

  it("should turn the framework's 401 into UNAUTHORIZED_ERROR", () => {
    return request(app.getHttpServer())
      .get("/test/unauthorized")
      .expect(HttpStatus.UNAUTHORIZED)
      .expect({ error: new UnauthorizedError().name });
  });

  it("should keep the status of an unmapped HttpException and send UNEXPECTED_ERROR", () => {
    return request(app.getHttpServer())
      .get("/test/payload-too-large")
      .expect(HttpStatus.PAYLOAD_TOO_LARGE)
      .expect({ error: new UnexpectedError().name });
  });

  it("should return 500 with UNEXPECTED_ERROR for unknown errors", () => {
    return request(app.getHttpServer())
      .get("/test/unknown-error")
      .expect(HttpStatus.INTERNAL_SERVER_ERROR)
      .expect({ error: new UnexpectedError().name });
  });
});
