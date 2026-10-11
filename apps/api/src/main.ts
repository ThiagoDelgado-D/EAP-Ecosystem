import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { configureRequestHandling } from "./app-setup.js";
import type { NestExpressApplication } from "@nestjs/platform-express";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set("trust proxy", 1);
  configureRequestHandling(app);
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:4200",
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
