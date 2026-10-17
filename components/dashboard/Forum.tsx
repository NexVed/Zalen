"use client";
import { MessageCircle, ArrowUpRight } from "lucide-react";
import type { HubState, Thread } from "@/lib/hub-data";
import styles from "./Hub.module.css";

export function Forum({ threads, state, onOpen }: { threads: Thread[]; state: HubState; onOpen: (thread: Thread) => void }) {
  return <div className={styles.forumLayout}>
    <div className={styles.rows}>{threads.map(thread => <button className={styles.thread} key={thread.id} onClick={() => onOpen(thread)}>
      <span className={styles.avatar}><MessageCircle size={21} /></span>
      <div className={styles.threadBody}><div className={styles.tags}><span className={styles.tag}>{thread.category}</span><span className={styles.tag}>{state.threads.some(t => t.id === thread.id) ? "Your local discussion" : "Starter discussion"}</span></div><h3>{thread.title}</h3><p>{thread.body.slice(0, 160)}{thread.body.length > 160 ? "…" : ""}</p><div className={styles.threadMeta}><span>{thread.author}</span><span>{state.replies[thread.id]?.length ?? 0} replies</span>{state.votes.includes(thread.id) && <span>You found this useful</span>}</div></div><ArrowUpRight size={15} />
    </button>)}</div>
    <aside className={styles.guidelines} aria-label="Community guidelines"><h3>Forum guidelines</h3><p>Include enough context for others to answer.</p><p>Share build logs and give specific feedback.</p><p>Be kind. Respect other people&apos;s time, work, and privacy.</p><p>Looking to hire or sell a service? Try B2B or Gigs.</p></aside>
  </div>;
}
