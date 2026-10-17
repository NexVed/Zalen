"use client";
import { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { Pencil, Check, AlertCircle } from "lucide-react";
import { colors } from "@/styles/tokens.stylex";
import { ui } from "@/components/dashboard/ui";
import { ROLES } from "@/lib/onboarding-types";
import type { OnboardingFormData, ProjectEntry, AchievementEntry } from "@/lib/onboarding-types";

interface StepReviewProps {
  formData: OnboardingFormData;
  projects: ProjectEntry[];
  achievements: AchievementEntry[];
  onComplete: () => Promise<void>;
  onBack: () => void;
  onEditStep: (step: number) => void;
  isLoading: boolean;
  clerkUser: {
    fullName?: string | null;
    primaryEmailAddress?: { emailAddress: string } | null;
  } | null;
}

function ReviewCard({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: number;
  onEdit: (step: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div {...stylex.props(s.card)}>
      <div {...stylex.props(s.cardHeader)}>
        <h3 {...stylex.props(s.cardTitle)}>{title}</h3>
        <button
          type="button"
          {...stylex.props(s.editBtn)}
          onClick={() => onEdit(step)}
        >
          <Pencil size={12} /> Edit
        </button>
      </div>
      <div {...stylex.props(s.cardBody)}>{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div {...stylex.props(s.row)}>
      <span {...stylex.props(s.rowLabel)}>{label}</span>
      <span {...stylex.props(s.rowValue)}>{value}</span>
    </div>
  );
}

export function StepReview({
  formData,
  projects,
  achievements,
  onComplete,
  onBack,
  onEditStep,
  isLoading,
  clerkUser,
}: StepReviewProps) {
  const [error, setError] = useState<string | null>(null);

  const roleInfo = ROLES.find(r => r.id === formData.role);
  const basicInfo = formData.basicInfo;
  const skills = formData.skills ?? [];
  const rd = formData.roleDetails ?? {};

  async function handleComplete() {
    setError(null);
    try {
      await onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  function renderRoleDetailRows() {
    const rows: { label: string; value?: string }[] = [];
    if (!rd) return null;
    Object.entries(rd).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        rows.push({ label: key, value: (value as string[]).join(", ") });
      } else if (typeof value === "string" && value) {
        const label = key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
        rows.push({ label, value });
      }
    });
    return rows.slice(0, 8).map(r => <Row key={r.label} label={r.label} value={r.value} />);
  }

  return (
    <div {...stylex.props(s.container)}>
      <p {...stylex.props(s.description)}>
        Review your saved profile details. You can edit any section.
      </p>

      {/* Basic info */}
      <ReviewCard title="Basic info" step={1} onEdit={onEditStep}>
        <Row label="Name" value={clerkUser?.fullName || "—"} />
        <Row label="Email" value={clerkUser?.primaryEmailAddress?.emailAddress} />
        {basicInfo?.phone && (
          <Row label="Phone" value={`${basicInfo.phoneCountryCode ?? ""} ${basicInfo.phone}`} />
        )}
        <Row label="Location" value={basicInfo?.location} />
        {basicInfo?.bio && (
          <p {...stylex.props(s.bioText)}>{basicInfo.bio}</p>
        )}
      </ReviewCard>

      {/* Role */}
      <ReviewCard title="Your role" step={2} onEdit={onEditStep}>
        {roleInfo ? (
          <div {...stylex.props(s.roleDisplay)}>
            <span {...stylex.props(ui.pill, ui.pink)}>{roleInfo.label}</span>
            <p {...stylex.props(s.roleDesc)}>{roleInfo.description}</p>
          </div>
        ) : (
          <p {...stylex.props(s.empty)}>No role selected.</p>
        )}
      </ReviewCard>

      {/* Role details */}
      {Object.keys(rd).length > 0 && (
        <ReviewCard title="Role details" step={3} onEdit={onEditStep}>
          {renderRoleDetailRows()}
        </ReviewCard>
      )}

      {/* Skills */}
      <ReviewCard title="Skills" step={4} onEdit={onEditStep}>
        {skills.length > 0 ? (
          <div {...stylex.props(s.skillTags)}>
            {skills.map(skill => (
              <span key={skill.name} {...stylex.props(ui.pill)}>
                {skill.name}
                {skill.proficiency && (
                  <span {...stylex.props(s.proficiency)}> · {skill.proficiency}</span>
                )}
              </span>
            ))}
          </div>
        ) : (
          <p {...stylex.props(s.empty)}>No skills added.</p>
        )}
      </ReviewCard>

      {/* Portfolio */}
      <ReviewCard title="Portfolio & achievements" step={5} onEdit={onEditStep}>
        <div {...stylex.props(s.countRow)}>
          <div {...stylex.props(s.countItem)}>
            <span {...stylex.props(s.countNum)}>{projects.length}</span>
            <span {...stylex.props(s.countLabel)}>project{projects.length !== 1 ? "s" : ""}</span>
          </div>
          <div {...stylex.props(s.countItem)}>
            <span {...stylex.props(s.countNum)}>{achievements.length}</span>
            <span {...stylex.props(s.countLabel)}>achievement{achievements.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </ReviewCard>

      {/* Error */}
      {error && (
        <div {...stylex.props(s.error)}>
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Actions */}
      <div {...stylex.props(s.actions)}>
        <button type="button" {...stylex.props(ui.secondary)} onClick={onBack}>Back</button>
        <button
          type="button"
          {...stylex.props(ui.primary, s.completeBtn)}
          onClick={handleComplete}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span {...stylex.props(s.spinner)} aria-hidden="true" />
              Completing…
            </>
          ) : (
            <><Check size={15} /> Complete profile</>
          )}
        </button>
      </div>
    </div>
  );
}

const s = stylex.create({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  description: {
    fontSize: 13,
    color: colors.body,
    lineHeight: 1.7,
  },
  card: {
    borderRadius: 12,
    border: "1px solid",
    borderColor: colors.border,
    backgroundColor: colors.elevated,
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    borderBottom: "1px solid",
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.foreground,
  },
  editBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    color: colors.primary,
    backgroundColor: "transparent",
    padding: "4px 0",
  },
  cardBody: {
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  row: {
    display: "flex",
    gap: 12,
    fontSize: 12,
  },
  rowLabel: {
    color: colors.muted,
    flexShrink: 0,
    minWidth: 80,
  },
  rowValue: {
    color: colors.body,
    flex: 1,
  },
  bioText: {
    fontSize: 12,
    color: colors.body,
    lineHeight: 1.7,
    borderTop: "1px solid",
    borderColor: colors.border,
    paddingTop: 8,
    marginTop: 4,
  },
  roleDisplay: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  roleDesc: {
    fontSize: 11,
    color: colors.muted,
    lineHeight: 1.6,
  },
  empty: {
    fontSize: 12,
    color: colors.muted,
    fontStyle: "italic",
  },
  skillTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },
  proficiency: {
    color: colors.muted,
  },
  countRow: {
    display: "flex",
    gap: 24,
  },
  countItem: {
    display: "flex",
    alignItems: "baseline",
    gap: 5,
  },
  countNum: {
    fontSize: 22,
    fontWeight: 700,
    color: colors.foreground,
    fontFamily: "var(--font-display)",
  },
  countLabel: {
    fontSize: 11,
    color: colors.muted,
  },
  error: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 14px",
    borderRadius: 10,
    backgroundColor: colors.softOrange,
    color: colors.warm,
    fontSize: 12,
    lineHeight: 1.5,
  },
  actions: {
    display: "flex",
    gap: 12,
    justifyContent: "flex-end",
    paddingTop: 8,
  },
  completeBtn: {
    minWidth: 160,
  },
  spinner: {
    display: "inline-block",
    width: 14,
    height: 14,
    border: "2px solid",
    borderColor: colors.primaryForeground,
    borderTopColor: "transparent",
    borderRadius: "50%",
    animationName: "spin",
    animationDuration: "0.6s",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
  },
});
