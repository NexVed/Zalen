"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import * as stylex from "@stylexjs/stylex";
import { ArrowUpRight, Search, Info, FileText } from "lucide-react";
import { directory, discussions, type DirectoryEntry, type DirectoryKind } from "@/lib/hub-data";
import type { HubView } from "@/lib/navigation";
import { useHubState } from "@/lib/use-hub-state";
import { Directory } from "./Directory";
import { Forum } from "./Forum";
import { HubDialog, type HubModal } from "./HubDialog";
import { ui } from "./ui";
import styles from "./Hub.module.css";

const content = {
  Forum: { title: "Public discussions", body: "Ask a question, request feedback, or share a build log.", action: "Start a discussion", kind: "freelancer" as DirectoryKind, filters: ["All", "Questions", "Feedback", "Build logs", "Resources"] },
  Investors: { title: "Investor directory", body: "Filter profiles by stage and sector. Review each thesis and prepare a pitch draft.", action: "Explore investment theses", kind: "investor" as DirectoryKind, filters: ["All", "Pre-seed", "Angel", "Seed", "My drafts"] },
  B2B: { title: "Business partnerships", body: "Browse service offers and partnership requests. List your business or draft an introduction.", action: "List a partnership", kind: "business" as DirectoryKind, filters: ["All", "Offering", "Seeking", "My drafts"] },
};

export function HubPage({ view, userId, name, search, onSearch }: { view: Exclude<HubView, "Freelancers">; userId: string | null; name: string; search: string; onSearch: (value: string) => void }) {
  const router = useRouter();
  const [state, update] = useHubState(userId);
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState<HubModal>(null);
  const [message, setMessage] = useState("");
  const copy = content[view];

  const query = search.trim().toLowerCase();
  function requireAccount(action: () => void) { if (!userId) router.push("/sign-up"); else action(); }
  function draft(entry: DirectoryEntry) { requireAccount(() => setModal({ kind: "draft", entry, type: entry.kind === "investor" ? "pitch" : "partnership" })); }
  const entries = [...state.listings, ...directory].filter(entry => entry.kind === copy.kind && (filter === "All" || entry.tags.includes(filter)) && `${entry.name} ${entry.title} ${entry.description} ${entry.tags.join(" ")} ${entry.location}`.toLowerCase().includes(query));
  const threads = [...state.threads, ...discussions].filter(thread => (filter === "All" || filter === thread.category) && `${thread.title} ${thread.body} ${thread.category}`.toLowerCase().includes(query));
  const drafts = state.drafts.filter(d => (view === "Investors" ? d.kind === "pitch" : d.kind === "partnership") && `${d.title} ${d.body} ${d.recipient}`.toLowerCase().includes(query));
  const count = filter === "My drafts" ? drafts.length : view === "Forum" ? threads.length : entries.length;
  return <div className={styles.page}>
    <section className={styles.hero} aria-label={`${view} introduction`}><div><h2>{copy.title}</h2><p>{copy.body}</p><button {...stylex.props(ui.primary)} onClick={() => view === "Investors" ? document.getElementById("hub-results")?.scrollIntoView({ behavior: "smooth", block: "start" }) : requireAccount(() => setModal({ kind: "create", type: view === "Forum" ? "thread" : copy.kind }))}>{copy.action}<ArrowUpRight size={15} /></button></div></section>
    {message && <p className={styles.note} role="status"><Info size={16} />{message}<button aria-label="Dismiss message" className={styles.cardButton} onClick={() => setMessage("")}>Dismiss</button></p>}
    <div className={styles.toolbar}><div className={styles.tabs} role="group" aria-label={`${view} filters`}>{copy.filters.map(label => <button className={`${styles.tab} ${filter === label ? styles.active : ""}`} key={label} aria-pressed={filter === label} onClick={() => setFilter(label)}>{label}</button>)}</div><label className={styles.search}><Search size={15} /><input type="search" aria-label={`Search ${view.toLowerCase()}`} placeholder={view === "Forum" ? "Find a conversation..." : "Search by name, skill, or focus..."} value={search} onChange={event => onSearch(event.target.value)} /></label></div>
    <div className={styles.meta}><span>{count} {filter === "My drafts" ? "saved drafts" : view === "Forum" ? "discussions" : "profiles"} · {filter === "My drafts" ? "Only visible in your local workspace" : view === "Forum" ? "Starter topics + your local discussions" : "Illustrative directory + your local listings"}</span></div>
    <section id="hub-results" aria-label={`${view} results`}>
      {!count ? <div className={styles.empty}><Search size={28} /><h3 className={styles.name}>{filter === "My drafts" ? "No saved drafts" : "No results just yet."}</h3><p>{filter === "My drafts" ? "Open a profile and prepare a pitch or project introduction. Your saved draft will appear here." : "Try another topic, skill, or location."}</p><button {...stylex.props(ui.secondary)} onClick={() => { setFilter("All"); onSearch(""); }}>Explore all <ArrowUpRight size={14} /></button></div>
        : filter === "My drafts" ? <div className={styles.rows}>{drafts.map(d => <article className={styles.card} key={d.id}><span className={styles.tag}><FileText size={12} />{d.kind === "pitch" ? "Pitch draft" : "Introduction draft"}</span><h3 className={styles.name}>{d.title}</h3><span className={styles.location}>For {d.recipient}</span><p className={styles.bodyText}>{d.body}</p><span className={styles.tag}>Saved locally · Not sent</span></article>)}</div>
          : view === "Forum" ? <Forum threads={threads} state={state} onOpen={thread => setModal({ kind: "thread", thread })} /> : <Directory entries={entries} onOpen={entry => setModal({ kind: "entry", entry })} onPitch={draft} />}
    </section>
    {view === "Investors" && <p className={styles.note}><Info size={16} />These are illustrative investment profiles, not verified firms or funding offers. Use them to explore the directory and prepare a pitch; no introduction is sent.</p>}
    <HubDialog modal={modal} onClose={() => setModal(null)} state={state} update={update} name={name} signedIn={!!userId} onSignIn={() => router.push("/sign-in")} onDraft={draft} onDone={value => { setModal(null); setMessage(value); }} />
  </div>;
}
