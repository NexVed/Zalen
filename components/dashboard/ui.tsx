import * as stylex from "@stylexjs/stylex";
import { ArrowUpRight, Layers, Orbit, Sprout, Triangle, Box } from "lucide-react";
import { colors } from "@/styles/tokens.stylex";
import type { Opportunity } from "@/lib/demo-data";

export const ui = stylex.create({
  row: { display: "flex", alignItems: "center", gap: 8 },
  between: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  column: { display: "flex", flexDirection: "column", gap: 8 },
  wrap: { flexWrap: "wrap" },
  muted: { color: colors.muted },
  body: { color: colors.body, lineHeight: 1.7 },
  small: { fontSize: 12 },
  caption: { fontSize: 11, color: colors.muted },
  heading: { fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, letterSpacing: "-0.5px" },
  card: { backgroundColor: colors.card, border: "1px solid", borderColor: colors.subtleBorder, borderRadius: 18, boxShadow: "var(--shadow)", minWidth: 0 },
  primary: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 44, padding: "10px 18px", backgroundColor: { default: colors.primary, ":hover": colors.primaryHover }, color: colors.primaryForeground, borderRadius: 11, fontSize: 12, fontWeight: 600, transition: "background-color 160ms, box-shadow 160ms", boxShadow: { default: "none", ":hover": "0 4px 22px color-mix(in srgb, var(--accent-primary), transparent 75%)" } },
  secondary: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 44, padding: "9px 15px", backgroundColor: { default: colors.card, ":hover": colors.elevated }, color: colors.body, border: "1px solid", borderColor: colors.border, borderRadius: 11, fontSize: 12, fontWeight: 500 },
  textButton: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "transparent", color: { default: colors.body, ":hover": colors.primary }, fontSize: 11, fontWeight: 500, padding: "8px 0" },
  iconButton: { position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: "50%", backgroundColor: { default: colors.elevated, ":hover": colors.softPink }, color: { default: colors.body, ":hover": colors.primary }, flexShrink: 0 },
  pill: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, padding: "4px 8px", fontWeight: 500, borderRadius: 6, backgroundColor: colors.elevated, color: colors.body, whiteSpace: "nowrap" },
  pink: { color: colors.primary, backgroundColor: colors.softPink },
  green: { color: colors.green, backgroundColor: colors.softGreen },
  purple: { color: colors.purple, backgroundColor: colors.softPurple },
  blue: { color: colors.blue, backgroundColor: colors.softBlue },
  orange: { color: colors.warm, backgroundColor: colors.softOrange },
  input: { width: "100%", minHeight: 44, border: "1px solid", borderColor: colors.border, borderRadius: 10, backgroundColor: colors.secondary, color: colors.foreground, padding: "10px 12px", fontSize: { default: 13, "@media (max-width: 700px)": 16 } },
  label: { display: "flex", flexDirection: "column", gap: 8, fontSize: 12, fontWeight: 500, color: colors.body },
  full: { width: "100%" },
  empty: { display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, padding: "48px 24px", color: colors.muted, textAlign: "center", minHeight: 200 },
  logo: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 11, flexShrink: 0 },
  logoSmall: { width: 34, height: 34, borderRadius: 10 },
  avatar: { width: 34, height: 34, display: "inline-flex", justifyContent: "center", alignItems: "center", borderRadius: "50%", background: "linear-gradient(140deg, var(--surface-pink), var(--surface-orange))", color: colors.primary, fontSize: 11, fontWeight: 700, border: "2px solid", borderColor: colors.card, flexShrink: 0 },
  divider: { border: 0, borderTop: "1px solid", borderColor: colors.subtleBorder, margin: "18px 0" },
});
const logos = { pink: Orbit, purple: Layers, green: Sprout, blue: Box, orange: Triangle };
export function CompanyLogo({ tone, small = false }: { tone: Opportunity["tone"]; small?: boolean }) {
  const Icon = logos[tone] ?? Box;
  return <span {...stylex.props(ui.logo, ui[tone], small && ui.logoSmall)}><Icon size={small ? 18 : 22} strokeWidth={1.6} /></span>;
}
export function TextLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button {...stylex.props(ui.textButton)} onClick={onClick}>{children}<ArrowUpRight size={13} /></button>;
}
