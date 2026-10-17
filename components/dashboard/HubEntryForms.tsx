"use client";
import type { FormEvent } from "react";
import * as stylex from "@stylexjs/stylex";
import { ArrowUpRight } from "lucide-react";
import type { DirectoryEntry, DirectoryKind, Draft, Thread } from "@/lib/hub-data";
import { ui } from "./ui";
import styles from "./Hub.module.css";

function values(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  return (key: string) => String(data.get(key) ?? "").trim();
}

export function ListingForm({ kind, name, onSave }: { kind: DirectoryKind; name: string; onSave: (entry: DirectoryEntry) => void }) {
  const business = kind === "business";
  return <form className={styles.form} onSubmit={event => { const get = values(event); onSave({ id: crypto.randomUUID(), kind, name: get("name"), title: get("title"), location: get("location"), tags: [get("category"), ...get("tags").split(",").map(tag => tag.trim()).filter(Boolean)].slice(0, 5), description: get("description"), detail: get("detail"), available: true }); }}>
    <label {...stylex.props(ui.label)}>{business ? "Business name" : "Your professional name"}<input name="name" required maxLength={70} defaultValue={business ? "" : name} {...stylex.props(ui.input)} /></label>
    <label {...stylex.props(ui.label)}>{business ? "What are you offering or seeking?" : "Your service headline"}<input name="title" required maxLength={100} placeholder={business ? "A delivery partner for our next release" : "Thoughtful product design for ambitious teams"} {...stylex.props(ui.input)} /></label>
    <div className={styles.twoColumns}><label {...stylex.props(ui.label)}>Category<select name="category" {...stylex.props(ui.input)}>{(business ? ["Offering", "Seeking"] : ["Design", "Development", "Branding", "Writing", "Other"]).map(label => <option key={label}>{label}</option>)}</select></label><label {...stylex.props(ui.label)}>Location<input name="location" required maxLength={60} placeholder="Bengaluru or Remote" {...stylex.props(ui.input)} /></label></div>
    <label {...stylex.props(ui.label)}>Skills / focus areas<input name="tags" required maxLength={150} placeholder="React, Next.js, SaaS" {...stylex.props(ui.input)} /></label>
    <label {...stylex.props(ui.label)}>{business ? "Partnership type" : "Rate or starting price"}<input name="detail" required maxLength={80} placeholder={business ? "Project partnership" : "₹2,000 / hour"} {...stylex.props(ui.input)} /></label>
    <label {...stylex.props(ui.label)}>Description<textarea name="description" required minLength={30} maxLength={1500} rows={4} {...stylex.props(ui.input)} /></label>
    <p {...stylex.props(ui.caption)}>Save this listing on this device in your account&apos;s workspace. It isn&apos;t published to other users.</p>
    <button type="submit" {...stylex.props(ui.primary)}>Save listing <ArrowUpRight size={14} /></button>
  </form>;
}

export function DiscussionForm({ author, onSave }: { author: string; onSave: (thread: Thread) => void }) {
  return <form className={styles.form} onSubmit={event => { const get = values(event); onSave({ id: crypto.randomUUID(), title: get("title"), category: get("category"), body: get("body"), author }); }}>
    <label {...stylex.props(ui.label)}>A clear starting question<input name="title" required minLength={8} maxLength={140} placeholder="What would you like to talk about?" {...stylex.props(ui.input)} /></label>
    <label {...stylex.props(ui.label)}>Topic<select name="category" {...stylex.props(ui.input)}>{["Questions", "Feedback", "Build logs", "Resources"].map(label => <option key={label}>{label}</option>)}</select></label>
    <label {...stylex.props(ui.label)}>Give the conversation some context<textarea name="body" required minLength={30} maxLength={4000} rows={6} placeholder="Share what you've tried, what you're building, or where a fresh perspective would help." {...stylex.props(ui.input)} /></label>
    <p {...stylex.props(ui.caption)}>Your discussion and replies are saved on this device. They aren&apos;t published to the public forum yet.</p>
    <button type="submit" {...stylex.props(ui.primary)}>Save discussion <ArrowUpRight size={14} /></button>
  </form>;
}

export function IntroductionForm({ entry, kind, onSave }: { entry: DirectoryEntry; kind: Draft["kind"]; onSave: (draft: Draft) => void }) {
  return <form className={styles.form} onSubmit={event => { const get = values(event); onSave({ id: crypto.randomUUID(), recipient: entry.name, kind, title: get("title"), body: get("body") }); }}>
    <span {...stylex.props(ui.pill, ui.pink)}>For {entry.name}</span>
    <label {...stylex.props(ui.label)}>{kind === "pitch" ? "Startup / pitch headline" : "Project or partnership headline"}<input name="title" required minLength={8} maxLength={140} {...stylex.props(ui.input)} /></label>
    <label {...stylex.props(ui.label)}>{kind === "pitch" ? "Problem, product, traction, and your ask" : "Scope, timeline, budget, and the next step"}<textarea name="body" required minLength={40} maxLength={5000} rows={7} {...stylex.props(ui.input)} /></label>
    <p {...stylex.props(ui.caption)}>Keep a draft on this device. Saving does not send a message or contact this example profile.</p>
    <button type="submit" {...stylex.props(ui.primary)}>Save {kind === "pitch" ? "pitch" : "introduction"} draft <ArrowUpRight size={14} /></button>
  </form>;
}
