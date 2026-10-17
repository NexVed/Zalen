"use client";
import { useState } from "react";
import Image from "next/image";
import * as stylex from "@stylexjs/stylex";
import { Bell, Search, Sun, Moon, Menu, X, ChevronDown, Command, Compass, LayoutGrid, BriefcaseBusiness, Users } from "lucide-react";
import { colors } from "@/styles/tokens.stylex";
import { useTheme } from "@/components/ThemeProvider";
import { ui } from "./ui";

export type View = "Overview" | "Opportunities" | "My workspace" | "Community";
const links = [{ name: "Overview", icon: LayoutGrid }, { name: "Opportunities", icon: Compass }, { name: "My workspace", icon: BriefcaseBusiness }, { name: "Community", icon: Users }] as const;

export function Header({ view, onNavigate, search, onSearch, onNotifications, onProfile, name }: {
  view: View; onNavigate: (view: View) => void; search: string; onSearch: (value: string) => void;
  onNotifications: () => void; onProfile: () => void; name: string;
}) {
  const [menu, setMenu] = useState(false);
  const { theme, toggleTheme } = useTheme();
  return <header {...stylex.props(s.header)}>
    <div {...stylex.props(s.inner)}>
      <button aria-label="Zalen home" {...stylex.props(s.brand)} onClick={() => onNavigate("Overview")}>
        <Image src="/brand/zalen-wordmark.png" alt="Zalen" width={112} height={38} preload {...stylex.props(s.wordmark)} />
      </button>
      <div {...stylex.props(s.separator)} />
      <nav aria-label="Main navigation" {...stylex.props(s.nav, menu && s.navOpen)} id="main-navigation">
        {links.map(({ name, icon: Icon }) => <button key={name} onClick={() => { onNavigate(name); setMenu(false); }} aria-current={view === name ? "page" : undefined} {...stylex.props(s.navItem, view === name && s.navActive)}><Icon size={15} />{name}</button>)}
      </nav>
      <div {...stylex.props(s.actions)}>
        <label {...stylex.props(s.search)}><Search size={15} /><input aria-label="Search opportunities" placeholder="Search anything..." value={search} onChange={e => onSearch(e.target.value)} {...stylex.props(s.searchInput)} /><Command size={12} /></label>
        <button {...stylex.props(ui.iconButton)} onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}><Sun className="theme-sun" size={17} /><Moon className="theme-moon" size={17} /></button>
        <button {...stylex.props(ui.iconButton)} aria-label="View notifications" onClick={onNotifications}><Bell size={17} /><span {...stylex.props(s.notificationDot)} /></button>
        <button {...stylex.props(s.profile)} aria-label="Edit your profile" onClick={onProfile}><span {...stylex.props(ui.avatar)}>{name.split(" ").map(n => n[0]).slice(0, 2).join("")}</span><ChevronDown size={13} /></button>
        <button {...stylex.props(ui.iconButton, s.menu)} onClick={() => setMenu(!menu)} aria-label={menu ? "Close navigation" : "Open navigation"} aria-expanded={menu} aria-controls="main-navigation">{menu ? <X size={18} /> : <Menu size={18} />}</button>
      </div>
    </div>
  </header>;
}
const s = stylex.create({
  header: { position: "sticky", top: 0, zIndex: 20, backgroundColor: "color-mix(in srgb, var(--bg-main), transparent 6%)", backdropFilter: "blur(18px)", borderBottom: "1px solid", borderColor: colors.subtleBorder },
  inner: { maxWidth: 1540, marginInline: "auto", padding: { default: "0 36px", "@media (max-width: 700px)": "0 18px" }, minHeight: 80, display: "flex", alignItems: "center", gap: 24 },
  brand: { backgroundColor: "transparent", display: "flex", alignItems: "center", flexShrink: 0, padding: 0 },
  wordmark: { width: 104, height: "auto", objectFit: "contain" },
  separator: { width: 1, height: 26, backgroundColor: colors.border, display: { default: "block", "@media (max-width: 1100px)": "none" } },
  nav: { display: { default: "flex", "@media (max-width: 1100px)": "none" }, alignItems: "center", gap: 4, backgroundColor: colors.secondary, padding: 5, borderRadius: 30 },
  navOpen: { display: "flex", position: "absolute", top: 72, left: 16, right: 16, padding: 12, flexDirection: "column", alignItems: "stretch", backgroundColor: colors.card, border: "1px solid", borderColor: colors.border, borderRadius: 16, boxShadow: "var(--shadow)" },
  navItem: { display: "flex", alignItems: "center", gap: 7, padding: "10px 15px", minHeight: 38, fontSize: 11, fontWeight: 500, color: { default: colors.muted, ":hover": colors.foreground }, backgroundColor: "transparent", borderRadius: 30, whiteSpace: "nowrap" },
  navActive: { backgroundColor: colors.softPink, color: colors.primary },
  actions: { marginLeft: "auto", display: "flex", alignItems: "center", gap: { default: 12, "@media (max-width: 700px)": 8 } },
  search: { display: { default: "flex", "@media (max-width: 1350px)": "none" }, alignItems: "center", gap: 9, color: colors.muted, width: 190 },
  searchInput: { minWidth: 0, width: "100%", backgroundColor: "transparent", border: 0, color: colors.foreground, fontSize: 11, paddingBlock: 10 },
  notificationDot: { position: "absolute", top: 8, right: 10, width: 5, height: 5, backgroundColor: colors.primary, borderRadius: "50%", border: "1px solid", borderColor: colors.card },
  profile: { backgroundColor: "transparent", color: colors.muted, display: "flex", gap: 8, alignItems: "center", padding: 0 },
  menu: { display: { default: "none", "@media (max-width: 1100px)": "inline-flex" } },
});
