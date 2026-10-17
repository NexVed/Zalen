"use client";
import * as stylex from "@stylexjs/stylex";
import { Bookmark, BriefcaseBusiness, CalendarDays } from "lucide-react";
import { colors } from "@/styles/tokens.stylex";
import { events, type DemoState, type Opportunity } from "@/lib/demo-data";
import { OpportunityMap } from "./OpportunityMap";
import { type View } from "./Header";
import { ui } from "./ui";

const mapCopy: Partial<Record<View, { title: string; subtitle: string }>> = {
  Overview: { title: "Opportunities by city", subtitle: "Select a city to filter listings." },
  Opportunities: { title: "Filter by location", subtitle: "Select a city to filter opportunities." },
  "My workspace": { title: "Locations", subtitle: "Open a city to see roles you can apply to." },
  Community: { title: "Event locations", subtitle: "Select a city to filter events." },
};

export function Sidebar({ view, items, city, onCity, state }: {
  view: View; items: Opportunity[]; city: string; onCity: (city: string) => void; state: DemoState;
}) {
  const copy = mapCopy[view] ?? mapCopy[view === "Events" ? "Community" : "Opportunities"]!;
  const joined = events.filter(event => state.joined.includes(event.id));
  return <aside aria-label="Page sidebar" {...stylex.props(s.aside)}>
    <div {...stylex.props(ui.card, s.custom)}>
      {view === "Overview" && <p {...stylex.props(s.customText)}> Select a location to filter opportunities.</p>}
      {(view === "Opportunities" || view === "Bounties" || view === "Gigs") && <p {...stylex.props(s.customText)}><Bookmark size={13} /> {state.saved.length} saved {state.saved.length === 1 ? "role" : "roles"}{city ? ` · showing ${city}` : " · every city"}</p>}
      {view === "My workspace" && <p {...stylex.props(s.customText)}><BriefcaseBusiness size={13} /> {state.applications.length} applications · {state.portfolio.length} projects in your portfolio</p>}
      {(view === "Community" || view === "Events") && <p {...stylex.props(s.customText)}><CalendarDays size={13} /> {joined.length ? joined.map(event => event.title).join(" · ") : "No RSVPs yet. Choose a meetup, then find the city here."}</p>}
    </div>
    <OpportunityMap rail items={items} city={city} onCity={onCity} title={copy.title} subtitle={copy.subtitle} />
  </aside>;
}

const s = stylex.create({
  aside: {
    width: { default: 332, "@media (max-width: 1100px)": "100%" },
    flexShrink: 0,
    position: { default: "sticky", "@media (max-width: 1100px)": "static" },
    top: { default: 96, "@media (max-width: 1200px)": 132 },
    height: { default: "calc(100dvh - 112px)", "@media (max-width: 1200px)": "calc(100dvh - 148px)", "@media (max-width: 1100px)": "auto" },
    display: "flex",
    flexDirection: "column",
    gap: 14,
    minHeight: 0,
    minWidth: 0,
  },
  custom: { padding: "14px 16px" },
  customText: { display: "flex", alignItems: "flex-start", gap: 8, color: colors.body, fontSize: 11, lineHeight: 1.6 },
});
