"use client";
import type { FormEvent } from "react";
import * as stylex from "@stylexjs/stylex";
import { ArrowUpRight, Check, Link2, Send } from "lucide-react";
import { cities, type DemoState, type Opportunity, type OpportunityType, type PortfolioItem } from "@/lib/demo-data";
import { colors } from "@/styles/tokens.stylex";
import { ui } from "./ui";

function formData(event: FormEvent<HTMLFormElement>) { event.preventDefault(); return new FormData(event.currentTarget); }
function urlIsSafe(value: string) { if (!value) return true; try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; } }
function validateLink(form: HTMLFormElement, value: string) {
  const input = form.elements.namedItem("link") as HTMLInputElement | null;
  input?.setCustomValidity(urlIsSafe(value) ? "" : "Use an https:// or http:// link.");
  return form.reportValidity();
}

export function ProfileForm({ profile, onSave }: { profile: DemoState["profile"]; onSave: (profile: DemoState["profile"]) => void }) {
  return <form {...stylex.props(formStyles.form)} onSubmit={event => { const data = formData(event); const link = String(data.get("link") ?? "").trim(); if (!validateLink(event.currentTarget, link)) return; onSave({ name: String(data.get("name")).trim(), headline: String(data.get("headline")).trim(), skills: String(data.get("skills")).trim(), link }); }}>
    <label {...stylex.props(ui.label)}>Your name<input name="name" defaultValue={profile.name} readOnly title="Update your name using the account menu" maxLength={60} {...stylex.props(ui.input)} /></label>
    <label {...stylex.props(ui.label)}>Professional headline<input name="headline" defaultValue={profile.headline} required maxLength={120} {...stylex.props(ui.input)} /></label>
    <label {...stylex.props(ui.label)}>Your skills<input name="skills" defaultValue={profile.skills} required placeholder="UI/UX Design, Figma, React" {...stylex.props(ui.input)} /><span {...stylex.props(ui.caption)}>Separate skills with commas.</span></label>
    <label {...stylex.props(ui.label)}>Portfolio or GitHub link<input name="link" type="url" defaultValue={profile.link} placeholder="https://your-portfolio.com" onChange={e => e.currentTarget.setCustomValidity("")} {...stylex.props(ui.input)} /><span {...stylex.props(ui.caption)}>Add a link to complete your profile.</span></label>
    <button type="submit" {...stylex.props(ui.primary)}><Check size={15} />Save profile</button>
  </form>;
}

export function ApplicationForm({ item, state, onSubmit }: { item: Opportunity; state: DemoState; onSubmit: (note: string, link: string) => void }) {
  const existing = state.applications.find(a => a.opportunityId === item.id);
  return <div {...stylex.props(formStyles.form)}><div {...stylex.props(formStyles.summary)}><span {...stylex.props(ui.pill, ui.pink)}>{item.category}</span><p {...stylex.props(formStyles.summaryTitle)}>{item.title}</p><span {...stylex.props(ui.caption)}>{item.company} · {item.amount} · {item.duration}</span></div>
    {existing ? <><span {...stylex.props(ui.pill, ui.green)}><Check size={12} />{existing.status}</span><p {...stylex.props(ui.body)}>{existing.note}</p>{existing.link && urlIsSafe(existing.link) && <a href={existing.link} target="_blank" rel="noreferrer" {...stylex.props(ui.textButton)}><Link2 size={14} />View your work <ArrowUpRight size={13} /></a>}<p {...stylex.props(ui.caption)}>This application is stored in your demo workspace. No application has been sent to a company.</p></> : <>
      <div><h3 {...stylex.props(formStyles.subheading)}>What to submit</h3>{item.deliverables.map(d => <p key={d} {...stylex.props(formStyles.listItem)}><Check size={12} />{d}</p>)}</div>
      <div><h3 {...stylex.props(formStyles.subheading)}>How your work is reviewed</h3><div {...stylex.props(ui.row, ui.wrap)}>{item.rubric.map(r => <span key={r} {...stylex.props(ui.pill)}>{r}</span>)}</div></div>
      <p {...stylex.props(formStyles.notice)}>{item.category === "Challenge" ? "Prize-based challenge: the listed reward goes to the selected submission. You retain ownership of your work unless you agree otherwise." : "Scope, payment milestones, and ownership should be agreed with the startup before work begins."}</p>
      <form {...stylex.props(formStyles.form)} onSubmit={event => { const data = formData(event); const link = String(data.get("link") ?? "").trim(); if (!validateLink(event.currentTarget, link)) return; onSubmit(String(data.get("note")).trim(), link); }}>
        <label {...stylex.props(ui.label)}>Why does this opportunity speak to you?<textarea name="note" required minLength={20} maxLength={2000} rows={3} placeholder="Tell the team what you'd bring and how you'd approach the challenge..." {...stylex.props(ui.input)} /></label>
        <label {...stylex.props(ui.label)}>A link to your work <span {...stylex.props(ui.caption)}>(optional)</span><input name="link" type="url" defaultValue={state.profile.link} placeholder="https://" onChange={e => e.currentTarget.setCustomValidity("")} {...stylex.props(ui.input)} /></label>
        <span {...stylex.props(ui.caption)}>Demo application · Saved on this device, not sent to a company.</span><button {...stylex.props(ui.primary)} type="submit"><Send size={14} />Save demo application</button>
      </form></>}
  </div>;
}

export function PortfolioForm({ onSave }: { onSave: (project: PortfolioItem) => void }) {
  return <form {...stylex.props(formStyles.form)} onSubmit={event => { const data = formData(event); const link = String(data.get("link")).trim(); if (!validateLink(event.currentTarget, link)) return; onSave({ id: crypto.randomUUID(), title: String(data.get("title")).trim(), type: String(data.get("type")), link }); }}>
    <label {...stylex.props(ui.label)}>Project title<input name="title" required maxLength={100} placeholder="What did you bring to life?" {...stylex.props(ui.input)} /></label>
    <label {...stylex.props(ui.label)}>Discipline<select name="type" {...stylex.props(ui.input)}><option>Product design</option><option>Frontend development</option><option>Data analysis</option><option>Branding</option><option>Other</option></select></label>
    <label {...stylex.props(ui.label)}>Project link<input name="link" type="url" required placeholder="https://" onChange={e => e.currentTarget.setCustomValidity("")} {...stylex.props(ui.input)} /></label>
    <button type="submit" {...stylex.props(ui.primary)}>Add to your portfolio <ArrowUpRight size={15} /></button>
  </form>;
}

export function PostOpportunityForm({ onSave, category }: { onSave: (item: Opportunity) => void; category?: OpportunityType }) {
  return <form {...stylex.props(formStyles.form)} onSubmit={event => { const data = formData(event); const date = new Date(`${data.get("deadline")}T12:00:00`); onSave({ id: crypto.randomUUID(), title: String(data.get("title")).trim(), company: String(data.get("company")).trim(), category: String(data.get("category")) as OpportunityType, location: String(data.get("location")), remote: data.get("remote") === "on", amount: String(data.get("amount")).trim(), duration: String(data.get("duration")).trim(), deadline: date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }), skills: String(data.get("skills")).split(",").map(v => v.trim()).filter(Boolean).slice(0, 6), match: 80, tone: "orange", description: String(data.get("description")).trim(), deliverables: String(data.get("deliverables")).split("\n").map(v => v.trim()).filter(Boolean), rubric: ["Quality · 40%", "Completeness · 35%", "Communication · 25%"], applicants: 0 }); }}>
    <label {...stylex.props(ui.label)}>Startup name<input name="company" required maxLength={60} placeholder="Your startup" {...stylex.props(ui.input)} /></label>
    <label {...stylex.props(ui.label)}>Opportunity title<input name="title" required maxLength={100} placeholder="Give great talent a clear starting point" {...stylex.props(ui.input)} /></label>
    <div {...stylex.props(formStyles.twoColumns)}><label {...stylex.props(ui.label)}>Type<select name="category" {...stylex.props(ui.input)}>{(category ? [category] : ["Challenge", "Paid project", "Internship"]).map(type => <option key={type}>{type}</option>)}</select></label><label {...stylex.props(ui.label)}>Location<select name="location" {...stylex.props(ui.input)}>{cities.map(c => <option key={c.name}>{c.name}</option>)}</select></label></div>
    <label {...stylex.props(ui.row, ui.small)}><input name="remote" type="checkbox" defaultChecked />Open to remote contributors</label>
    <div {...stylex.props(formStyles.twoColumns)}><label {...stylex.props(ui.label)}>Reward / compensation<input name="amount" required placeholder="₹15,000" {...stylex.props(ui.input)} /></label><label {...stylex.props(ui.label)}>Time commitment<input name="duration" required placeholder="1 week" {...stylex.props(ui.input)} /></label></div>
    <label {...stylex.props(ui.label)}>Application deadline<input name="deadline" type="date" required {...stylex.props(ui.input)} /></label>
    <label {...stylex.props(ui.label)}>Skills (comma separated)<input name="skills" required placeholder="Figma, UI/UX Design" {...stylex.props(ui.input)} /></label>
    <label {...stylex.props(ui.label)}>The brief<textarea name="description" required minLength={30} rows={3} placeholder="Explain the problem and what success looks like..." {...stylex.props(ui.input)} /></label>
    <label {...stylex.props(ui.label)}>Deliverables (one per line)<textarea name="deliverables" required rows={3} placeholder="A working prototype\nA short walkthrough" {...stylex.props(ui.input)} /></label>
    <p {...stylex.props(ui.caption)}>This creates a local demo opportunity so you can explore the startup workflow.</p><button type="submit" {...stylex.props(ui.primary)}>Create demo opportunity <ArrowUpRight size={15} /></button>
  </form>;
}
export const formStyles = stylex.create({
  form: { display: "flex", flexDirection: "column", gap: 18 },
  summary: { padding: 18, borderRadius: 12, backgroundColor: colors.elevated, border: "1px solid", borderColor: colors.border },
  summaryTitle: { fontFamily: "var(--font-display)", fontSize: 20, marginBlock: 12, letterSpacing: "-0.5px" },
  subheading: { fontSize: 12, fontWeight: 600, marginBottom: 10 },
  listItem: { display: "flex", alignItems: "flex-start", gap: 7, color: colors.body, fontSize: 12, lineHeight: 1.8 },
  notice: { padding: 12, borderRadius: 8, backgroundColor: colors.softOrange, color: colors.warm, fontSize: 11, lineHeight: 1.7 },
  twoColumns: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 14 },
});
