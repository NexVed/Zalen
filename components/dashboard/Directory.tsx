"use client";
import { ArrowUpRight, MapPin, Landmark, Circle } from "lucide-react";
import type { DirectoryEntry } from "@/lib/hub-data";
import styles from "./Hub.module.css";

export function Directory({ entries, onOpen, onPitch }: { entries: DirectoryEntry[]; onOpen: (entry: DirectoryEntry) => void; onPitch: (entry: DirectoryEntry) => void }) {
  const investors = entries[0]?.kind === "investor";
  return <div className={investors ? styles.rows : styles.grid}>{entries.map(entry => entry.kind === "investor" ? <article key={entry.id} className={styles.investor}>
    <span className={styles.avatar}><Landmark size={24} /></span><div className={styles.investorBody}><div><h3 className={styles.name}>{entry.name}</h3><span className={styles.location}><MapPin size={12} />{entry.location}</span></div><p className={styles.description}>{entry.description}</p><div className={styles.tags}>{entry.tags.map(tag => <span className={styles.tag} key={tag}>{tag}</span>)}</div></div><div className={styles.investorAction}><span>{entry.detail}</span><button className={styles.cardButton} onClick={() => onOpen(entry)}>View thesis <ArrowUpRight size={14} /></button><button className={styles.tab} onClick={() => onPitch(entry)}>Draft a pitch <ArrowUpRight size={14} /></button></div>
  </article> : <article key={entry.id} className={styles.card}>
    <div className={styles.cardTop}><span className={styles.avatar}>{entry.name.split("—")[0].trim().split(" ").map(word => word[0]).filter(Boolean).slice(0, 2).join("")}</span><span className={`${styles.status} ${!entry.available ? styles.mutedStatus : ""}`}><Circle size={6} fill="currentColor" />{entry.kind === "business" ? entry.tags[0] : entry.available ? "Open to work" : "Booked right now"}</span></div>
    <div><h3 className={styles.name}>{entry.name}</h3><span className={styles.location}><MapPin size={12} />{entry.location}</span></div><p className={styles.description}>{entry.title}</p><div className={styles.tags}>{entry.tags.map(tag => <span className={styles.tag} key={tag}>{tag}</span>)}</div><div className={styles.cardFooter}><span>{entry.detail}</span><button className={styles.cardButton} onClick={() => onOpen(entry)}>{entry.kind === "business" ? "Explore partnership" : "View profile"}<ArrowUpRight size={14} /></button></div>
  </article>)}</div>;
}
