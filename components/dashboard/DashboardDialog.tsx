"use client";
import * as Dialog from "@radix-ui/react-dialog";
import * as stylex from "@stylexjs/stylex";
import { ArrowRight, Bell, CalendarDays, Check, MapPin, X } from "lucide-react";
import { type DemoState, type Opportunity, type OpportunityType, events } from "@/lib/demo-data";
import { colors } from "@/styles/tokens.stylex";
import { ui } from "./ui";
import { ApplicationForm, PortfolioForm, PostOpportunityForm, ProfileForm, formStyles } from "./forms";

export type Modal = { kind: "profile" | "portfolio" | "post" | "notifications" | "about" } | { kind: "apply"; item: Opportunity } | { kind: "event"; id: string } | null;
const titles = { profile: "Edit profile", portfolio: "Add portfolio project", post: "Post an opportunity", notifications: "Notifications", about: "About Zalen", apply: "Apply for this opportunity", event: "Event details" };
const descriptions = { profile: "Update your name, skills, and portfolio link.", portfolio: "Add a project description and link to your work.", post: "Set the requirements, deliverables, and budget.", notifications: "Updates from your workspace will appear here.", about: "About this Zalen workspace.", apply: "Review the brief and enter your application details.", event: "Review the schedule, location, and RSVP details." };

export function DashboardDialog({ modal, onClose, state, update, onDone, onWorkspace, postingType, signedIn, onSignIn }: {
  modal: Modal; onClose: () => void; state: DemoState; update: (fn: (state: DemoState) => DemoState) => void;
  onDone: (message: string) => void; onWorkspace: () => void;
  postingType?: OpportunityType; signedIn: boolean; onSignIn: () => void;
}) {
  const event = modal?.kind === "event" ? events.find(e => e.id === modal.id) : null;
  return <Dialog.Root open={modal !== null} onOpenChange={open => { if (!open) onClose(); }}><Dialog.Portal><Dialog.Overlay {...stylex.props(s.overlay)} /><Dialog.Content {...stylex.props(s.content)}>
    {modal && <><div {...stylex.props(s.header)}><span {...stylex.props(s.eyebrow)}>Zalen</span><Dialog.Close {...stylex.props(ui.iconButton)} aria-label="Close dialog"><X size={18} /></Dialog.Close></div><Dialog.Title {...stylex.props(s.title)}>{titles[modal.kind]}</Dialog.Title><Dialog.Description {...stylex.props(s.description)}>{descriptions[modal.kind]}</Dialog.Description><div {...stylex.props(s.body)}>
      {modal.kind === "profile" && <ProfileForm profile={state.profile} onSave={profile => { update(s => ({ ...s, profile })); onDone("Profile saved."); }} />}
      {modal.kind === "portfolio" && <PortfolioForm onSave={project => { update(s => ({ ...s, portfolio: [...s.portfolio, project] })); onDone("Project added."); }} />}
      {modal.kind === "post" && <PostOpportunityForm category={postingType} onSave={item => { update(s => ({ ...s, customOpportunities: [...s.customOpportunities, item] })); onDone("Your demo opportunity is ready to explore."); }} />}
      {modal.kind === "apply" && <ApplicationForm item={modal.item} state={state} onSubmit={(note, link) => { update(s => s.applications.some(a => a.opportunityId === modal.item.id) ? s : ({ ...s, applications: [...s.applications, { opportunityId: modal.item.id, status: "Submitted", note, link }] })); onDone("Application saved. Find it in My workspace."); }} />}
      {modal.kind === "event" && event && <div {...stylex.props(formStyles.form)}><span {...stylex.props(ui.pill, ui[event.tone])}>{event.kind}</span><h3 {...stylex.props(ui.heading)}>{event.title}</h3><p {...stylex.props(ui.body, ui.small)}>{event.description}</p><span {...stylex.props(ui.row, ui.small)}><CalendarDays size={15} />{event.time}</span><span {...stylex.props(ui.row, ui.small)}><MapPin size={15} />{event.location}</span><p {...stylex.props(ui.caption)}>Sample event · Your RSVP is saved only in this demo workspace.</p><button {...stylex.props(ui.primary)} onClick={() => { if (!signedIn) { onSignIn(); return; } const joined = state.joined.includes(event.id); update(s => ({ ...s, joined: joined ? s.joined.filter(id => id !== event.id) : [...s.joined, event.id] })); onDone(joined ? "Your demo RSVP has been cancelled." : "You're on the list. See you there!"); }}>{!signedIn ? "Sign in to RSVP" : state.joined.includes(event.id) ? "Cancel demo RSVP" : "Count me in"}{state.joined.includes(event.id) ? <Check size={15} /> : <ArrowRight size={15} />}</button></div>}
      {modal.kind === "notifications" && <div {...stylex.props(formStyles.form)}><div {...stylex.props(ui.empty)}><Bell size={24} /><h3 {...stylex.props(s.notificationTitle)}>You’re all caught up.</h3><p {...stylex.props(ui.body, ui.small)}>No notifications yet.</p></div><button {...stylex.props(ui.secondary)} onClick={onWorkspace}>Go to my workspace <ArrowRight size={14} /></button></div>}
      {modal.kind === "about" && <div {...stylex.props(formStyles.form)}><p {...stylex.props(ui.body)}>Zalen includes startup challenges, freelance gigs, local business discovery, investor profiles, and community discussions.</p><p {...stylex.props(ui.body, ui.small)}>Browse opportunities, save projects, and manage applications in your workspace.</p><div {...stylex.props(formStyles.summary)}><h3 {...stylex.props(formStyles.subheading)}>You&apos;re exploring a demo workspace</h3><p {...stylex.props(ui.body, ui.small)}>Companies, opportunities, statistics, and events are sample content. Your workspace starts empty. Activity you add is saved on this device, separately for each signed-in account. No application or RSVP is sent externally.</p></div></div>}
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
