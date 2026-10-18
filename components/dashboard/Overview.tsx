"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Bookmark, BriefcaseBusiness, Check, FolderCheck, MapPin, MessageCircle, Trophy, Zap } from "lucide-react";
import { useAccountProfile } from "@/components/SyncUser";
import type { DemoState, Opportunity } from "@/lib/demo-data";
import styles from "./Overview.module.css";

const destinations = [
  { href: "/bounties", title: "Startup bounties", text: "Solve a challenge. Review the brief and reward.", icon: Trophy },
  { href: "/gigs", title: "Freelance gigs", text: "Find paid projects and submit a proposal.", icon: Zap },
  { href: "/freelancers", title: "Local businesses", text: "Explore the map and prepare a service pitch.", icon: MapPin },
  { href: "/community", title: "Community", text: "Share your work and see what others are building.", icon: MessageCircle },
];

export function Overview({ state, items, signedIn, onProfile, onOpen, onSave, onRemoveApplication }: {
  state: DemoState; items: Opportunity[]; signedIn: boolean;
  onProfile: () => void; onOpen: (item: Opportunity) => void; onSave: (id: string) => void; onRemoveApplication: (id: string) => void;
}) {
  const { bundle, status } = useAccountProfile();
  const [tab, setTab] = useState<"Saved" | "Applications" | "Projects">("Saved");
  const checks = [
    { label: "About you", done: Boolean(bundle?.profile?.bio?.trim()) },
    { label: "Skills", done: Boolean(bundle?.skills.length) },
    { label: "Portfolio", done: Boolean(bundle?.projects.length) },
  ];
  const completion = Math.round(checks.filter(item => item.done).length / checks.length * 100);
  const complete = bundle?.onboarding?.completed;
  const stats = [
    { label: "Saved listings", value: state.saved.length, tab: "Saved" as const, icon: Bookmark },
    { label: "Local applications", value: state.applications.length, tab: "Applications" as const, icon: BriefcaseBusiness },
    { label: "Portfolio projects", value: state.portfolio.length, tab: "Projects" as const, icon: FolderCheck },
  ];
  const saved = items.filter(item => state.saved.includes(item.id));
  const empty = tab === "Saved" ? !saved.length : tab === "Applications" ? !state.applications.length : !state.portfolio.length;
  return <div className={styles.page}>
    <section className={styles.hero} aria-labelledby="overview-banner-title">
      <div className={styles.heroContent}><h2 id="overview-banner-title">Startup challenges.<br />Freelance projects.</h2><p>Browse briefs, review deliverables, and apply for projects that match your skills.</p><Link href="/bounties">Explore opportunities <ArrowUpRight size={16} /></Link></div>
      <div className={styles.heroArt}><Image src="/brand/zalen-crystal.png" alt="" fill sizes="(max-width: 700px) 320px, (max-width: 1200px) 550px, 720px" preload /></div>
    </section>
    <section className={styles.start} aria-label="Explore Zalen">
      <div className={styles.paths}>
        <div className={styles.sectionHeading}><h2>Find your next project</h2><span>Choose where to start</span></div>
        <div className={styles.destinations}>{destinations.map(({ href, title, text, icon: Icon }) => <Link href={href} key={href} className={styles.destination}><Icon size={21} /><div><h3>{title}</h3><p>{text}</p></div><ArrowUpRight size={17} /></Link>)}</div>
      </div>
      <aside className={styles.profile} aria-label="Your profile">
        <span className={styles.kicker}>Your profile</span>
        <h2>{!signedIn ? "Introduce yourself" : complete ? "Keep your work up to date" : "Finish setting up"}</h2>
        <p>{!signedIn ? "Add your skills and project examples to get started." : status === "error" ? "Your profile is temporarily unavailable. You can retry from your profile page." : "A short bio, relevant skills, and work samples help explain what you do."}</p>
        {signedIn && bundle && <><div className={styles.progressLabel}><span>Profile essentials</span><strong>{completion}%</strong></div><progress max={100} value={completion} aria-label="Profile essentials completion" /><div className={styles.checks}>{checks.map(item => <span key={item.label}>{item.done ? <Check size={13} /> : <span className={styles.unchecked} />}{item.label}</span>)}</div></>}
        <button onClick={onProfile}>{!signedIn ? "Sign in to set up" : complete ? "View my profile" : "Complete profile"}<ArrowRight size={16} /></button>
      </aside>
    </section>
    <section className={styles.stats} aria-label="Your activity at a glance">{stats.map(({ label, value, tab: nextTab, icon: Icon }) => <button key={label} className={styles.stat} onClick={() => { setTab(nextTab); document.getElementById("dashboard-activity")?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }}><div><Icon size={18} /><span>{label}</span><ArrowUpRight size={15} /></div><strong>{String(value).padStart(2, "0")}</strong></button>)}</section>
    <section id="dashboard-activity" className={styles.activity} aria-labelledby="activity-heading">
      <div className={styles.sectionHeading}><h2 id="activity-heading">Your activity</h2><Link href="/opportunities">Sample opportunity board <ArrowUpRight size={14} /></Link></div>
      <div role="group" aria-label="Activity views" className={styles.tabs}>{(["Saved", "Applications", "Projects"] as const).map(value => <button key={value} aria-pressed={tab === value} onClick={() => setTab(value)}>{value}</button>)}</div>
      {tab !== "Projects" && <p className={styles.note}>Sample opportunity activity is saved on this device. Applications here are local records and are not sent to a company.</p>}
      {empty ? <div className={styles.empty}><Bookmark size={25} /><h3>{tab === "Saved" ? "No saved listings yet" : tab === "Applications" ? "No application records yet" : "No portfolio projects yet"}</h3><p>{tab === "Projects" ? "Add a project to show your experience and the work you can deliver." : "Browse opportunities to read a brief, save it, or prepare an application."}</p>{tab === "Projects" ? <button onClick={onProfile}>Add your work <ArrowRight size={15} /></button> : <Link href="/opportunities">Browse sample opportunities <ArrowRight size={15} /></Link>}</div> : <div className={styles.rows}>
        {tab === "Saved" && saved.map(item => <article key={item.id} className={styles.row}><div><span>{item.company} · {item.category}</span><h3>{item.title}</h3><p>{item.amount} · {item.remote ? "Remote" : item.location}</p></div><div className={styles.rowActions}><button onClick={() => onOpen(item)}>Review <ArrowUpRight size={14} /></button><button aria-label={`Unsave ${item.title}`} onClick={() => onSave(item.id)}><Bookmark size={17} fill="currentColor" /></button></div></article>)}
        {tab === "Applications" && state.applications.map(application => { const item = items.find(item => item.id === application.opportunityId); return <article key={application.opportunityId} className={styles.row}><div><span>Local record · {application.status}</span><h3>{item?.title ?? "Opportunity no longer available"}</h3><p>{item?.company ?? ""}</p></div><div className={styles.rowActions}>{item && <button onClick={() => onOpen(item)}>View record <ArrowUpRight size={14} /></button>}<button onClick={() => onRemoveApplication(application.opportunityId)}>Remove local record</button></div></article>; })}
        {tab === "Projects" && state.portfolio.map(project => <article key={project.id} className={styles.row}><div><span>{project.type}</span><h3>{project.title}</h3></div><button onClick={onProfile}>View in profile <ArrowUpRight size={14} /></button></article>)}
      </div>}
    </section>
  </div>;
}
