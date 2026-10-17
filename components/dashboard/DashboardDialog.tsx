"use client";
import * as Dialog from "@radix-ui/react-dialog";
import * as stylex from "@stylexjs/stylex";
import { ArrowRight, Bell, CalendarDays, Check, MapPin, Sparkles, X } from "lucide-react";
import { type DemoState, type Opportunity, events } from "@/lib/demo-data";
import { colors } from "@/styles/tokens.stylex";
import { ui } from "./ui";
import { ApplicationForm, PortfolioForm, PostOpportunityForm, ProfileForm, formStyles } from "./forms";

export type Modal = { kind: "profile" | "portfolio" | "post" | "notifications" | "about" } | { kind: "apply"; item: Opportunity } | { kind: "event"; id: string } | null;
const titles = { profile: "A profile that feels like you.", portfolio: "Let your work do the talking.", post: "Find your next great collaborator.", notifications: "You're moving forward.", about: "Where potential meets possibility.", apply: "Your next chapter starts here.", event: "Make room for a new connection." };
const descriptions = { profile: "A few thoughtful details help the right opportunities find you.", portfolio: "Show the world what you can do, one project at a time.", post: "Turn a well-defined problem into an opportunity for emerging talent.", notifications: "A few updates from your demo workspace.", about: "Welcome to Zalen's interactive design preview.", apply: "Show your skills, share your approach, and take the next step.", event: "Good things happen when curious people come together." };

export function DashboardDialog({ modal, onClose, state, update, onDone, onWorkspace }: {
  modal: Modal; onClose: () => void; state: DemoState; update: (fn: (state: DemoState) => DemoState) => void;
  onDone: (message: string) => void; onWorkspace: () => void;
}) {
  const event = modal?.kind === "event" ? events.find(e => e.id === modal.id) : null;
  return <Dialog.Root open={modal !== null} onOpenChange={open => { if (!open) onClose(); }}><Dialog.Portal><Dialog.Overlay {...stylex.props(s.overlay)} /><Dialog.Content {...stylex.props(s.content)}>
    {modal && <><div {...stylex.props(s.header)}><span {...stylex.props(s.eyebrow)}><Sparkles size={12} /> YOUR ZALEN SPACE</span><Dialog.Close {...stylex.props(ui.iconButton)} aria-label="Close dialog"><X size={18} /></Dialog.Close></div><Dialog.Title {...stylex.props(s.title)}>{titles[modal.kind]}</Dialog.Title><Dialog.Description {...stylex.props(s.description)}>{descriptions[modal.kind]}</Dialog.Description><div {...stylex.props(s.body)}>
      {modal.kind === "profile" && <ProfileForm profile={state.profile} onSave={profile => { update(s => ({ ...s, profile })); onDone("Your profile has a little more you."); }} />}
      {modal.kind === "portfolio" && <PortfolioForm onSave={project => { update(s => ({ ...s, portfolio: [...s.portfolio, project] })); onDone("A new chapter added to your portfolio."); }} />}
      {modal.kind === "post" && <PostOpportunityForm onSave={item => { update(s => ({ ...s, customOpportunities: [...s.customOpportunities, item] })); onDone("Your demo opportunity is ready to explore."); }} />}
      {modal.kind === "apply" && <ApplicationForm item={modal.item} state={state} onSubmit={(note, link) => { update(s => s.applications.some(a => a.opportunityId === modal.item.id) ? s : ({ ...s, applications: [...s.applications, { opportunityId: modal.item.id, status: "Submitted", note, link }] })); onDone("Application saved. Find it in My workspace."); }} />}
      {modal.kind === "event" && event && <div {...stylex.props(formStyles.form)}><span {...stylex.props(ui.pill, ui[event.tone])}>{event.kind}</span><h3 {...stylex.props(ui.heading)}>{event.title}</h3><p {...stylex.props(ui.body, ui.small)}>{event.description}</p><span {...stylex.props(ui.row, ui.small)}><CalendarDays size={15} />{event.time}</span><span {...stylex.props(ui.row, ui.small)}><MapPin size={15} />{event.location}</span><p {...stylex.props(ui.caption)}>Sample event · Your RSVP is saved only in this demo workspace.</p><button {...stylex.props(ui.primary)} onClick={() => { const joined = state.joined.includes(event.id); update(s => ({ ...s, joined: joined ? s.joined.filter(id => id !== event.id) : [...s.joined, event.id] })); onDone(joined ? "Your demo RSVP has been cancelled." : "You're on the list. See you there!"); }}>{state.joined.includes(event.id) ? "Cancel demo RSVP" : "Count me in"}{state.joined.includes(event.id) ? <Check size={15} /> : <ArrowRight size={15} />}</button></div>}
      {modal.kind === "notifications" && <div {...stylex.props(formStyles.form)}>{[{ title: "Your work caught someone's eye", text: "Nova Systems shortlisted your demo application.", when: "2 hours ago" }, { title: "A new match worth exploring", text: "Orbit Labs is looking for your design skills.", when: "5 hours ago" }, { title: "Your next connection is waiting", text: "The October builders meetup is on your radar.", when: "Yesterday" }].map(n => <div key={n.title} {...stylex.props(s.notification)}><span {...stylex.props(ui.logo, ui.pink)}><Bell size={17} /></span><div><h3 {...stylex.props(s.notificationTitle)}>{n.title}</h3><p {...stylex.props(s.notificationText)}>{n.text}</p><span {...stylex.props(ui.caption)}>{n.when}</span></div></div>)}<button {...stylex.props(ui.secondary)} onClick={onWorkspace}>Go to my workspace <ArrowRight size={14} /></button></div>}
      {modal.kind === "about" && <div {...stylex.props(formStyles.form)}><p {...stylex.props(ui.body)}>Zalen connects emerging talent with early-stage startups through real challenges, thoughtful feedback, and work you can be proud of.</p><p {...stylex.props(ui.body, ui.small)}>Explore an opportunity, share your work, build your portfolio, and open the door to a new collaboration.</p><div {...stylex.props(formStyles.summary)}><h3 {...stylex.props(formStyles.subheading)}>You&apos;re exploring a demo workspace</h3><p {...stylex.props(ui.body, ui.small)}>Companies, opportunities, statistics, and events are sample content. Your saved opportunities, applications, projects, and profile edits stay in this browser. No application or RSVP is sent externally.</p></div></div>}
    </div></>}
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
const s = stylex.create({
  overlay: { position: "fixed", inset: 0, zIndex: 50, backgroundColor: "var(--overlay)", backdropFilter: "blur(7px)" },
  content: { position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: "calc(100% - 32px)", maxWidth: 540, maxHeight: "90dvh", overflowY: "auto", backgroundColor: colors.card, border: "1px solid", borderColor: colors.border, borderRadius: 22, padding: { default: 30, "@media (max-width: 600px)": 22 }, zIndex: 51, boxShadow: "var(--shadow)" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 },
  eyebrow: { display: "flex", alignItems: "center", gap: 7, color: colors.primary, fontSize: 9, letterSpacing: "1.5px" },
  title: { fontFamily: "var(--font-display)", fontSize: 28, lineHeight: 1.25, letterSpacing: "-1px", fontWeight: 500 },
  description: { fontSize: 12, color: colors.muted, lineHeight: 1.8, marginTop: 10 },
  body: { marginTop: 24 },
  notification: { display: "flex", alignItems: "flex-start", gap: 14, paddingBottom: 18, borderBottom: "1px solid", borderColor: colors.subtleBorder },
  notificationTitle: { fontSize: 13, fontWeight: 500 }, notificationText: { fontSize: 11, lineHeight: 1.8, color: colors.body, marginBlock: "6px 8px" },
});
