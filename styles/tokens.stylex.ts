import * as stylex from "@stylexjs/stylex";

export const colors = stylex.defineVars({
  background: "#ffffff",
  foreground: "#0a0a0a",
  muted: "#6b7280",
  primary: "#4f46e5",
  primaryHover: "#4338ca",
  primaryForeground: "#ffffff",
  border: "#e5e7eb",
});

export const radius = stylex.defineVars({
  sm: "6px",
  md: "10px",
  lg: "16px",
  full: "9999px",
});

export const space = stylex.defineVars({
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
});
