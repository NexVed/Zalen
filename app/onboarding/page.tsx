"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { StepBasicInfo } from "@/components/onboarding/StepBasicInfo";
import { StepRoleSelection } from "@/components/onboarding/StepRoleSelection";
import { StepRoleDetails } from "@/components/onboarding/StepRoleDetails";
import { StepSkills } from "@/components/onboarding/StepSkills";
import { StepPortfolio } from "@/components/onboarding/StepPortfolio";
import { StepReview } from "@/components/onboarding/StepReview";
import type {
  OnboardingFormData,
  BasicInfoData,
  SkillEntry,
  ProjectEntry,
  AchievementEntry,
} from "@/lib/onboarding-types";
import styles from "./OnboardingPage.module.css";

const TOTAL_STEPS = 6;

const STEP_LABELS = [
  "Basic Info",
  "Your Role",
  "Role Details",
  "Skills",
  "Portfolio",
  "Review",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _api = api as any;

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { user: clerkUser } = useUser();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingFormData>({});
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [achievements, setAchievements] = useState<AchievementEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Convex queries
  const onboardingStatus = useQuery(
    isAuthenticated ? _api.profile.getOnboardingStatus : "skip",
  ) as { completed: boolean; currentStep: number } | null | undefined;

  const profileData = useQuery(
    isAuthenticated ? _api.profile.getMyProfile : "skip",
  ) as Record<string, unknown> | null | undefined;

  // Convex mutations
  const saveBasicInfo = useMutation(api.profile.saveBasicInfo);
  const saveRoleSelection = useMutation(api.profile.saveRoleSelection);
  const saveRoleDetails = useMutation(api.profile.saveRoleDetails);
  const saveSkills = useMutation(api.profile.saveSkills);
  const upsertPortfolioProject = useMutation(api.profile.upsertPortfolioProject);
  const deletePortfolioProject = useMutation(api.profile.deletePortfolioProject);
  const upsertAchievement = useMutation(api.profile.upsertAchievement);
  const deleteAchievement = useMutation(api.profile.deleteAchievement);
  const advanceOnboardingStep = useMutation(api.profile.advanceOnboardingStep);
  const completeOnboarding = useMutation(api.profile.completeOnboarding);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/sign-up");
    }
  }, [authLoading, isAuthenticated, router]);

  // Redirect if already completed
  useEffect(() => {
    if (onboardingStatus?.completed) {
      router.replace("/");
    }
  }, [onboardingStatus, router]);

  // Restore saved state from existing profile (runs once when profileData loads)
  useEffect(() => {
    if (!profileData) return;
    const pd = profileData as {
      profile?: Record<string, unknown>;
      skills?: { name: string; category?: string; proficiency?: string }[];
      projects?: ({ _id: string } & Record<string, unknown>)[];
      achievements?: ({ _id: string } & Record<string, unknown>)[];
      roleDetails?: { role: string; data: Record<string, unknown> }[];
      onboarding?: { currentStep?: number };
    };

    // Build the full updated formData in one pass
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData(prev => {
      let next = { ...prev };
      if (pd.profile) {
        const p = pd.profile;
        next = {
          ...next,
          basicInfo: {
            phone: p.phone as string | undefined,
            phoneCountryCode: p.phoneCountryCode as string | undefined,
            bio: p.bio as string | undefined,
            location: p.location as string | undefined,
          },
          role: (p.primaryRole as string | undefined) ?? prev.role,
        };
      }
      if (pd.roleDetails && pd.roleDetails.length > 0) {
        next = { ...next, roleDetails: pd.roleDetails[0]?.data };
      }
      if (pd.skills && pd.skills.length > 0) {
        next = { ...next, skills: pd.skills as SkillEntry[] };
      }
      return next;
    });

    if (pd.projects && pd.projects.length > 0) {
      setProjects(
        pd.projects.map(p => ({
          id: p._id,
          title: p.title as string,
          summary: p.summary as string | undefined,
          category: p.category as string | undefined,
          skills: p.skills as string[] | undefined,
          role: p.role as string | undefined,
          status: p.status as string | undefined,
          liveUrl: p.liveUrl as string | undefined,
          repoUrl: p.repoUrl as string | undefined,
          visibility: p.visibility as string | undefined,
        })),
      );
    }

    if (pd.achievements && pd.achievements.length > 0) {
      setAchievements(
        pd.achievements.map(a => ({
          id: a._id,
          title: a.title as string,
          category: a.category as string | undefined,
          issuingOrg: a.issuingOrg as string | undefined,
          dateAchieved: a.dateAchieved as string | undefined,
          description: a.description as string | undefined,
          credentialUrl: a.credentialUrl as string | undefined,
          visibility: a.visibility as string | undefined,
        })),
      );
    }

    // Restore current step (but don't go past review)
    if (pd.onboarding?.currentStep && pd.onboarding.currentStep > 1) {
      setCurrentStep(Math.min(pd.onboarding.currentStep, TOTAL_STEPS));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileData !== undefined]);

  // ── Step handlers ──

  async function handleStep1Next(data: BasicInfoData) {
    setIsSaving(true);
    try {
      await saveBasicInfo({
        phone: data.phone,
        phoneCountryCode: data.phoneCountryCode,
        bio: data.bio,
        location: data.location,
      });
      await advanceOnboardingStep({ step: 2, stepData: data });
      setFormData(prev => ({ ...prev, basicInfo: data }));
      setCurrentStep(2);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStep2Next(role: string) {
    setIsSaving(true);
    try {
      await saveRoleSelection({ primaryRole: role });
      await advanceOnboardingStep({ step: 3, stepData: { role } });
      setFormData(prev => ({ ...prev, role }));
      setCurrentStep(3);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStep3Next(data: Record<string, unknown>) {
    setIsSaving(true);
    try {
      if (formData.role) {
        await saveRoleDetails({ role: formData.role, data });
      }
      await advanceOnboardingStep({ step: 4, stepData: data });
      setFormData(prev => ({ ...prev, roleDetails: data }));
      setCurrentStep(4);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStep4Next(skills: SkillEntry[]) {
    setIsSaving(true);
    try {
      await saveSkills({ skills });
      await advanceOnboardingStep({ step: 5, stepData: { skillCount: skills.length } });
      setFormData(prev => ({ ...prev, skills }));
      setCurrentStep(5);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddProject(project: ProjectEntry) {
    const id = await upsertPortfolioProject({
      title: project.title,
      summary: project.summary,
      category: project.category,
      skills: project.skills,
      role: project.role,
      status: project.status,
      liveUrl: project.liveUrl,
      repoUrl: project.repoUrl,
      visibility: project.visibility,
    });
    setProjects(prev => [...prev, { ...project, id: id as string }]);
  }

  async function handleDeleteProject(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await deletePortfolioProject({ projectId: id as any });
    setProjects(prev => prev.filter(p => p.id !== id));
  }

  async function handleAddAchievement(achievement: AchievementEntry) {
    const id = await upsertAchievement({
      title: achievement.title,
      category: achievement.category,
      issuingOrg: achievement.issuingOrg,
      dateAchieved: achievement.dateAchieved,
      description: achievement.description,
      credentialUrl: achievement.credentialUrl,
      visibility: achievement.visibility,
    });
    setAchievements(prev => [...prev, { ...achievement, id: id as string }]);
  }

  async function handleDeleteAchievement(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await deleteAchievement({ achievementId: id as any });
    setAchievements(prev => prev.filter(a => a.id !== id));
  }

  async function handleStep5Next() {
    await advanceOnboardingStep({ step: 6 });
    setCurrentStep(6);
  }

  async function handleComplete() {
    setIsSaving(true);
    try {
      await completeOnboarding();
      router.replace("/");
    } finally {
      setIsSaving(false);
    }
  }

  // ── Loading / auth state ──

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingSpinner} role="status" aria-label="Loading…" />
      </div>
    );
  }

  if (onboardingStatus === undefined) {
    // Still loading from Convex
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingSpinner} role="status" aria-label="Loading profile…" />
      </div>
    );
  }

  const progressPct = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;

  return (
    <main className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <span className={styles.brand}>zalen</span>
        <div className={styles.stepMeta}>
          <span className={styles.stepCount}>Step {currentStep} of {TOTAL_STEPS}</span>
          <span className={styles.stepName}>{STEP_LABELS[currentStep - 1]}</span>
        </div>
      </header>

      {/* Progress */}
      <div className={styles.progressBar} role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={TOTAL_STEPS}>
        <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
      </div>

      {/* Breadcrumb steps */}
      <div className={styles.stepDots} aria-hidden="true">
        {STEP_LABELS.map((label, i) => (
          <div
            key={label}
            className={[
              styles.stepDot,
              i + 1 < currentStep ? styles.stepDotDone : "",
              i + 1 === currentStep ? styles.stepDotActive : "",
            ].join(" ")}
            title={label}
          />
        ))}
      </div>

      {/* Content card */}
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h1 className={styles.stepTitle}>{STEP_LABELS[currentStep - 1]}</h1>
          <p className={styles.stepSubtitle}>
            {currentStep === 1 && "Tell us a bit about yourself."}
            {currentStep === 2 && "Choose the role that describes you best."}
            {currentStep === 3 && "Share your background details."}
            {currentStep === 4 && "Add your skills and areas of expertise."}
            {currentStep === 5 && "Showcase your projects and achievements."}
            {currentStep === 6 && "Review your profile and complete setup."}
          </p>
        </div>

        <div className={styles.stepContent}>
          {currentStep === 1 && (
            <StepBasicInfo
              data={formData.basicInfo ?? {}}
              onChange={data => setFormData(prev => ({ ...prev, basicInfo: data }))}
              onNext={handleStep1Next}
              clerkUser={clerkUser ?? null}
              isLoading={isSaving}
            />
          )}
          {currentStep === 2 && (
            <StepRoleSelection
              selectedRole={formData.role ?? ""}
              onChange={role => setFormData(prev => ({ ...prev, role }))}
              onNext={handleStep2Next}
              onBack={() => setCurrentStep(1)}
              isLoading={isSaving}
            />
          )}
          {currentStep === 3 && (
            <StepRoleDetails
              role={formData.role ?? ""}
              data={formData.roleDetails ?? {}}
              onChange={data => setFormData(prev => ({ ...prev, roleDetails: data }))}
              onNext={handleStep3Next}
              onBack={() => setCurrentStep(2)}
              isLoading={isSaving}
            />
          )}
          {currentStep === 4 && (
            <StepSkills
              skills={formData.skills ?? []}
              onChange={skills => setFormData(prev => ({ ...prev, skills }))}
              onNext={handleStep4Next}
              onBack={() => setCurrentStep(3)}
              isLoading={isSaving}
            />
          )}
          {currentStep === 5 && (
            <StepPortfolio
              projects={projects}
              achievements={achievements}
              onAddProject={handleAddProject}
              onDeleteProject={handleDeleteProject}
              onAddAchievement={handleAddAchievement}
              onDeleteAchievement={handleDeleteAchievement}
              onNext={handleStep5Next}
              onBack={() => setCurrentStep(4)}
              isLoading={isSaving}
            />
          )}
          {currentStep === 6 && (
            <StepReview
              formData={formData}
              projects={projects}
              achievements={achievements}
              onComplete={handleComplete}
              onBack={() => setCurrentStep(5)}
              onEditStep={setCurrentStep}
              isLoading={isSaving}
              clerkUser={clerkUser ?? null}
            />
          )}
        </div>
      </section>
    </main>
  );
}
