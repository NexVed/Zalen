"use client";
import { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { Check, ArrowLeft } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { profileSections, roleData, type ProfileBundle, type ProfileSection } from "@/lib/profile-data";
import type { BasicInfoData, SkillEntry } from "@/lib/onboarding-types";
import { StepBasicInfo } from "./StepBasicInfo";
import { StepRoleSelection } from "./StepRoleSelection";
import { StepRoleDetails } from "./StepRoleDetails";
import { StepSkills } from "./StepSkills";
import { StepPortfolio } from "./StepPortfolio";
import { StepReview } from "./StepReview";
import styles from "./ProfileSystem.module.css";

export function ProfileFlow({ bundle, section, onDone }: { bundle: ProfileBundle; section?: ProfileSection; onDone: (saved?: boolean) => void }) {
  const editing = !!section;
  const { user } = useUser();
  const clerkUser = user ?? { fullName: bundle.user.name, imageUrl: bundle.user.imageUrl, primaryEmailAddress: bundle.user.email ? { emailAddress: bundle.user.email } : null };
  const [step, setStep] = useState(section ? profileSections.findIndex(item => item.id === section) + 1 : Math.max(1, Math.min(6, bundle.onboarding?.currentStep ?? 1)));
  const [basic, setBasic] = useState<BasicInfoData>({ phone: bundle.profile?.phone, phoneCountryCode: bundle.profile?.phoneCountryCode, bio: bundle.profile?.bio, location: bundle.profile?.location });
  const [role, setRole] = useState(bundle.profile?.primaryRole ?? "");
  const [background, setBackground] = useState<Record<string, unknown>>(roleData(bundle.roleDetails.find(item => item.role === bundle.profile?.primaryRole)?.data));
  const [skills, setSkills] = useState<SkillEntry[]>(bundle.skills.map(({ name, category, proficiency }) => ({ name, category, proficiency })));
  const [saving, setSaving] = useState(false); const busy = useRef(false);
  const [error, setError] = useState("");
  const Heading = editing ? "h2" : "h1";
  const heading = useRef<HTMLHeadingElement>(null);
  const saveBasic = useMutation(api.profile.saveBasicInfo); const saveRole = useMutation(api.profile.saveRoleSelection);
  const saveBackground = useMutation(api.profile.saveRoleDetails); const saveSkills = useMutation(api.profile.saveSkills);
  const advance = useMutation(api.profile.advanceOnboardingStep); const complete = useMutation(api.profile.completeOnboarding);
  const addProject = useMutation(api.profile.upsertPortfolioProject); const deleteProject = useMutation(api.profile.deletePortfolioProject);
  const addAchievement = useMutation(api.profile.upsertAchievement); const deleteAchievement = useMutation(api.profile.deleteAchievement);
  const projects = bundle.projects.map(project => ({ id: project._id, title: project.title, summary: project.summary, description: project.description, category: project.category, skills: project.skills, role: project.role, status: project.status, startDate: project.startDate, endDate: project.endDate, liveUrl: project.liveUrl, repoUrl: project.repoUrl, visibility: project.visibility }));
  const achievements = bundle.achievements.map(item => ({ id: item._id, title: item.title, category: item.category, issuingOrg: item.issuingOrg, dateAchieved: item.dateAchieved, description: item.description, credentialUrl: item.credentialUrl, visibility: item.visibility }));
  function go(next: number) { setStep(next); setError(""); requestAnimationFrame(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: "start", behavior: "smooth" }); }); }
  async function commit(action: () => Promise<unknown>, next: number) {
    if (busy.current) return;
    busy.current = true; setSaving(true); setError("");
    try { await action(); if (!editing && next <= 6) await advance({ step: next }); if (editing || next === 7) onDone(true); else go(next); }
    catch { setError("Your changes could not be saved. Check the fields and your connection, then try again."); }
    finally { busy.current = false; setSaving(false); }
  }
  const back = () => editing ? onDone() : go(Math.max(1, step - 1));
  const label = editing ? "Save changes" : "Save & continue";
  return <div className={styles.flow} aria-busy={saving}>
    <aside className={styles.stepRail}><p className={styles.kicker}>{editing ? "Edit profile" : "Profile setup"}</p><h2>{editing ? "Your profile" : "Set up your account"}</h2><p className={styles.caption}>{editing ? "Update a section without repeating onboarding." : "Your saved details stay with your account. Portfolio and contact details are optional."}</p><ol className={styles.steps}>{profileSections.map((item, index) => <li key={item.id}><button aria-label={item.title} disabled={saving || (!editing && index + 1 > step)} aria-current={step === index + 1 ? "step" : undefined} onClick={() => { if (editing) go(index + 1); else if (index + 1 <= step) go(index + 1); }}><span>{!editing && index + 1 < step ? <Check size={14} /> : index + 1}</span><span>{item.title}</span></button></li>)}</ol><p className={styles.caption}>{editing ? "Profile changes are saved to your account." : `Step ${step} of ${profileSections.length}`}</p></aside>
    <section className={styles.editor} aria-labelledby="profile-step-heading"><div className={styles.editorHeading}><div><p className={styles.kicker}>{editing ? "Profile details" : `Step ${step} / ${profileSections.length}`}</p><Heading ref={heading} tabIndex={-1} id="profile-step-heading">{profileSections[step - 1].title}</Heading><p className={styles.description}>{profileSections[step - 1].description}</p></div>{editing && <button className={styles.secondary} disabled={saving} onClick={() => onDone(false)}><ArrowLeft size={15} />Back to profile</button>}</div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.stepBody} key={step}>
        {step === 1 && <StepBasicInfo data={basic} onChange={setBasic} clerkUser={clerkUser} isLoading={saving} submitLabel={label} onNext={data => commit(() => saveBasic({ phone: data.phone, phoneCountryCode: data.phoneCountryCode, bio: data.bio, location: data.location }), 2)} />}
        {step === 2 && <StepRoleSelection selectedRole={role} onChange={value => { setRole(value); setBackground(roleData(bundle.roleDetails.find(item => item.role === value)?.data)); }} isLoading={saving} submitLabel={label} onBack={back} onNext={value => commit(() => saveRole({ primaryRole: value }), 3)} />}
        {step === 3 && <StepRoleDetails role={role} data={background} onChange={setBackground} isLoading={saving} submitLabel={label} onBack={back} onNext={data => commit(() => saveBackground({ role, data: roleData(data) }), 4)} />}
        {step === 4 && <StepSkills skills={skills} onChange={setSkills} isLoading={saving} submitLabel={label} onBack={back} onNext={value => commit(() => saveSkills({ skills: value }), 5)} />}
        {step === 5 && <StepPortfolio projects={projects} achievements={achievements} isLoading={saving} submitLabel={editing ? "Done" : "Continue to review"} onBack={back} onNext={() => void commit(() => Promise.resolve(), 6)} onAddProject={async project => { const fields = { ...project }; delete fields.id; await addProject({ ...fields, projectId: project.id as Id<"portfolioProjects"> | undefined }); }} onDeleteProject={async id => { await deleteProject({ projectId: id as Id<"portfolioProjects"> }); }} onAddAchievement={async item => { const fields = { ...item }; delete fields.id; await addAchievement({ ...fields, achievementId: item.id as Id<"achievements"> | undefined }); }} onDeleteAchievement={async id => { await deleteAchievement({ achievementId: id as Id<"achievements"> }); }} />}
        {step === 6 && <StepReview formData={{ basicInfo: basic, role, roleDetails: background, skills }} projects={projects} achievements={achievements} clerkUser={clerkUser} isLoading={saving} onBack={back} onEditStep={go} onComplete={() => commit(() => complete({}), 7)} />}
      </div>
    </section>
  </div>;
}
