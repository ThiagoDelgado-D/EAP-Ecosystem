import { Test } from "@nestjs/testing";
import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  type INestApplication,
} from "@nestjs/common";
import request from "supertest";
import { GlobalExceptionFilter } from "./http-exception-filter.js";

@Controller("test")
class TestController {
  @Get("http-exception")
  throwHttp() {
    throw new HttpException({ code: "TEST_ERROR" }, HttpStatus.BAD_REQUEST);
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

  afterAll(() => app.close());

  it("should return the HttpException status and body", () => {
    return request(app.getHttpServer())
      .get("/test/http-exception")
      .expect(400)
      .expect({ code: "TEST_ERROR" });
  });

  it("should return 500 for unknown errors", () => {
    return request(app.getHttpServer())
      .get("/test/unknown-error")
      .expect(500)
      .expect({ message: "Internal server error" });
  });
});
