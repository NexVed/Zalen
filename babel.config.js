const path = require("path");

const dev = process.env.NODE_ENV !== "production";

module.exports = {
  // Preserve async Server Actions and Unicode regexes for Next.js-supported browsers.
  presets: [["next/babel", { "preset-env": { targets: { chrome: "111", edge: "111", firefox: "111", safari: "16.4" } } }]],
  plugins: [
    [
      "@stylexjs/babel-plugin",
      {
        dev,
        runtimeInjection: false,
        enableInlinedConditionalMerge: true,
        treeshakeCompensation: true,
        aliases: { "@/*": [path.join(__dirname, "*")] },
        unstable_moduleResolution: { type: "commonJS" },
      },
    ],
  ],
};
