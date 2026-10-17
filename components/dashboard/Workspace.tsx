import * as stylex from "@stylexjs/stylex";
import { ArrowUpRight, ExternalLink, FolderOpen, Plus, CheckCheck } from "lucide-react";
import type { DemoState, Opportunity } from "@/lib/demo-data";
import { colors } from "@/styles/tokens.stylex";
import { ui, CompanyLogo } from "./ui";

export function Workspace({ state, items, onApplication, onAddProject, onExplore }: { state: DemoState; items: Opportunity[]; onApplication: (item: Opportunity) => void; onAddProject: () => void; onExplore: () => void }) {
  return <div {...stylex.props(s.workspace)}>
    <section {...stylex.props(ui.card, s.panel)} aria-labelledby="applications-title"><div {...stylex.props(ui.between, s.heading)}><div><h2 id="applications-title" {...stylex.props(ui.heading)}>Your next chapters</h2><p {...stylex.props(ui.caption, s.subtitle)}>Every application is a step forward.</p></div><span {...stylex.props(ui.pill, ui.pink)}>{state.applications.length} applications</span></div>
      {state.applications.length ? state.applications.map(application => { const item = items.find(o => o.id === application.opportunityId); return item ? <button key={item.id} {...stylex.props(s.application)} onClick={() => onApplication(item)}><CompanyLogo tone={item.tone} /><div {...stylex.props(s.applicationInfo)}><h3 {...stylex.props(s.title)}>{item.title}</h3><p {...stylex.props(ui.caption, s.subtitle)}>{item.company} · {item.category}</p></div><span {...stylex.props(ui.pill, application.status === "Shortlisted" ? ui.green : ui.purple)}>{application.status}</span><ArrowUpRight size={16} /></button> : null; }) : <div {...stylex.props(ui.empty)}><FolderOpen size={28} /><p>Your next opportunity is out there.</p><button {...stylex.props(ui.primary)} onClick={onExplore}>Find a challenge <ArrowUpRight size={14} /></button></div>}
    </section>
    <section {...stylex.props(ui.card, s.panel)} aria-labelledby="portfolio-title"><div {...stylex.props(ui.between, s.heading)}><div><h2 id="portfolio-title" {...stylex.props(ui.heading)}>Proof of what you can do</h2><p {...stylex.props(ui.caption, s.subtitle)}>Your ideas, your decisions, your finished work.</p></div><button {...stylex.props(ui.secondary)} onClick={onAddProject}><Plus size={15} />Add project</button></div><div {...stylex.props(s.projects)}>{state.portfolio.map((project, i) => <article key={project.id} {...stylex.props(s.project)}><div {...stylex.props(s.projectArt, i % 2 === 0 ? s.projectPink : s.projectOrange)}><span {...stylex.props(s.projectLetter)}>{project.title[0]}</span><span {...stylex.props(s.artOrbit)} /></div><div {...stylex.props(s.projectContent)}><span {...stylex.props(ui.caption)}>{project.type}</span><h3 {...stylex.props(s.projectTitle)}>{project.title}</h3><div {...stylex.props(ui.between)}><span {...stylex.props(ui.pill)}><CheckCheck size={11} />Self-reported project</span>{project.link && /^https?:\/\//i.test(project.link) && <a href={project.link} target="_blank" rel="noreferrer" {...stylex.props(ui.textButton)} aria-label={`Open ${project.title}`}>View project <ExternalLink size={12} /></a>}</div></div></article>)}</div></section>
  </div>;
}
const s = stylex.create({
  workspace: { display: "flex", flexDirection: "column", gap: 24 },
  panel: { padding: { default: 26, "@media (max-width: 700px)": 18 } }, heading: { marginBottom: 20, flexWrap: "wrap" }, subtitle: { marginTop: 6 },
  application: { width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "18px 0", backgroundColor: "transparent", color: colors.body, borderTop: "1px solid", borderColor: colors.subtleBorder, textAlign: "left", flexWrap: "wrap" },
  applicationInfo: { flex: 1, minWidth: 130 }, title: { fontSize: 13, fontWeight: 500, color: colors.foreground },
  projects: { display: "grid", gridTemplateColumns: { default: "repeat(2, minmax(0,1fr))", "@media (max-width: 600px)": "1fr" }, gap: 18 },
  project: { border: "1px solid", borderColor: colors.border, borderRadius: 14, overflow: "hidden" },
  projectArt: { height: 150, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" },
  projectPink: { backgroundColor: colors.softPink, color: colors.pink }, projectOrange: { backgroundColor: colors.softOrange, color: colors.warm },
  projectLetter: { fontFamily: "var(--font-display)", fontSize: 88, fontWeight: 500, transform: "rotate(-12deg)", zIndex: 1 },
  artOrbit: { position: "absolute", width: 240, height: 85, border: "1px solid currentColor", borderRadius: "50%", transform: "rotate(-24deg)", opacity: 0.4 },
  projectContent: { padding: 18 }, projectTitle: { fontSize: 14, fontFamily: "var(--font-display)", fontWeight: 500, marginBlock: "8px 18px" },
});
