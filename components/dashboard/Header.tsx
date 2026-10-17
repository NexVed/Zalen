"use client";
import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import * as stylex from "@stylexjs/stylex";
import { Bell, Search, Sun, Moon, ChevronDown, Command, Trophy, LayoutGrid, BriefcaseBusiness, Users, MessageCircle, Landmark, Handshake, Zap, CalendarDays, Menu, X } from "lucide-react";
import { navigation, type View } from "@/lib/navigation";
import { colors } from "@/styles/tokens.stylex";
import { useTheme } from "@/components/ThemeProvider";
import { ui } from "./ui";
import styles from "./Header.module.css";

export type { View } from "@/lib/navigation";
const icons = { Overview: LayoutGrid, Bounties: Trophy, Freelancers: Users, Forum: MessageCircle, Investors: Landmark, B2B: Handshake, Gigs: Zap, Events: CalendarDays, "My workspace": BriefcaseBusiness };

export function Header({ view, onNavigate, search, onSearch, onNotifications, onProfile, name, signedIn, authLoading }: {
  view: View; onNavigate: (view: View) => void; search: string; onSearch: (value: string) => void;
  onNotifications: () => void; onProfile: () => void; name: string; signedIn: boolean; authLoading: boolean;
}) {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1201px)");
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
  return <header {...stylex.props(s.header)}>
    <div {...stylex.props(s.inner)}>
      <button aria-label="Zalen home" {...stylex.props(s.brand)} onClick={() => onNavigate("Overview")}>
        <Image src="/brand/zalen-wordmark.png" alt="Zalen" width={112} height={38} preload {...stylex.props(s.wordmark)} />
      </button>
      <div {...stylex.props(s.separator)} />
      <nav aria-label="Main navigation" {...stylex.props(s.nav)} id="main-navigation">
        {navigation.map(({ name, path }) => { const Icon = icons[name]; return <Link key={name} href={path} aria-current={view === name ? "page" : undefined} {...stylex.props(s.navItem, view === name && s.navActive)}><Icon size={14} />{name === "My workspace" ? "Workspace" : name}</Link>; })}
      </nav>
      <div {...stylex.props(s.actions)}>
        <label {...stylex.props(s.search)}><Search size={15} /><input aria-label="Search this page" placeholder="Search this page..." value={search} onChange={e => onSearch(e.target.value)} {...stylex.props(s.searchInput)} /><Command size={12} /></label>
        <button {...stylex.props(ui.iconButton)} onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}><Sun className="theme-sun" size={17} /><Moon className="theme-moon" size={17} /></button>
        <span className={styles.desktopAction}><button {...stylex.props(ui.iconButton)} aria-label="View notifications" onClick={onNotifications}><Bell size={17} /></button></span>
        {authLoading ? <span className={styles.accountLoading} role="status">Loading account…</span> : signedIn ? <><span className={styles.desktopAction}><button {...stylex.props(s.profile)} aria-label={`Edit ${name || "your"} workspace profile`} onClick={onProfile}><span {...stylex.props(s.profileLabel)}>My profile</span><ChevronDown size={13} /></button></span><UserButton /></> : <Link href="/sign-up" {...stylex.props(ui.primary, s.signup)}>Get started <ChevronDown size={12} /></Link>}
        <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <Dialog.Trigger className={styles.menuTrigger} aria-label="Open navigation menu" aria-expanded={menuOpen}><Menu size={22} /></Dialog.Trigger>
          <Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.drawer} onOpenAutoFocus={event => { event.preventDefault(); document.getElementById("close-navigation")?.focus(); }}>
            <div className={styles.drawerHeading}><div><Dialog.Title className={styles.drawerTitle}>Navigation</Dialog.Title><Dialog.Description className={styles.drawerDescription}>Browse Zalen</Dialog.Description></div><Dialog.Close id="close-navigation" className={styles.close} aria-label="Close navigation menu"><X size={22} /></Dialog.Close></div>
            <nav className={styles.mobileNav} aria-label="Mobile navigation">{navigation.map(({ name, path }) => { const Icon = icons[name]; return <Link key={name} href={path} onClick={() => setMenuOpen(false)} aria-current={view === name ? "page" : undefined} className={styles.mobileLink}><Icon size={18} />{name === "My workspace" ? "Workspace" : name}</Link>; })}</nav>
            <div className={styles.menuActions}><button onClick={() => { setMenuOpen(false); onNotifications(); }}><Bell size={18} />Notifications</button>{signedIn ? <button onClick={() => { setMenuOpen(false); onProfile(); }}><Users size={18} />My profile</button> : <Link href="/sign-in" onClick={() => setMenuOpen(false)}>Sign in</Link>}</div>
          </Dialog.Content></Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  </header>;
}
const s = stylex.create({
  header: { position: "sticky", top: 0, zIndex: 20, backgroundColor: "color-mix(in srgb, var(--bg-main), transparent 6%)", backdropFilter: "blur(18px)", borderBottom: "1px solid", borderColor: colors.subtleBorder },
  inner: { maxWidth: 1540, marginInline: "auto", padding: { default: "0 28px", "@media (max-width: 700px)": "0 16px" }, minHeight: { default: 80, "@media (max-width: 1200px)": 68 }, display: "grid", gridTemplateColumns: "auto minmax(0,1fr) auto", alignItems: "center", columnGap: { default: 20, "@media (max-width: 700px)": 8 }, rowGap: 4, paddingBlock: { default: 12, "@media (max-width: 1200px)": 10 } },
  brand: { backgroundColor: "transparent", display: "flex", alignItems: "center", flexShrink: 0, padding: 0 },
  wordmark: { width: { default: 104, "@media (max-width: 700px)": 80 }, height: "auto", objectFit: "contain" },
  separator: { display: "none" },
  nav: { display: { default: "flex", "@media (max-width: 1200px)": "none" }, alignItems: "center", gap: 2, backgroundColor: colors.secondary, padding: 4, borderRadius: 24, width: "fit-content", maxWidth: "100%", justifySelf: "start", minWidth: 0, overflowX: "auto", scrollbarWidth: "thin" },
  navItem: { display: "flex", alignItems: "center", gap: 6, padding: "10px 11px", minHeight: 38, fontSize: 11, fontWeight: 500, color: { default: colors.muted, ":hover": colors.foreground }, backgroundColor: "transparent", borderRadius: 24, whiteSpace: "nowrap", flexShrink: 0 },
  navActive: { backgroundColor: "var(--nav-active-bg)", color: "var(--nav-active-text)", fontWeight: 600 },
  actions: { marginLeft: "auto", display: "flex", alignItems: "center", gridColumn: 3, gridRow: 1, gap: { default: 10, "@media (max-width: 700px)": 6 } },
  search: { display: { default: "flex", "@media (max-width: 1750px)": "none" }, alignItems: "center", gap: 9, color: colors.muted, width: 150 },
  searchInput: { minWidth: 0, width: "100%", backgroundColor: "transparent", border: 0, color: colors.foreground, fontSize: 11, paddingBlock: 10 },
  notificationDot: { position: "absolute", top: 8, right: 10, width: 5, height: 5, backgroundColor: colors.primary, borderRadius: "50%", border: "1px solid", borderColor: colors.card },
  profile: { backgroundColor: "transparent", color: colors.muted, display: "flex", gap: 8, alignItems: "center", padding: 0 },
  profileLabel: { fontSize: 11, display: { default: "inline", "@media (max-width: 700px)": "none" } },
  signup: { fontSize: { default: 11, "@media (max-width: 700px)": 10 }, minHeight: 36, padding: { default: "8px 12px", "@media (max-width: 700px)": "8px" } },
});
