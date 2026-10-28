import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { configureRequestHandling } from "./app-setup.js";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { serveWebClient } from "./web-client.js";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableShutdownHooks();
  app.set("trust proxy", 1);
  configureRequestHandling(app);
  if (process.env.WEB_DIST) {
    serveWebClient(app, process.env.WEB_DIST);
  }
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:4200",
    credentials: true,
  });
  const port = process.env.PORT ?? 3000;
  if (process.env.HOST) {
    await app.listen(port, process.env.HOST);
  } else {
    await app.listen(port);
  }
}
bootstrap();
