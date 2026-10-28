import type { INestApplication } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";

interface ShellMessage {
  data: { type: string; databaseKey?: string };
}

interface ParentPort {
  postMessage(message: { type: string }): void;
  on(event: "message", listener: (message: ShellMessage) => void): void;
}

// Inside the desktop app the API runs as a child of the app shell, which hands
// over the key through this channel so it never sits in the process environment.
const shellPort = (): ParentPort | undefined =>
  (process as NodeJS.Process & { parentPort?: ParentPort }).parentPort;

export const resolveDatabaseKey = (
  configService: ConfigService,
): Promise<string> => {
  const port = shellPort();
  if (!port) {
    return Promise.resolve(configService.getOrThrow<string>("DB_KEY"));
  }

  return new Promise((resolve) => {
    port.on("message", ({ data }) => {
      if (data.type === "database-key" && data.databaseKey) {
        resolve(data.databaseKey);
      }
    });
    port.postMessage({ type: "database-key-request" });
  });
};

export const closeWhenShellAsks = (app: INestApplication): void => {
  const port = shellPort();
  if (!port) return;

  port.on("message", ({ data }) => {
    if (data.type === "shutdown") {
      void app.close().then(() => process.exit(0));
    }
  });
};
