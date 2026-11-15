import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const [resultsDir, outFile] = process.argv.slice(2);

const files = (await readdir(resultsDir, { recursive: true })).filter((file) => file.endsWith(".json"));
const results = await Promise.all(
  files.map(async (file) => JSON.parse((await readFile(join(resultsDir, file), "utf8")).replace(/^﻿/, ""))),
);
results.sort((left, right) => left.shell.localeCompare(right.shell));

const row = (label, value) => `| ${label} | ${results.map(value).join(" | ")} |`;
const breakdown = (result) =>
  result.idleMemory.byProcess.map((entry) => `${entry.name} ×${entry.count}: ${entry.privateMB} MB`).join("<br>");

const lines = [
  "## Desktop shell comparison (Windows)",
  "",
  `| Metric | ${results.map((result) => result.shell).join(" | ")} |`,
  `| --- | ${results.map(() => "---").join(" | ")} |`,
  row("Installer download", (result) => `${result.installerMB} MB`),
  row("Installed on disk", (result) => `${result.installedMB} MB`),
  row("First launch to window ready", (result) => `${result.firstLaunchReadyMs} ms`),
  row("Warm launch to window ready (median)", (result) => `${result.warmReadyMedianMs} ms`),
  row("Idle RAM, private bytes", (result) => `${result.idleMemory.privateMB} MB`),
  row("Idle RAM, working set", (result) => `${result.idleMemory.workingSetMB} MB`),
  row("Processes", (result) => result.idleMemory.processCount),
  row("Private RAM by process", breakdown),
  row("Close time (median)", (result) => {
    const sorted = result.runs.map((run) => run.closeMs).sort((left, right) => left - right);
    return `${sorted[Math.floor(sorted.length / 2)]} ms`;
  }),
  row("Processes left after closing", (result) => result.runs.reduce((sum, run) => sum + run.leftoverProcesses, 0)),
  "",
  `Runner: ${results[0]?.runner ?? "unknown"}. Each shell ran on its own fresh runner; RAM sampled after 20 s idle on the last launch.`,
];

await writeFile(outFile, `${lines.join("\n")}\n`);
console.log(lines.join("\n"));
