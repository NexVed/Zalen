"use client";
import { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { ArrowUpRight, MapPin, Check, CalendarDays, Search } from "lucide-react";
import { colors } from "@/styles/tokens.stylex";
import { events } from "@/lib/demo-data";
import { ui, TextLink } from "./ui";
import styles from "./Hub.module.css";

export function Community({ joined, onEvent, onViewAll, expanded = false, search = "", onSearch, city = "", onCity }: { joined: string[]; onEvent: (id: string) => void; onViewAll: () => void; expanded?: boolean; search?: string; onSearch?: (value: string) => void; city?: string; onCity?: (value: string) => void }) {
  const [filter, setFilter] = useState("All events");
  const filtered = events.filter(event => (!expanded || filter === "All events" || (filter === "Online" && event.location.includes("Online")) || (filter === "In person" && event.location !== "Online") || (filter === "My RSVPs" && joined.includes(event.id))) && (!city || event.location.includes(city) || event.location === "Online") && `${event.title} ${event.kind} ${event.description} ${event.location}`.toLowerCase().includes(search.toLowerCase()));
  return <section aria-labelledby="events-heading">
    {expanded && <><div className={styles.toolbar} style={{ marginBlock: 24 }}><div className={styles.tabs} role="group" aria-label="Event format">{["All events", "Online", "In person", "My RSVPs"].map(value => <button key={value} className={`${styles.tab} ${filter === value ? styles.active : ""}`} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value}</button>)}</div><label className={styles.search}><Search size={14} /><input type="search" aria-label="Search events" placeholder="Find a meetup or workshop..." value={search} onChange={event => onSearch?.(event.target.value)} /></label></div>{city && <button {...stylex.props(ui.textButton)} onClick={() => onCity?.("")}>Showing {city} + online events · Clear city</button>}</>}
    <div {...stylex.props(ui.between, s.heading)}><h2 id="events-heading" {...stylex.props(ui.heading)}>{expanded ? "Meetups & workshops" : "Upcoming events"}</h2>{expanded ? <span {...stylex.props(ui.caption)}>Sample events · {filtered.length} to explore</span> : <TextLink onClick={onViewAll}>Explore events</TextLink>}</div>
    <div {...stylex.props(s.eventGrid)}>{filtered.map(event => <button key={event.id} {...stylex.props(ui.card, s.event)} onClick={() => onEvent(event.id)}><span {...stylex.props(s.date, ui[event.tone])}><span {...stylex.props(s.month)}>{event.month}</span>{event.day}</span><div {...stylex.props(s.eventBody)}><span {...stylex.props(s.eventType)}>{event.kind}</span><h3 {...stylex.props(s.eventTitle)}>{event.title}</h3><span {...stylex.props(ui.row, s.location)}>{joined.includes(event.id) ? <Check size={11} /> : <MapPin size={11} />}{joined.includes(event.id) ? "You're on the list" : event.location}</span>{expanded && <p {...stylex.props(s.location)}>{event.time}</p>}</div><ArrowUpRight size={16} {...stylex.props(ui.muted)} /></button>)}</div>
    {!filtered.length && <div {...stylex.props(ui.empty)}><CalendarDays size={28} /><p>{filter === "My RSVPs" ? "No RSVPs yet. Find an event that speaks to you." : "No events match these filters."}</p><button {...stylex.props(ui.secondary)} onClick={() => { setFilter("All events"); onSearch?.(""); onCity?.(""); }}>Explore all events <ArrowUpRight size={14} /></button></div>}
  </section>;
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
});
