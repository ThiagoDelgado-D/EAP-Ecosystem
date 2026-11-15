import { execFileSync } from "node:child_process";
import { copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const targetTriple = execFileSync("rustc", ["--print", "host-tuple"], { encoding: "utf8" }).trim();
const extension = process.platform === "win32" ? ".exe" : "";
const binariesDir = join(import.meta.dirname, "..", "tauri", "src-tauri", "binaries");

await mkdir(binariesDir, { recursive: true });
await copyFile(process.execPath, join(binariesDir, `node-${targetTriple}${extension}`));
