import * as stylex from "@stylexjs/stylex";
import { ArrowUpRight, MapPin, Sparkles, Check, Users, MessageCircle } from "lucide-react";
import { colors } from "@/styles/tokens.stylex";
import { events } from "@/lib/demo-data";
import { ui, TextLink } from "./ui";

export function Community({ joined, onEvent, onViewAll, expanded = false }: { joined: string[]; onEvent: (id: string) => void; onViewAll: () => void; expanded?: boolean }) {
  return <section aria-labelledby="events-heading">
    <div {...stylex.props(ui.between, s.heading)}><h2 id="events-heading" {...stylex.props(ui.heading)}>On your radar</h2><TextLink onClick={onViewAll}>{expanded ? "Your community" : "Explore community"}</TextLink></div>
    <div {...stylex.props(s.eventGrid)}>{events.map(event => <button key={event.id} {...stylex.props(ui.card, s.event)} onClick={() => onEvent(event.id)}><span {...stylex.props(s.date, ui[event.tone])}><span {...stylex.props(s.month)}>{event.month}</span>{event.day}</span><div {...stylex.props(s.eventBody)}><span {...stylex.props(s.eventType)}>{event.kind}</span><h3 {...stylex.props(s.eventTitle)}>{event.title}</h3><span {...stylex.props(ui.row, s.location)}>{joined.includes(event.id) ? <Check size={11} /> : <MapPin size={11} />}{joined.includes(event.id) ? "You're on the list" : event.location}</span></div><ArrowUpRight size={16} {...stylex.props(ui.muted)} /></button>)}</div>
    {expanded && <div {...stylex.props(ui.card, s.communityCard)}><div {...stylex.props(ui.logo, ui.purple)}><Users size={23} /></div><div><h3 {...stylex.props(ui.heading)}>Find your people. Build your thing.</h3><p {...stylex.props(ui.body, s.communityText)}>Meet early builders, trade ideas, and learn from people a few steps ahead. Choose a meetup above to preview its details and reserve a place in your demo workspace.</p><span {...stylex.props(ui.pill, ui.purple)}><MessageCircle size={12} /> More conversations, more possibilities</span></div></div>}
  </section>;
}

export function Momentum({ onWorkspace }: { onWorkspace: () => void }) {
  return <div {...stylex.props(ui.card, s.momentum)}><div {...stylex.props(ui.row)}><span {...stylex.props(ui.logo, ui.orange, ui.logoSmall)}><Sparkles size={17} /></span><div><h3 {...stylex.props(s.momentumTitle)}>Small steps. Real momentum.</h3><p {...stylex.props(s.momentumText)}>Your next project could change everything.</p></div></div><button {...stylex.props(ui.textButton)} onClick={onWorkspace}>Keep building <ArrowUpRight size={14} /></button></div>;
}
const s = stylex.create({
  heading: { marginBottom: 14 },
  eventGrid: { display: "grid", gridTemplateColumns: { default: "repeat(2, minmax(0, 1fr))", "@media (max-width: 700px)": "1fr" }, gap: 14 },
  event: { display: "flex", alignItems: "center", textAlign: "left", padding: 18, gap: 14, color: colors.foreground, borderColor: { default: colors.subtleBorder, ":hover": colors.border } },
  date: { width: 48, minWidth: 48, height: 58, borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 500, lineHeight: 1.1, gap: 3 },
  month: { fontFamily: "var(--font-inter)", fontSize: 8, letterSpacing: "1px" },
  eventBody: { flex: 1 }, eventType: { display: "block", fontSize: 9, color: colors.muted, marginBottom: 6 },
  eventTitle: { fontSize: 12, fontWeight: 500, letterSpacing: "-0.2px", lineHeight: 1.5 },
  location: { fontSize: 9, color: colors.muted, marginTop: 7, gap: 4 },
  communityCard: { display: "flex", alignItems: "flex-start", gap: 20, padding: 28, marginTop: 24 },
  communityText: { marginBlock: 14, maxWidth: 650 },
  momentum: { padding: "18px 22px", marginTop: 16 },
  momentumTitle: { fontSize: 12, fontWeight: 500 }, momentumText: { fontSize: 10, color: colors.muted, marginTop: 5 },
});
