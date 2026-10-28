import { app, BrowserWindow, safeStorage, shell, utilityProcess } from "electron";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { join } from "node:path";

const resourcesDir = app.isPackaged
  ? process.resourcesPath
  : join(import.meta.dirname, "..", "build");
const apiEntry = join(resourcesDir, "api", "server", "main.mjs");
const webDist = join(resourcesDir, "web");
const secretsFile = join(app.getPath("userData"), "secrets.bin");

const freePort = () =>
  new Promise((resolve, reject) => {
    const probe = createServer();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });

const newSecrets = () => ({
  databaseKey: `x'${randomBytes(32).toString("hex")}'`,
  jwtSecret: randomBytes(32).toString("hex"),
  refreshTokenSecret: randomBytes(32).toString("hex"),
});

const loadSecrets = async () => {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("No OS keystore is available to protect the database key.");
  }
  if (existsSync(secretsFile)) {
    return JSON.parse(safeStorage.decryptString(await readFile(secretsFile)));
  }
  const secrets = newSecrets();
  await writeFile(secretsFile, safeStorage.encryptString(JSON.stringify(secrets)));
  return secrets;
};

const waitUntilServing = async (url) => {
  for (;;) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};

const startApi = (port, secrets) => {
  const api = utilityProcess.fork(apiEntry, [], {
    serviceName: "Cauce API",
    env: {
      NODE_ENV: "development",
      HOST: "127.0.0.1",
      PORT: String(port),
      DB_TYPE: "sqlite",
      DB_PATH: join(app.getPath("userData"), "cauce.db"),
      WEB_DIST: webDist,
      JWT_SECRET: secrets.jwtSecret,
      REFRESH_TOKEN_SECRET: secrets.refreshTokenSecret,
      SMTP_HOST: "127.0.0.1",
    },
  });
  api.on("message", (message) => {
    if (message.type === "database-key-request") {
      api.postMessage({ type: "database-key", databaseKey: secrets.databaseKey });
    }
  });
  return api;
};

const openWindow = (origin) => {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(origin)) event.preventDefault();
  });
  void window.loadURL(origin);
};

let api;

app.whenReady().then(async () => {
  const port = await freePort();
  const origin = `http://127.0.0.1:${port}`;
  api = startApi(port, await loadSecrets());
  await waitUntilServing(`${origin}/`);
  openWindow(origin);
});

app.on("window-all-closed", () => {
  if (!api) {
    app.quit();
    return;
  }
  api.once("exit", () => app.quit());
  api.postMessage({ type: "shutdown" });
});
