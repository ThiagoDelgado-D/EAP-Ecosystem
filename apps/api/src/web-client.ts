import { join } from "node:path";
import type { NestExpressApplication } from "@nestjs/platform-express";

export const serveWebClient = (
  app: NestExpressApplication,
  webDist: string,
): void => {
  const indexHtml = join(webDist, "index.html");

  app.useStaticAssets(webDist);
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/")) {
      next();
      return;
    }
    res.sendFile(indexHtml);
  });
};
