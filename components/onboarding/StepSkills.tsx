"use client";
import { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { X, Plus } from "lucide-react";
import { colors } from "@/styles/tokens.stylex";
import { ui } from "@/components/dashboard/ui";
import type { SkillEntry } from "@/lib/onboarding-types";

interface StepSkillsProps {
  skills: SkillEntry[];
  onChange: (skills: SkillEntry[]) => void;
  onNext: (skills: SkillEntry[]) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

const PREDEFINED_SKILLS = [
  "React", "TypeScript", "Python", "Figma", "Node.js", "SQL",
  "Machine Learning", "UI/UX Design", "Branding", "Data Analysis",
  "Product Management", "Marketing", "Business Development",
  "Content Writing", "Photography", "Video Editing",
  "Android", "iOS", "DevOps", "Docker",
];

const PROFICIENCY_OPTIONS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const MAX_SKILLS = 30;

export function StepSkills({ skills, onChange, onNext, onBack, isLoading }: StepSkillsProps) {
  const [search, setSearch] = useState("");
  const [customSkill, setCustomSkill] = useState("");

  const addedNames = new Set(skills.map(s => s.name.toLowerCase()));

  const filtered = search
    ? PREDEFINED_SKILLS.filter(
        s => s.toLowerCase().includes(search.toLowerCase()) && !addedNames.has(s.toLowerCase())
      )
    : PREDEFINED_SKILLS.filter(s => !addedNames.has(s.toLowerCase()));

  function addSkill(name: string) {
    if (skills.length >= MAX_SKILLS) return;
    if (addedNames.has(name.toLowerCase())) return;
    onChange([...skills, { name }]);
  }

  function removeSkill(name: string) {
    onChange(skills.filter(s => s.name !== name));
  }

  function setProficiency(name: string, proficiency: string) {
    onChange(skills.map(s => s.name === name ? { ...s, proficiency } : s));
  }

  function handleAddCustom() {
    const trimmed = customSkill.trim();
    if (!trimmed || addedNames.has(trimmed.toLowerCase())) return;
    addSkill(trimmed);
    setCustomSkill("");
  }

  async function handleContinue() {
    await onNext(skills);
  }

  return (
    <div {...stylex.props(s.container)}>
      <p {...stylex.props(s.description)}>
        Add skills that represent your expertise. These help match you with relevant opportunities.
      </p>

      {/* Search / filter */}
      <input
        {...stylex.props(ui.input)}
        placeholder="Search skills…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Suggestion pills */}
      {filtered.length > 0 && (
        <div {...stylex.props(s.suggestions)}>
          {filtered.slice(0, 20).map(name => (
            <button
              key={name}
              type="button"
              {...stylex.props(s.suggestionPill)}
              onClick={() => addSkill(name)}
              disabled={skills.length >= MAX_SKILLS}
            >
              <Plus size={10} /> {name}
            </button>
          ))}
        </div>
      )}

      {/* Add custom skill */}
      <div {...stylex.props(s.customRow)}>
        <input
          {...stylex.props(ui.input, s.customInput)}
          placeholder="Add a custom skill…"
          value={customSkill}
          onChange={e => setCustomSkill(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddCustom(); } }}
          maxLength={60}
        />
        <button
          type="button"
          {...stylex.props(ui.secondary, s.addButton)}
          onClick={handleAddCustom}
          disabled={!customSkill.trim() || skills.length >= MAX_SKILLS}
        >
          Add
        </button>
      </div>

      <span {...stylex.props(ui.caption)}>
        {skills.length}/{MAX_SKILLS} skills added.
      </span>

      {/* Added skill tags */}
      {skills.length > 0 && (
        <div {...stylex.props(s.tagList)}>
          {skills.map(skill => (
            <div key={skill.name} {...stylex.props(s.tag)}>
              <span {...stylex.props(s.tagName)}>{skill.name}</span>
              <select
                {...stylex.props(s.profSelect)}
                value={skill.proficiency ?? ""}
                onChange={e => setProficiency(skill.name, e.target.value)}
                aria-label={`Proficiency for ${skill.name}`}
              >
                <option value="">Level</option>
                {PROFICIENCY_OPTIONS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <button
                type="button"
                {...stylex.props(s.removeBtn)}
                onClick={() => removeSkill(skill.name)}
                aria-label={`Remove ${skill.name}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {skills.length === 0 && (
        <p {...stylex.props(s.emptyNote)}>
          No skills added yet. You can skip this step.
        </p>
      )}

      <div {...stylex.props(s.actions)}>
        <button type="button" {...stylex.props(ui.secondary)} onClick={onBack}>Back</button>
        <button type="button" {...stylex.props(ui.primary)} onClick={handleContinue} disabled={isLoading}>
          {isLoading ? "Saving…" : "Continue"}
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
  suggestions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestionPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11,
    padding: "5px 10px",
    borderRadius: 20,
    backgroundColor: colors.elevated,
    color: colors.body,
    border: "1px solid",
    borderColor: colors.border,
    cursor: "pointer",
    transition: "background-color 120ms",
  },
  customRow: {
    display: "flex",
    gap: 8,
  },
  customInput: {
    flex: 1,
  },
  addButton: {
    minHeight: 44,
    padding: "9px 16px",
    flexShrink: 0,
  },
  tagList: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 8px 5px 10px",
    borderRadius: 20,
    backgroundColor: colors.softPink,
    border: "1px solid",
    borderColor: colors.primary,
    fontSize: 12,
  },
  tagName: {
    color: colors.foreground,
    fontWeight: 500,
  },
  profSelect: {
    backgroundColor: "transparent",
    border: "none",
    color: colors.muted,
    fontSize: 11,
    cursor: "pointer",
    paddingInline: 4,
  },
  removeBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 18,
    height: 18,
    borderRadius: "50%",
    backgroundColor: "transparent",
    color: colors.muted,
    padding: 0,
    flexShrink: 0,
  },
  emptyNote: {
    fontSize: 12,
    color: colors.muted,
    fontStyle: "italic",
  },
  actions: {
    display: "flex",
    gap: 12,
    justifyContent: "flex-end",
    marginTop: 8,
  },
});
