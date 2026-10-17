"use client";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import * as stylex from "@stylexjs/stylex";
import { CalendarDays, Check, CircleHelp, Plus, X } from "lucide-react";
import { colors } from "@/styles/tokens.stylex";
import { useWorkspaceState } from "@/lib/use-workspace-state";
import { opportunities } from "@/lib/demo-data";
import { clerkConfigured } from "@/lib/auth-config";
import { isHubView, pageFor } from "@/lib/navigation";
import { Header, type View } from "./Header";
import { Overview } from "./Overview";
import { Opportunities } from "./Opportunities";
import { Community } from "./Community";
import { Workspace } from "./Workspace";
import { Sidebar } from "./Sidebar";
import { BusinessFinder } from "./BusinessFinder";
import { HubPage } from "./HubPage";

import { DashboardDialog, type Modal } from "./DashboardDialog";
import { ui } from "./ui";
import { Profile } from "./Profile";

const subscribeDate = () => () => {};
const readDate = () => new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Kolkata" });

export function Dashboard({ initialView = "Overview" }: { initialView?: View }) {
  return clerkConfigured ? <AccountDashboard initialView={initialView} /> : <DashboardContent userId={null} name="" initialView={initialView} />;
}

function AccountDashboard({ initialView }: { initialView: View }) {
  const { user, isLoaded } = useUser();
  return <DashboardContent key={user?.id ?? "guest"} userId={user?.id ?? null} name={user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress.split("@")[0] || ""} authLoading={!isLoaded} initialView={initialView} />;
}

function DashboardContent({ userId, name, authLoading = false, initialView }: { userId: string | null; name: string; authLoading?: boolean; initialView: View }) {
  const router = useRouter();
  const today = useSyncExternalStore(subscribeDate, readDate, () => "Today");
  const [state, update] = useWorkspaceState(userId, name);
  const view = initialView;
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [message, setMessage] = useState("");
  const items = useMemo(() => [...opportunities, ...state.customOpportunities], [state.customOpportunities]);
  useEffect(() => { if (!message) return; const timer = setTimeout(() => setMessage(""), 4500); return () => clearTimeout(timer); }, [message]);
  function navigate(next: View) { setSearch(""); setCity(""); router.push(pageFor(next).path); }
  const selectCity = useCallback((next: string) => { setCity(next); }, []);
  function openModal(next: Modal) { if (!userId && next && ["profile", "portfolio", "post", "apply"].includes(next.kind)) { router.push("/sign-up"); return; } setModal(next); }
  function save(id: string) { if (!userId) { router.push("/sign-up"); return; } const saved = state.saved.includes(id); update(s => ({ ...s, saved: saved ? s.saved.filter(v => v !== id) : [...s.saved, id] })); setMessage(saved ? "Removed from your saved opportunities." : "Opportunity saved."); }
  function done(text: string) { setModal(null); setMessage(text); }
  const market = ["Overview", "Bounties", "Gigs", "Opportunities"].includes(view);
  const visibleItems = view === "Bounties" ? items.filter(item => item.category === "Challenge") : view === "Gigs" ? items.filter(item => item.category === "Paid project") : items;
  return <>
    <Header view={view} onNavigate={navigate} search={search} onSearch={setSearch} onNotifications={() => openModal({ kind: "notifications" })} onProfile={() => openModal({ kind: "profile" })} name={state.profile.name} signedIn={Boolean(userId)} authLoading={authLoading} />
    <div {...stylex.props(s.shell)}>
      <main id="main" {...stylex.props(s.main)}>
        <div {...stylex.props(s.pageHeading)}><div><div {...stylex.props(s.breadcrumb)}><span>Zalen</span><span>/</span><span {...stylex.props(s.breadcrumbActive)}>{view}</span><span {...stylex.props(s.demo)}>YOUR WORKSPACE</span></div><h1 {...stylex.props(s.title)}>{view === "Overview" ? <>{state.profile.name ? `Welcome, ${state.profile.name.split(" ")[0]}.` : "Welcome to Zalen."} </> : view}</h1><p {...stylex.props(s.subtitle)}>{pageFor(view).description}</p></div><div {...stylex.props(s.headingActions)}><span {...stylex.props(s.date)}><CalendarDays size={13} />{today}</span>{market && <button {...stylex.props(ui.secondary, s.createButton)} onClick={() => openModal({ kind: "post" })}><Plus size={15} />{view === "Bounties" ? "Post a bounty" : view === "Gigs" ? "Post a gig" : "Post an opportunity"}</button>}</div></div>
        {view === "Overview" && <Overview state={state} total={items.length} onExplore={() => navigate("Bounties")} onProfile={() => openModal({ kind: "profile" })} onWorkspace={() => navigate("My workspace")} />}
        {market && <div {...stylex.props(s.stack)}><Opportunities key={view} items={visibleItems} state={state} onSave={save} onApply={item => openModal({ kind: "apply", item })} search={search} onSearch={setSearch} city={city} onCity={setCity} expanded={view !== "Overview"} heading={view === "Bounties" ? "Startup bounties & challenges" : view === "Gigs" ? "Freelance gigs & paid projects" : "Explore opportunities"} />{view === "Overview" && <Community joined={state.joined} onEvent={id => openModal({ kind: "event", id })} onViewAll={() => navigate("Events")} />}</div>}
        {view === "My workspace" && <Workspace state={state} items={items} onApplication={item => openModal({ kind: "apply", item })} onAddProject={() => openModal({ kind: "portfolio" })} onExplore={() => navigate("Bounties")} />}
        {(view === "Community" || view === "Events") && <Community joined={state.joined} onEvent={id => openModal({ kind: "event", id })} onViewAll={() => openModal({ kind: "about" })} search={search} onSearch={setSearch} city={city} onCity={setCity} expanded />}
        {view === "Freelancers" && <BusinessFinder userId={userId} search={search} onSearch={setSearch} />}
        {isHubView(view) && view !== "Freelancers" && <HubPage key={view} view={view} userId={userId} name={state.profile.name} search={search} onSearch={setSearch} />}
        {view === "Profile" && <Profile userId={userId} />}
        <footer {...stylex.props(s.footer)}><span {...stylex.props(ui.row)}><span {...stylex.props(s.footerBrand)}>zalen</span><span {...stylex.props(s.footerDivider)} />Projects · Talent · Community</span><div {...stylex.props(ui.row, s.footerRight)}><span>{view === "Freelancers" ? "OpenStreetMap business data · Pitches saved on this device." : "Sample listings · Your activity stays on this device."}</span><button {...stylex.props(ui.textButton)} onClick={() => openModal({ kind: "about" })}><CircleHelp size={13} />About this workspace</button></div>        </footer>
      </main>
      {!isHubView(view) && view !== "My workspace" && <Sidebar view={view} items={visibleItems} city={city} onCity={selectCity} state={state} />}
    </div>
    <DashboardDialog modal={modal} onClose={() => setModal(null)} state={state} update={update} onDone={done} signedIn={!!userId} onSignIn={() => router.push("/sign-in")} postingType={view === "Gigs" ? "Paid project" : view === "Bounties" ? "Challenge" : undefined} onWorkspace={() => { setModal(null); navigate("My workspace"); }} />
    <div role="status" aria-live="polite" {...stylex.props(s.toastRegion)}>{message && <div {...stylex.props(s.toast)}><span {...stylex.props(s.toastCheck)}><Check size={14} /></span>{message}<button aria-label="Dismiss notification" {...stylex.props(s.toastClose)} onClick={() => setMessage("")}><X size={15} /></button></div>}</div>
  </>;
}
const s = stylex.create({
  shell: { maxWidth: 1540, marginInline: "auto", padding: { default: "28px 36px 0", "@media (max-width: 700px)": "22px 18px 0" }, display: "flex", flexDirection: { default: "row", "@media (max-width: 1100px)": "column" }, alignItems: "flex-start", gap: 28 },
  main: { flex: 1, minWidth: 0 },
  pageHeading: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, marginBottom: 28, flexWrap: "wrap" },
  breadcrumb: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, color: colors.muted, fontSize: 9, marginBottom: 14 },
  breadcrumbActive: { color: colors.body },
  demo: { fontSize: 7, letterSpacing: "0.8px", backgroundColor: colors.elevated, color: colors.muted, border: "1px solid", borderColor: colors.border, padding: "3px 6px", borderRadius: 4, marginLeft: 4 },
  title: { fontFamily: "var(--font-display)", fontSize: { default: 29, "@media (max-width: 700px)": 26 }, lineHeight: 1.3, fontWeight: 500, letterSpacing: "-1px" },
  greetingStar: { color: colors.warm, fontSize: 28, display: "inline-block", marginLeft: 5 },
  subtitle: { fontSize: { default: 11, "@media (max-width: 700px)": 13 }, color: colors.muted, lineHeight: 1.8, marginTop: 6 },
  headingActions: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 18, paddingTop: { default: 20, "@media (max-width: 700px)": 0 } },
  date: { display: { default: "flex", "@media (max-width: 1000px)": "none" }, alignItems: "center", gap: 7, color: colors.muted, fontSize: 10 },
  createButton: { minHeight: 44, fontSize: 10, backgroundColor: colors.elevated, borderColor: colors.border },
  stack: { display: "flex", flexDirection: "column", gap: 28, minWidth: 0 },
  marketIntro: { marginBottom: 28 },
  footer: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, color: colors.muted, fontSize: 9, borderTop: "1px solid", borderColor: colors.subtleBorder, marginTop: 34, padding: "18px 0", flexWrap: "wrap" },
  footerBrand: { fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: colors.body, letterSpacing: "-1px" },
  brandDot: { color: colors.primary, fontSize: 11, marginLeft: 3 },
  footerDivider: { height: 14, width: 1, backgroundColor: colors.border, marginInline: 8 },
  footerRight: { gap: 20, flexWrap: "wrap", fontSize: 9 },
  toastRegion: { position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 60, maxWidth: "calc(100% - 32px)" },
  toast: { display: "flex", alignItems: "center", gap: 10, padding: "12px 15px", borderRadius: 12, backgroundColor: colors.elevated, color: colors.foreground, border: "1px solid", borderColor: colors.border, boxShadow: "var(--shadow)", fontSize: 12 },
  toastCheck: { display: "flex", color: colors.green },
  toastClose: { display: "flex", alignItems: "center", justifyContent: "center", padding: 5, color: colors.muted, backgroundColor: "transparent" },
});
