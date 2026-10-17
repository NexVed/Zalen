"use client";
import * as stylex from "@stylexjs/stylex";
import {
  GraduationCap, Briefcase, Rocket, Users, Building2,
  Zap, Award, Landmark,
} from "lucide-react";
import { colors } from "@/styles/tokens.stylex";
import { ui } from "@/components/dashboard/ui";
import { ROLES } from "@/lib/onboarding-types";

interface StepRoleSelectionProps {
  selectedRole: string;
  onChange: (role: string) => void;
  onNext: (role: string) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  submitLabel?: string;
}

const roleIcons: Record<string, React.ElementType> = {
  student: GraduationCap,
  graduate: Briefcase,
  founder: Rocket,
  recruiter: Users,
  business: Building2,
  freelancer: Zap,
  mentor: Award,
  institution: Landmark,
};

export function StepRoleSelection({ selectedRole, onChange, onNext, onBack, isLoading, submitLabel = "Save & continue" }: StepRoleSelectionProps) {
  async function handleContinue() {
    if (!selectedRole) return;
    await onNext(selectedRole);
  }

  return (
    <div {...stylex.props(s.container)}>
      <p {...stylex.props(s.description)}>
        Choose the role that best describes you. This helps us personalise your experience.
      </p>

      <div {...stylex.props(s.grid)}>
        {ROLES.map(role => {
          const Icon = roleIcons[role.id] ?? GraduationCap;
          const isSelected = selectedRole === role.id;
          return (
            <button
              key={role.id}
              type="button"
              aria-pressed={isSelected}
              disabled={isLoading}
              onClick={() => onChange(role.id)}
              {...stylex.props(s.card, isSelected && s.cardSelected)}
            >
              <span {...stylex.props(s.iconWrap, isSelected && s.iconWrapSelected)}>
                <Icon size={22} />
              </span>
              <span {...stylex.props(s.roleName)}>{role.label}</span>
              <span {...stylex.props(s.roleDesc)}>{role.description}</span>
            </button>
          );
        })}
      </div>

      <div {...stylex.props(s.actions)}>
        <button type="button" {...stylex.props(ui.secondary)} onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          {...stylex.props(ui.primary)}
          onClick={handleContinue}
          disabled={!selectedRole || isLoading}
        >
          {isLoading ? "Saving…" : submitLabel}
        </button>
      </div>
    </div>
  );
}

const s = stylex.create({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  description: {
    fontSize: 13,
    color: colors.body,
    lineHeight: 1.7,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: { default: "repeat(2, minmax(0, 1fr))", "@media (max-width: 480px)": "1fr" },
    gap: 12,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    padding: "16px",
    borderRadius: 14,
    backgroundColor: colors.card,
    border: "2px solid",
    borderColor: colors.border,
    cursor: "pointer",
    textAlign: "left",
    transition: "border-color 150ms, background-color 150ms",
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.softPink,
  },
  iconWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.elevated,
    color: colors.body,
    flexShrink: 0,
  },
  iconWrapSelected: {
    backgroundColor: colors.primary,
    color: colors.primaryForeground,
  },
  roleName: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.foreground,
    lineHeight: 1.4,
  },
  roleDesc: {
    fontSize: 11,
    color: colors.muted,
    lineHeight: 1.6,
  },
  actions: {
    display: "flex",
    gap: 12,
    justifyContent: "flex-end",
  },
});
