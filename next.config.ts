import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  webpack: config => {
    // MapLibre GL's worker (`maplibre-gl-worker.mjs`, pulled in via
    // `new URL(..., import.meta.url)`) must be emitted byte-for-byte as a
    // standalone module worker. Next's client-layer rules run Babel on all
    // `.mjs` files including node_modules, and Babel's transform-runtime
    // rewrites helper imports to absolute local filesystem paths — breaking
    // the worker at runtime ("Worker failed to load"). Exclude MapLibre's
    // dist from every Babel-loader rule; its shipped bundles are already
    // compiled and target modern browsers.
    const maplibre = /[\\/]node_modules[\\/]maplibre-gl[\\/]/;
    const usesBabel = (use: unknown): boolean => {
      const entries = typeof use === "function" ? [] : Array.isArray(use) ? use : use ? [use] : [];
      return entries.some(e => {
        const loader = typeof e === "string" ? e : (e as { loader?: string } | null)?.loader;
        return typeof loader === "string" && loader.includes("babel/loader");
      });
    };
    const excludeMaplibre = (rules: unknown[]) => {
      for (const rule of rules as Record<string, unknown>[]) {
        if (!rule || typeof rule !== "object") continue;
        if (Array.isArray(rule.rules)) excludeMaplibre(rule.rules);
        if (Array.isArray(rule.oneOf)) excludeMaplibre(rule.oneOf);
        if (!usesBabel(rule.use)) continue;
        rule.exclude = Array.isArray(rule.exclude) ? [...rule.exclude, maplibre] : rule.exclude ? [rule.exclude, maplibre] : maplibre;
      }
    };
    excludeMaplibre(config.module?.rules ?? []);
    return config;
  },
};

export default nextConfig;
