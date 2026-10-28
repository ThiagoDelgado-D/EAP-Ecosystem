import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const repoRoot = join(import.meta.dirname, "..", "..", "..");
const apiDist = join(repoRoot, "apps", "api", "dist", "apps", "api", "src");
const buildDir = join(import.meta.dirname, "..", "build");
const outDir = join(buildDir, "api");
const webDist = join(repoRoot, "apps", "web", "dist", "web", "browser");
const nativeDriver = "better-sqlite3-multiple-ciphers";
const platform = process.argv[2] ?? `${process.platform}-${process.arch}`;

const unusedNestPeers = [
  "@nestjs/microservices",
  "@nestjs/microservices/microservices-module",
  "@nestjs/websockets/socket-module",
  "@fastify/static",
  "class-transformer/storage",
];

await rm(buildDir, { recursive: true, force: true });

await build({
  entryPoints: [join(apiDist, "main.js")],
  outfile: join(outDir, "server", "main.mjs"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  external: [nativeDriver, ...unusedNestPeers],
  // The root tsconfig maps workspace packages to their TypeScript sources; esbuild
  // would recompile those without decorator metadata, so resolve the built dist/ instead.
  tsconfigRaw: {},
  // CommonJS dependencies inside an ESM bundle still call require() and read __dirname.
  banner: {
    js: [
      'import { createRequire } from "node:module";',
      'import { dirname as __bundleDirname } from "node:path";',
      'import { fileURLToPath as __bundleFileUrlToPath } from "node:url";',
      "const require = createRequire(import.meta.url);",
      "const __filename = __bundleFileUrlToPath(import.meta.url);",
      "const __dirname = __bundleDirname(__filename);",
    ].join(" "),
  },
  logLevel: "warning",
});

await cp(join(apiDist, "emails"), join(outDir, "emails"), { recursive: true });

const driverSource = join(repoRoot, "node_modules", nativeDriver);
const driverTarget = join(outDir, "server", "node_modules", nativeDriver);
await mkdir(join(driverTarget, "prebuilds"), { recursive: true });
await cp(join(driverSource, "lib"), join(driverTarget, "lib"), { recursive: true });
await cp(join(driverSource, "package.json"), join(driverTarget, "package.json"));
await cp(
  join(driverSource, "prebuilds", `${platform}.node`),
  join(driverTarget, "prebuilds", `${platform}.node`),
);

await cp(webDist, join(buildDir, "web"), { recursive: true });
