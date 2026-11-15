import type { INestApplication } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { createInterface } from "node:readline";

interface ShellData {
  type: string;
  databaseKey?: string;
}

interface ShellChannel {
  send(message: { type: string }): void;
  onMessage(listener: (data: ShellData) => void): void;
}

interface ParentPort {
  postMessage(message: { type: string }): void;
  on(event: "message", listener: (message: { data: ShellData }) => void): void;
}

const parentPortChannel = (port: ParentPort): ShellChannel => ({
  send: (message) => port.postMessage(message),
  onMessage: (listener) => port.on("message", ({ data }) => listener(data)),
});

const parseShellLine = (line: string): ShellData | undefined => {
  try {
    const data: unknown = JSON.parse(line);
    if (typeof data !== "object" || data === null || !("type" in data)) {
      return undefined;
    }
    return data as ShellData;
  } catch {
    return undefined;
  }
};

const stdioChannel = (): ShellChannel => {
  const lines = createInterface({ input: process.stdin });
  lines.on("close", () => process.exit(0));
  return {
    send: (message) => process.stdout.write(`${JSON.stringify(message)}\n`),
    onMessage: (listener) =>
      lines.on("line", (line) => {
        const data = parseShellLine(line);
        if (data) listener(data);
      }),
  };
};

// Inside the desktop app the API runs as a child of the app shell, which hands
// over the key through this channel so it never sits in the process environment.
// Electron talks over its parent port; other shells talk over stdin/stdout.
const openShellChannel = (): ShellChannel | undefined => {
  const port = (process as NodeJS.Process & { parentPort?: ParentPort })
    .parentPort;
  if (port) return parentPortChannel(port);
  if (process.env.DESKTOP_SHELL === "stdio") return stdioChannel();
  return undefined;
};

const shellChannel = openShellChannel();

export const resolveDatabaseKey = (
  configService: ConfigService,
): Promise<string> => {
  if (!shellChannel) {
    return Promise.resolve(configService.getOrThrow<string>("DB_KEY"));
  }

  return new Promise((resolve) => {
    shellChannel.onMessage((data) => {
      if (data.type === "database-key" && data.databaseKey) {
        resolve(data.databaseKey);
      }
    });
    shellChannel.send({ type: "database-key-request" });
  });
};

export const closeWhenShellAsks = (app: INestApplication): void => {
  if (!shellChannel) return;

  shellChannel.onMessage((data) => {
    if (data.type === "shutdown") {
      void app.close().then(() => process.exit(0));
    }
  });
};
