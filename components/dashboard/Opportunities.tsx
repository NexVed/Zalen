"use client";
import { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { ArrowRight, ArrowUpRight, Bookmark, Check, CheckCheck, ChevronDown, Clock3, Globe2, Search, SlidersHorizontal, Users, X } from "lucide-react";
import { colors } from "@/styles/tokens.stylex";
import { type Opportunity, type DemoState } from "@/lib/demo-data";
import { ui, CompanyLogo } from "./ui";

export function Opportunities({ items, state, onSave, onApply, search, onSearch, city, onCity, expanded = false, heading = "Explore opportunities" }: {
  items: Opportunity[]; state: DemoState; onSave: (id: string) => void; onApply: (item: Opportunity) => void;
  search: string; onSearch: (value: string) => void; city: string; onCity: (value: string) => void; expanded?: boolean; heading?: string;
}) {
  const [selectedId, setSelectedId] = useState("orbit");
  const [tab, setTab] = useState("For you");
  const [type, setType] = useState("All types");
  const [remote, setRemote] = useState(false);
  const [sort, setSort] = useState("match");
  const filtered = items.filter(o => (tab !== "Saved" || state.saved.includes(o.id)) && (type === "All types" || o.category === type) && (!remote || o.remote) && (!city || o.location === city) && (!search || `${o.title} ${o.company} ${o.skills.join(" ")} ${o.location}`.toLowerCase().includes(search.toLowerCase()))).sort((a, b) => sort === "match" ? b.match - a.match : a.company.localeCompare(b.company));
  const visible = expanded || search || city || type !== "All types" || tab === "Saved" || remote ? filtered : filtered.slice(0, 4);
  const selected = visible.find(o => o.id === selectedId) ?? visible[0];
  return <section id="opportunities" aria-labelledby="opportunity-title" {...stylex.props(s.section)}>
    <div {...stylex.props(ui.between, s.sectionHeading)}><div {...stylex.props(ui.row)}><h2 id="opportunity-title" {...stylex.props(ui.heading)}>{heading}</h2><span {...stylex.props(ui.pill, ui.pink)}>{filtered.length}</span></div><span {...stylex.props(ui.caption, s.matchCaption)}> Sample opportunities</span></div>
    <div {...stylex.props(s.controls)}>
      <div {...stylex.props(s.tabs)}>{["For you", "Saved"].map(value => <button key={value} onClick={() => setTab(value)} aria-pressed={tab === value} {...stylex.props(s.tab, tab === value && s.tabActive)}>{value === "Saved" && <Bookmark size={12} />}{value}{value === "Saved" && <span {...stylex.props(s.count)}>{state.saved.length}</span>}</button>)}</div>
      <div {...stylex.props(s.filters)}>
        <label {...stylex.props(s.selectWrap)}><select aria-label="Opportunity type" value={type} onChange={e => setType(e.target.value)} {...stylex.props(s.select)}><option>All types</option>{[...new Set(items.map(item => item.category))].map(category => <option key={category}>{category}</option>)}</select><ChevronDown size={12} /></label>
        <button {...stylex.props(s.filterButton, remote && s.filterActive)} aria-pressed={remote} onClick={() => setRemote(!remote)}><Globe2 size={12} />Remote</button>
        <label {...stylex.props(s.sort)} title="Sort opportunities"><SlidersHorizontal size={14} /><select aria-label="Sort opportunities" value={sort} onChange={e => setSort(e.target.value)} {...stylex.props(s.sortSelect)}><option value="match">Featured</option><option value="company">Company A–Z</option></select></label>
      </div>
    </div>
    {(expanded || search || city) && <div {...stylex.props(s.searchRow)}><label {...stylex.props(s.search)}><Search size={15} /><input {...stylex.props(s.searchInput)} aria-label="Filter opportunities" placeholder="Search by role, skill, or startup..." value={search} onChange={e => onSearch(e.target.value)} />{search && <button {...stylex.props(s.clear)} onClick={() => onSearch("")} aria-label="Clear search"><X size={14} /></button>}</label>{city && <button {...stylex.props(ui.pill, ui.pink)} onClick={() => onCity("")}>{city}<X size={12} /></button>}</div>}
    <div {...stylex.props(ui.card, s.board)}>
      <div {...stylex.props(s.list)}>
        <div {...stylex.props(ui.between, s.listHeading)}><span>{tab === "Saved" ? "Your shortlist" : "Available opportunities"}</span><span>{String(visible.length).padStart(2, "0")}</span></div>
        {visible.length ? visible.map(o => <button key={o.id} onClick={() => setSelectedId(o.id)} aria-pressed={selected?.id === o.id} {...stylex.props(s.item, selected?.id === o.id && s.itemSelected)}>
          <div {...stylex.props(ui.row, s.companyRow)}><CompanyLogo tone={o.tone} small /><div {...stylex.props(s.itemCompany)}><span>{o.company}<CheckCheck size={12} {...stylex.props(ui.muted)} /></span><span {...stylex.props(ui.caption)}>{o.remote ? "Remote" : o.location} <span aria-hidden="true">·</span> {o.category}</span></div><ArrowUpRight size={13} {...stylex.props(ui.muted)} /></div>
          <h3 {...stylex.props(s.itemTitle)}>{o.title}</h3><div {...stylex.props(ui.between)}><span {...stylex.props(s.amount)}>{o.amount}<small {...stylex.props(s.amountNote)}>{o.category === "Challenge" ? " prize" : ""}</small></span><span {...stylex.props(s.match)}>{o.category}</span></div>
        </button>) : <div {...stylex.props(ui.empty)}><Search size={25} /><p>No opportunities found.</p><button {...stylex.props(ui.textButton)} onClick={() => { setType("All types"); setRemote(false); onSearch(""); onCity(""); setTab("For you"); }}>Clear filters <ArrowRight size={14} /></button></div>}
        {visible.length > 0 && <div {...stylex.props(s.listFooter)}><span {...stylex.props(s.footerDot)} /> Sample listings</div>}
      </div>
      {selected ? <OpportunityDetail item={selected} saved={state.saved.includes(selected.id)} applied={state.applications.some(a => a.opportunityId === selected.id)} onSave={() => onSave(selected.id)} onApply={() => onApply(selected)} /> : <div {...stylex.props(ui.empty, s.detailEmpty)}><Bookmark size={30} /><h3 {...stylex.props(ui.heading)}>No opportunity selected</h3><p {...stylex.props(ui.small)}>Try a different filter to find your next opportunity.</p></div>}
    </div>
  </section>;
}

function OpportunityDetail({ item, saved, applied, onSave, onApply }: { item: Opportunity; saved: boolean; applied: boolean; onSave: () => void; onApply: () => void }) {
  return <article {...stylex.props(s.detail)} aria-label={`${item.company} opportunity details`}>
    <div {...stylex.props(ui.between)}><span {...stylex.props(ui.pill, ui.green)}>Explore this opportunity</span><button {...stylex.props(s.save, saved && s.saveActive)} onClick={onSave} aria-label={saved ? "Unsave opportunity" : "Save opportunity"} aria-pressed={saved}><Bookmark size={17} fill={saved ? "currentColor" : "none"} /></button></div>
    <div {...stylex.props(ui.row, s.detailCompany)}><CompanyLogo tone={item.tone} /><div><span {...stylex.props(s.companyName)}>{item.company}<CheckCheck size={13} {...stylex.props(s.verified)} /></span><span {...stylex.props(s.companySub)}>Early-stage startup <span aria-hidden="true">·</span> Demo organization</span></div></div>
    <h3 {...stylex.props(s.detailTitle)}>{item.title}</h3>
    <div {...stylex.props(ui.row, ui.wrap, s.detailTags)}><span {...stylex.props(ui.pill, ui.pink)}>{item.category}</span><span {...stylex.props(ui.row, ui.caption)}><Globe2 size={11} />{item.remote ? "Remote friendly" : item.location}</span><span {...stylex.props(ui.row, ui.caption)}><Clock3 size={11} />{item.duration}</span></div>
    <p {...stylex.props(s.description)}>{item.description}</p>
    <div {...stylex.props(ui.row, ui.wrap, s.skills)}>{item.skills.map(skill => <span key={skill} {...stylex.props(s.skill)}>{skill}</span>)}</div>
    <div {...stylex.props(s.deliverables)}><h4 {...stylex.props(s.deliverableHeading)}>Deliverables</h4>{item.deliverables.slice(0, 2).map(d => <p key={d} {...stylex.props(s.deliverable)}><Check size={12} />{d}</p>)}</div>
    <div {...stylex.props(s.detailFooter)}><div {...stylex.props(ui.between)}><div><p {...stylex.props(s.reward)}>{item.amount}<span {...stylex.props(s.rewardLabel)}>{item.category === "Challenge" ? "prize pool" : item.category === "Internship" ? "stipend" : "project fee"}</span></p><span {...stylex.props(s.deadline)}>Apply by {item.deadline}</span></div><span {...stylex.props(ui.row, ui.caption)}><Users size={13} />{item.applicants} applied</span></div><button {...stylex.props(ui.primary, ui.full, s.apply)} onClick={onApply}>{applied ? "View application" : "Apply"}<ArrowUpRight size={15} /></button></div>
  </article>;
}

const s = stylex.create({
  section: { minWidth: 0, scrollMarginTop: 100 },
  sectionHeading: { marginBottom: 18 },
  matchCaption: { display: { default: "flex", "@media (max-width: 700px)": "none" }, alignItems: "center", gap: 5, fontSize: 10 },
  controls: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 15, flexWrap: "wrap" },
  tabs: { display: "flex", gap: 3, backgroundColor: colors.secondary, padding: 4, borderRadius: 30 },
  tab: { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 20, fontSize: 10, fontWeight: 500, backgroundColor: "transparent", color: colors.muted, minHeight: 44 },
  tabActive: { backgroundColor: colors.elevated, color: colors.foreground },
  count: { display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 4, minWidth: 15, height: 15, backgroundColor: colors.border, fontSize: 9 },
  filters: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  selectWrap: { display: "flex", alignItems: "center", border: "1px solid", borderColor: colors.border, borderRadius: 8, paddingRight: 10, backgroundColor: colors.secondary, color: colors.muted },
  select: { border: 0, backgroundColor: "transparent", color: colors.body, fontSize: { default: 10, "@media (max-width: 700px)": 14 }, minHeight: 44, padding: "9px 8px 9px 12px", appearance: "none", maxWidth: 110 },
  filterButton: { minHeight: 44, display: "flex", alignItems: "center", gap: 5, padding: "8px 10px", backgroundColor: colors.secondary, border: "1px solid", borderColor: colors.border, color: colors.body, borderRadius: 8, fontSize: 10 },
  filterActive: { backgroundColor: colors.softPink, color: colors.primary, borderColor: colors.primary },
  sort: { position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, color: colors.muted, border: "1px solid", borderColor: colors.border, borderRadius: 8 },
  sortSelect: { position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer" },
  searchRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" },
  search: { display: "flex", alignItems: "center", flex: 1, minWidth: 160, gap: 8, padding: "0 12px", backgroundColor: colors.card, color: colors.muted, border: "1px solid", borderColor: colors.border, borderRadius: 10 },
  searchInput: { width: "100%", minWidth: 0, minHeight: 44, fontSize: { default: 12, "@media (max-width: 700px)": 16 }, color: colors.foreground, backgroundColor: "transparent", border: 0 },
  clear: { backgroundColor: "transparent", color: colors.muted, padding: 5 },
  board: { display: "grid", gridTemplateColumns: { default: "minmax(0, 0.94fr) minmax(0, 1.22fr)", "@media (max-width: 640px)": "1fr" }, overflow: "hidden" },
  list: { padding: "18px 12px 0", borderRight: { default: "1px solid var(--border-subtle)", "@media (max-width: 640px)": "none" } },
  listHeading: { padding: "0 8px 14px", fontSize: 10, color: colors.muted },
  item: { width: "100%", display: "block", position: "relative", textAlign: "left", padding: "15px 12px", marginBottom: 6, borderRadius: 12, border: "1px solid", borderColor: "transparent", backgroundColor: { default: "transparent", ":hover": colors.elevated }, color: colors.foreground },
  itemSelected: { borderColor: "color-mix(in srgb, var(--accent-primary), transparent 55%)", backgroundColor: colors.softPink, boxShadow: "inset 3px 0 0 var(--accent-primary)" },
  companyRow: { gap: 9 },
  itemCompany: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4, fontSize: 11, fontWeight: 500 },
  itemTitle: { fontSize: { default: 12, "@media (max-width: 700px)": 14 }, fontWeight: 500, lineHeight: 1.5, marginBlock: 11, letterSpacing: "-0.15px" },
  amount: { fontSize: 12, fontWeight: 600, fontFamily: "var(--font-display)" },
  amountNote: { fontSize: 9, color: colors.muted, fontWeight: 400 },
  match: { display: "flex", alignItems: "center", gap: 4, color: colors.green, fontSize: 9 },
  listFooter: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0 16px", fontSize: 8, color: colors.muted },
  footerDot: { width: 4, height: 4, borderRadius: "50%", backgroundColor: colors.pink },
  detail: { display: "flex", flexDirection: "column", padding: { default: 24, "@media (max-width: 700px)": 20 }, backgroundImage: "radial-gradient(ellipse at 100% 0%, var(--hero-wash), transparent 60%)", minWidth: 0 },
  detailEmpty: { minHeight: 440 },
  save: { width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "transparent", color: { default: colors.muted, ":hover": colors.primary }, borderRadius: 8 },
  saveActive: { color: colors.primary },
  detailCompany: { marginTop: 20, gap: 10 },
  companyName: { display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500 },
  verified: { color: colors.pink },
  companySub: { display: "block", marginTop: 4, fontSize: 9, color: colors.muted },
  detailTitle: { fontFamily: "var(--font-display)", fontSize: 24, lineHeight: 1.3, letterSpacing: "-0.8px", fontWeight: 500, marginTop: 17 },
  detailTags: { marginTop: 12, gap: 10 },
  description: { fontSize: { default: 11, "@media (max-width: 700px)": 14 }, color: colors.body, lineHeight: 1.9, marginTop: 17 },
  skills: { marginTop: 16, gap: 6 },
  skill: { padding: "5px 8px", border: "1px solid", borderColor: colors.border, fontSize: 9, color: colors.body, borderRadius: 5 },
  deliverables: { paddingTop: 20, marginTop: 20, borderTop: "1px solid", borderColor: colors.subtleBorder },
  deliverableHeading: { fontSize: 11, fontWeight: 500, marginBottom: 10 },
  deliverable: { display: "flex", alignItems: "flex-start", gap: 7, color: colors.muted, fontSize: { default: 10, "@media (max-width: 700px)": 13 }, lineHeight: 1.6, marginTop: 7 },
  detailFooter: { paddingTop: 22, marginTop: "auto" },
  reward: { display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 7, fontSize: 23, letterSpacing: "-0.5px", fontFamily: "var(--font-display)", fontWeight: 500 },
  rewardLabel: { fontFamily: "var(--font-inter)", fontSize: 9, color: colors.muted, letterSpacing: "normal", fontWeight: 400 },
  deadline: { fontSize: 9, color: colors.muted, display: "block", marginTop: 4 },
  apply: { marginTop: 17, minHeight: 44, fontSize: 11 },
});
