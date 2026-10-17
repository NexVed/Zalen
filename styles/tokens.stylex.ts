import * as stylex from "@stylexjs/stylex";
export const colors = stylex.defineVars({
  background: "var(--bg-main)", secondary: "var(--bg-secondary)", card: "var(--bg-card)", elevated: "var(--bg-elevated)",
  foreground: "var(--text-primary)", body: "var(--text-secondary)", muted: "var(--text-muted)",
  primary: "var(--accent-primary)", primaryHover: "var(--accent-hover)", primaryForeground: "var(--on-accent)",
  pink: "var(--accent-secondary)", warm: "var(--accent-warm)", gold: "var(--accent-premium)",
  border: "var(--border)", subtleBorder: "var(--border-subtle)", softPink: "var(--surface-pink)", softOrange: "var(--surface-orange)",
  green: "var(--success)", softGreen: "var(--success-surface)", purple: "var(--purple)", softPurple: "var(--purple-surface)", blue: "var(--blue)", softBlue: "var(--blue-surface)",
});
export const radius = stylex.defineVars({ sm: "6px", md: "12px", lg: "18px", full: "9999px" });
export const space = stylex.defineVars({ xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "32px" });
