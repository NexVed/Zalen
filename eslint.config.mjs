import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Build-time config (CommonJS by necessity).
    "babel.config.js",
    "postcss.config.js",
    // Convex codegen output.
    "convex/_generated/**",
    // Go service.
    "server/**",
    ".agents/**",
    ".claude/**",
    ".playwright-mcp/**",
    // Vendor worker copied unchanged by scripts/prepare-map-assets.mjs.
    "public/maps/maplibre-worker.mjs",
  ]),
]);

export default eslintConfig;
