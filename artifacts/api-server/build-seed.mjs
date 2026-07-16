import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";

globalThis.require = createRequire(import.meta.url);
const artifactDir = path.dirname(fileURLToPath(import.meta.url));

await esbuild({
  entryPoints: [path.resolve(artifactDir, "src/seed.ts")],
  platform: "node",
  bundle: true,
  format: "esm",
  outdir: path.resolve(artifactDir, "dist"),
  outExtension: { ".js": ".mjs" },
  external: ["*.node", "pg-native"],
  banner: {
    js: `import { createRequire as __cr } from 'node:module';
import __bPath from 'node:path';
import __bUrl from 'node:url';
globalThis.require = __cr(import.meta.url);
globalThis.__filename = __bUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bPath.dirname(globalThis.__filename);
`,
  },
});

console.log("✅ Seed script built");
