"use client";
import { useEffect, useMemo, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { ArrowUpRight, CalendarDays, Check, CircleHelp, Plus, Sparkles, X } from "lucide-react";
import { colors } from "@/styles/tokens.stylex";
import { useDemoState } from "@/lib/use-demo-state";
import { opportunities } from "@/lib/demo-data";
import { Header, type View } from "./Header";
import { Overview } from "./Overview";
import { Opportunities } from "./Opportunities";
import { OpportunityMap } from "./OpportunityMap";
import { Community, Momentum } from "./Community";
import { Workspace } from "./Workspace";
import { DashboardDialog, type Modal } from "./DashboardDialog";
import { ui } from "./ui";

export function Dashboard() {
  const [state, update] = useDemoState();
  const [view, setView] = useState<View>("Overview");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [message, setMessage] = useState("");
  const items = useMemo(() => [...opportunities, ...state.customOpportunities], [state.customOpportunities]);
  useEffect(() => { if (!message) return; const timer = setTimeout(() => setMessage(""), 4500); return () => clearTimeout(timer); }, [message]);
  function navigate(next: View) { setView(next); setSearch(""); setCity(""); }
  function save(id: string) { const saved = state.saved.includes(id); update(s => ({ ...s, saved: saved ? s.saved.filter(v => v !== id) : [...s.saved, id] })); setMessage(saved ? "Removed from your saved opportunities." : "Saved for your next chapter."); }
  function done(text: string) { setModal(null); setMessage(text); }
  const intro = { Overview: "A little progress today. A world of possibilities tomorrow.", Opportunities: "Find meaningful work that sees your potential.", "My workspace": "A home for your progress, your projects, and your next big thing.", Community: "Good things happen when curious people come together." };
  return <>
    <Header view={view} onNavigate={navigate} search={search} onSearch={value => { setSearch(value); setView("Opportunities"); }} onNotifications={() => setModal({ kind: "notifications" })} onProfile={() => setModal({ kind: "profile" })} name={state.profile.name} />
    <main id="main" {...stylex.props(s.main)}>
      <div {...stylex.props(s.pageHeading)}><div><div {...stylex.props(s.breadcrumb)}><span>Zalen</span><span>/</span><span {...stylex.props(s.breadcrumbActive)}>{view}</span><span {...stylex.props(s.demo)}>DEMO WORKSPACE</span></div><h1 {...stylex.props(s.title)}>{view === "Overview" ? <>Welcome back, {state.profile.name.split(" ")[0]}. <span {...stylex.props(s.greetingStar)}>✳</span></> : view}</h1><p {...stylex.props(s.subtitle)}>{intro[view]}</p></div><div {...stylex.props(s.headingActions)}><span {...stylex.props(s.date)}><CalendarDays size={13} />October 17, 2026</span><button {...stylex.props(ui.secondary, s.createButton)} onClick={() => setModal({ kind: "post" })}><Plus size={15} />Post an opportunity</button></div></div>
      {view === "Overview" && <Overview state={state} total={items.length} onExplore={() => navigate("Opportunities")} onProfile={() => setModal({ kind: "profile" })} onWorkspace={() => navigate("My workspace")} />}
      {(view === "Overview" || view === "Opportunities") && <div {...stylex.props(s.contentGrid)}><div {...stylex.props(s.leftColumn)}><Opportunities items={items} state={state} onSave={save} onApply={item => setModal({ kind: "apply", item })} search={search} onSearch={setSearch} city={city} onCity={setCity} expanded={view === "Opportunities"} />{view === "Overview" && <Community joined={state.joined} onEvent={id => setModal({ kind: "event", id })} onViewAll={() => navigate("Community")} />}</div><aside {...stylex.props(s.aside)}><div {...stylex.props(s.asideHeading)}><span {...stylex.props(s.asideEyebrow)}><Sparkles size={12} /> THINK BEYOND YOUR PIN CODE</span><span {...stylex.props(ui.caption)}>Explore <ArrowUpRight size={11} /></span></div><OpportunityMap items={items} city={city} onCity={setCity} /><Momentum onWorkspace={() => navigate("My workspace")} /><div {...stylex.props(s.quote)}><span {...stylex.props(s.quoteMark)}>“</span><p>You don&apos;t need to have it all figured out.<br />You just need a place to start.</p><span {...stylex.props(s.quoteAttribution)}>THAT&apos;S WHAT WE&apos;RE HERE FOR.</span></div></aside></div>}
      {view === "My workspace" && <Workspace state={state} items={items} onApplication={item => setModal({ kind: "apply", item })} onAddProject={() => setModal({ kind: "portfolio" })} onExplore={() => navigate("Opportunities")} />}
      {view === "Community" && <Community joined={state.joined} onEvent={id => setModal({ kind: "event", id })} onViewAll={() => setModal({ kind: "about" })} expanded />}
      <footer {...stylex.props(s.footer)}><span {...stylex.props(ui.row)}><span {...stylex.props(s.footerBrand)}>zalen<span {...stylex.props(s.brandDot)}>✦</span></span><span {...stylex.props(s.footerDivider)} />Made for what&apos;s next.</span><div {...stylex.props(ui.row, s.footerRight)}><span>Sample data · Your possibilities are real.</span><button {...stylex.props(ui.textButton)} onClick={() => setModal({ kind: "about" })}><CircleHelp size={13} />About this workspace</button></div></footer>
    </main>
    <DashboardDialog modal={modal} onClose={() => setModal(null)} state={state} update={update} onDone={done} onWorkspace={() => { setModal(null); navigate("My workspace"); }} />
    <div role="status" aria-live="polite" {...stylex.props(s.toastRegion)}>{message && <div {...stylex.props(s.toast)}><span {...stylex.props(s.toastCheck)}><Check size={14} /></span>{message}<button aria-label="Dismiss notification" {...stylex.props(s.toastClose)} onClick={() => setMessage("")}><X size={15} /></button></div>}</div>
  </>;
}
const s = stylex.create({
  main: { maxWidth: 1540, marginInline: "auto", padding: { default: "28px 36px 0", "@media (max-width: 700px)": "22px 18px 0" } },
  pageHeading: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, marginBottom: 28, flexWrap: "wrap" },
  breadcrumb: { display: "flex", alignItems: "center", gap: 10, color: colors.muted, fontSize: 9, marginBottom: 14 },
  breadcrumbActive: { color: colors.body },
  demo: { fontSize: 7, letterSpacing: "0.8px", backgroundColor: colors.elevated, color: colors.muted, border: "1px solid", borderColor: colors.border, padding: "3px 6px", borderRadius: 4, marginLeft: 4 },
  title: { fontFamily: "var(--font-display)", fontSize: { default: 29, "@media (max-width: 700px)": 26 }, lineHeight: 1.3, fontWeight: 500, letterSpacing: "-1px" },
  greetingStar: { color: colors.warm, fontSize: 28, display: "inline-block", marginLeft: 5 },
  subtitle: { fontSize: 11, color: colors.muted, lineHeight: 1.8, marginTop: 6 },
  headingActions: { display: "flex", alignItems: "center", gap: 18, paddingTop: 20 },
  date: { display: { default: "flex", "@media (max-width: 1000px)": "none" }, alignItems: "center", gap: 7, color: colors.muted, fontSize: 10 },
  createButton: { minHeight: 37, fontSize: 10, backgroundColor: colors.elevated, borderColor: colors.border },
  contentGrid: { display: "grid", gridTemplateColumns: { default: "minmax(0, 1.85fr) minmax(0, 1fr)", "@media (max-width: 1100px)": "1fr" }, gap: 24, alignItems: "start" },
  leftColumn: { display: "flex", flexDirection: "column", gap: 28, minWidth: 0 },
  aside: { minWidth: 0 },
  asideHeading: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, minHeight: 28, marginBottom: 18 },
  asideEyebrow: { display: "flex", alignItems: "center", gap: 6, fontSize: 8, letterSpacing: "1.3px", color: colors.muted },
  quote: { textAlign: "center", padding: "19px 14px 8px", color: colors.muted, fontFamily: "var(--font-display)", fontSize: 13, lineHeight: 1.8 },
  quoteMark: { color: colors.primary, fontSize: 30, lineHeight: 1.2 },
  quoteAttribution: { display: "block", fontFamily: "var(--font-inter)", fontSize: 7, letterSpacing: "1.5px", marginTop: 11 },
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
