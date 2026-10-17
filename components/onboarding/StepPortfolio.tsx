"use client";
import { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { Plus, Trash2, ExternalLink, GitBranch, ChevronUp } from "lucide-react";
import { colors } from "@/styles/tokens.stylex";
import { ui } from "@/components/dashboard/ui";
import { formStyles } from "@/components/dashboard/forms";
import type { ProjectEntry, AchievementEntry } from "@/lib/onboarding-types";

interface StepPortfolioProps {
  projects: ProjectEntry[];
  achievements: AchievementEntry[];
  onAddProject: (project: ProjectEntry) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onAddAchievement: (achievement: AchievementEntry) => Promise<void>;
  onDeleteAchievement: (id: string) => Promise<void>;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
}

const emptyProject: Omit<ProjectEntry, "id"> = {
  title: "",
  summary: "",
  category: "",
  skills: [],
  role: "",
  status: "completed",
  liveUrl: "",
  repoUrl: "",
  visibility: "public",
};

const emptyAchievement: Omit<AchievementEntry, "id"> = {
  title: "",
  category: "competition",
  issuingOrg: "",
  dateAchieved: "",
  description: "",
  credentialUrl: "",
  visibility: "public",
};

export function StepPortfolio({
  projects,
  achievements,
  onAddProject,
  onDeleteProject,
  onAddAchievement,
  onDeleteAchievement,
  onNext,
  onBack,
  isLoading,
}: StepPortfolioProps) {
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectForm, setProjectForm] = useState({ ...emptyProject });
  const [projectSubmitting, setProjectSubmitting] = useState(false);

  const [showAchievementForm, setShowAchievementForm] = useState(false);
  const [achievementForm, setAchievementForm] = useState({ ...emptyAchievement });
  const [achievementSubmitting, setAchievementSubmitting] = useState(false);

  async function handleAddProject(e: React.FormEvent) {
    e.preventDefault();
    if (!projectForm.title.trim()) return;
    setProjectSubmitting(true);
    try {
      await onAddProject({
        ...projectForm,
        skills: projectForm.skills && typeof projectForm.skills === "string"
          ? (projectForm.skills as unknown as string).split(",").map(s => s.trim()).filter(Boolean)
          : projectForm.skills,
      });
      setProjectForm({ ...emptyProject });
      setShowProjectForm(false);
    } finally {
      setProjectSubmitting(false);
    }
  }

  async function handleDeleteProject(id: string) {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    await onDeleteProject(id);
  }

  async function handleAddAchievement(e: React.FormEvent) {
    e.preventDefault();
    if (!achievementForm.title.trim()) return;
    setAchievementSubmitting(true);
    try {
      await onAddAchievement(achievementForm);
      setAchievementForm({ ...emptyAchievement });
      setShowAchievementForm(false);
    } finally {
      setAchievementSubmitting(false);
    }
  }

  async function handleDeleteAchievement(id: string) {
    if (!window.confirm("Delete this achievement? This cannot be undone.")) return;
    await onDeleteAchievement(id);
  }

  return (
    <div {...stylex.props(s.container)}>
      <p {...stylex.props(s.description)}>
        Showcase your work. Both sections are optional — you can add more later from your profile.
      </p>

      {/* ── Projects ── */}
      <section {...stylex.props(s.section)}>
        <div {...stylex.props(s.sectionHeader)}>
          <div>
            <h3 {...stylex.props(s.sectionTitle)}>Portfolio projects</h3>
            <p {...stylex.props(s.sectionSubtitle)}>Highlight your best work.</p>
          </div>
          <button
            type="button"
            {...stylex.props(ui.secondary, s.addBtn)}
            onClick={() => setShowProjectForm(v => !v)}
          >
            {showProjectForm ? <ChevronUp size={14} /> : <Plus size={14} />}
            {showProjectForm ? "Cancel" : "Add project"}
          </button>
        </div>

        {/* Add project form */}
        {showProjectForm && (
          <form {...stylex.props(s.inlineForm)} onSubmit={handleAddProject}>
            <div {...stylex.props(formStyles.twoColumns)}>
              <label {...stylex.props(ui.label)}>
                Title *
                <input
                  {...stylex.props(ui.input)}
                  required
                  value={projectForm.title}
                  onChange={e => setProjectForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="My awesome project"
                />
              </label>
              <label {...stylex.props(ui.label)}>
                Category
                <input
                  {...stylex.props(ui.input)}
                  value={projectForm.category ?? ""}
                  onChange={e => setProjectForm(f => ({ ...f, category: e.target.value }))}
                  placeholder="Web app, Mobile, Design…"
                />
              </label>
            </div>
            <label {...stylex.props(ui.label)}>
              Summary
              <input
                {...stylex.props(ui.input)}
                value={projectForm.summary ?? ""}
                onChange={e => setProjectForm(f => ({ ...f, summary: e.target.value }))}
                placeholder="One-line description"
              />
            </label>
            <div {...stylex.props(formStyles.twoColumns)}>
              <label {...stylex.props(ui.label)}>
                Skills used
                <input
                  {...stylex.props(ui.input)}
                  value={Array.isArray(projectForm.skills) ? projectForm.skills.join(", ") : ""}
                  onChange={e => setProjectForm(f => ({ ...f, skills: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
                  placeholder="React, Figma, Python"
                />
              </label>
              <label {...stylex.props(ui.label)}>
                Your role
                <input
                  {...stylex.props(ui.input)}
                  value={projectForm.role ?? ""}
                  onChange={e => setProjectForm(f => ({ ...f, role: e.target.value }))}
                  placeholder="Solo / Lead developer"
                />
              </label>
            </div>
            <div {...stylex.props(formStyles.twoColumns)}>
              <label {...stylex.props(ui.label)}>
                Status
                <select
                  {...stylex.props(ui.input)}
                  value={projectForm.status ?? "completed"}
                  onChange={e => setProjectForm(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label {...stylex.props(ui.label)}>
                Visibility
                <select
                  {...stylex.props(ui.input)}
                  value={projectForm.visibility ?? "public"}
                  onChange={e => setProjectForm(f => ({ ...f, visibility: e.target.value }))}
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </label>
            </div>
            <div {...stylex.props(formStyles.twoColumns)}>
              <label {...stylex.props(ui.label)}>
                Live URL <span {...stylex.props(ui.caption)}>(optional)</span>
                <input
                  {...stylex.props(ui.input)}
                  type="url"
                  value={projectForm.liveUrl ?? ""}
                  onChange={e => setProjectForm(f => ({ ...f, liveUrl: e.target.value }))}
                  placeholder="https://project.com"
                />
              </label>
              <label {...stylex.props(ui.label)}>
                Repo URL <span {...stylex.props(ui.caption)}>(optional)</span>
                <input
                  {...stylex.props(ui.input)}
                  type="url"
                  value={projectForm.repoUrl ?? ""}
                  onChange={e => setProjectForm(f => ({ ...f, repoUrl: e.target.value }))}
                  placeholder="https://github.com/…"
                />
              </label>
            </div>
            <div {...stylex.props(s.formActions)}>
              <button
                type="submit"
                {...stylex.props(ui.primary)}
                disabled={projectSubmitting}
              >
                {projectSubmitting ? "Saving…" : "Save project"}
              </button>
            </div>
          </form>
        )}

        {/* Saved projects */}
        {projects.length > 0 && (
          <div {...stylex.props(s.cardList)}>
            {projects.map((project, i) => (
              <div key={project.id ?? i} {...stylex.props(s.itemCard)}>
                <div {...stylex.props(s.itemCardHeader)}>
                  <div>
                    <p {...stylex.props(s.itemTitle)}>{project.title}</p>
                    {project.summary && <p {...stylex.props(s.itemDesc)}>{project.summary}</p>}
                    {project.skills && project.skills.length > 0 && (
                      <div {...stylex.props(s.skillTags)}>
                        {project.skills.map(sk => (
                          <span key={sk} {...stylex.props(ui.pill)}>{sk}</span>
                        ))}
                      </div>
                    )}
                    <div {...stylex.props(s.linkRow)}>
                      {project.status && <span {...stylex.props(ui.pill, ui.green)}>{project.status}</span>}
                      {project.liveUrl && (
                        <a href={project.liveUrl} target="_blank" rel="noreferrer" {...stylex.props(s.link)}>
                          <ExternalLink size={12} /> Live
                        </a>
                      )}
                      {project.repoUrl && (
                        <a href={project.repoUrl} target="_blank" rel="noreferrer" {...stylex.props(s.link)}>
                          <GitBranch size={12} /> Repo
                        </a>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    {...stylex.props(s.deleteBtn)}
                    onClick={() => project.id && handleDeleteProject(project.id)}
                    aria-label="Delete project"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <hr {...stylex.props(ui.divider)} />

      {/* ── Achievements ── */}
      <section {...stylex.props(s.section)}>
        <div {...stylex.props(s.sectionHeader)}>
          <div>
            <h3 {...stylex.props(s.sectionTitle)}>Achievements</h3>
            <p {...stylex.props(s.sectionSubtitle)}>Awards, certifications, and milestones.</p>
          </div>
          <button
            type="button"
            {...stylex.props(ui.secondary, s.addBtn)}
            onClick={() => setShowAchievementForm(v => !v)}
          >
            {showAchievementForm ? <ChevronUp size={14} /> : <Plus size={14} />}
            {showAchievementForm ? "Cancel" : "Add achievement"}
          </button>
        </div>

        {/* Add achievement form */}
        {showAchievementForm && (
          <form {...stylex.props(s.inlineForm)} onSubmit={handleAddAchievement}>
            <div {...stylex.props(formStyles.twoColumns)}>
              <label {...stylex.props(ui.label)}>
                Title *
                <input
                  {...stylex.props(ui.input)}
                  required
                  value={achievementForm.title}
                  onChange={e => setAchievementForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="National Hackathon Winner"
                />
              </label>
              <label {...stylex.props(ui.label)}>
                Category
                <select
                  {...stylex.props(ui.input)}
                  value={achievementForm.category ?? "competition"}
                  onChange={e => setAchievementForm(f => ({ ...f, category: e.target.value }))}
                >
                  <option value="competition">Competition</option>
                  <option value="award">Award</option>
                  <option value="certification">Certification</option>
                  <option value="research">Research</option>
                  <option value="publication">Publication</option>
                  <option value="leadership">Leadership</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>
            <div {...stylex.props(formStyles.twoColumns)}>
              <label {...stylex.props(ui.label)}>
                Issuing organisation
                <input
                  {...stylex.props(ui.input)}
                  value={achievementForm.issuingOrg ?? ""}
                  onChange={e => setAchievementForm(f => ({ ...f, issuingOrg: e.target.value }))}
                  placeholder="Google, IEEE…"
                />
              </label>
              <label {...stylex.props(ui.label)}>
                Date achieved
                <input
                  {...stylex.props(ui.input)}
                  type="date"
                  value={achievementForm.dateAchieved ?? ""}
                  onChange={e => setAchievementForm(f => ({ ...f, dateAchieved: e.target.value }))}
                />
              </label>
            </div>
            <label {...stylex.props(ui.label)}>
              Description <span {...stylex.props(ui.caption)}>(optional)</span>
              <textarea
                {...stylex.props(ui.input)}
                rows={2}
                value={achievementForm.description ?? ""}
                onChange={e => setAchievementForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of the achievement…"
              />
            </label>
            <label {...stylex.props(ui.label)}>
              Credential URL <span {...stylex.props(ui.caption)}>(optional)</span>
              <input
                {...stylex.props(ui.input)}
                type="url"
                value={achievementForm.credentialUrl ?? ""}
                onChange={e => setAchievementForm(f => ({ ...f, credentialUrl: e.target.value }))}
                placeholder="https://credential.net/…"
              />
            </label>
            <div {...stylex.props(s.formActions)}>
              <button type="submit" {...stylex.props(ui.primary)} disabled={achievementSubmitting}>
                {achievementSubmitting ? "Saving…" : "Save achievement"}
              </button>
            </div>
          </form>
        )}

        {/* Saved achievements */}
        {achievements.length > 0 && (
          <div {...stylex.props(s.cardList)}>
            {achievements.map((ach, i) => (
              <div key={ach.id ?? i} {...stylex.props(s.itemCard)}>
                <div {...stylex.props(s.itemCardHeader)}>
                  <div>
                    <p {...stylex.props(s.itemTitle)}>{ach.title}</p>
                    {ach.issuingOrg && (
                      <p {...stylex.props(s.itemDesc)}>{ach.issuingOrg}{ach.dateAchieved ? ` · ${ach.dateAchieved}` : ""}</p>
                    )}
                    <div {...stylex.props(s.linkRow)}>
                      {ach.category && <span {...stylex.props(ui.pill, ui.purple)}>{ach.category}</span>}
                      {ach.credentialUrl && (
                        <a href={ach.credentialUrl} target="_blank" rel="noreferrer" {...stylex.props(s.link)}>
                          <ExternalLink size={12} /> Credential
                        </a>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    {...stylex.props(s.deleteBtn)}
                    onClick={() => ach.id && handleDeleteAchievement(ach.id)}
                    aria-label="Delete achievement"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div {...stylex.props(s.actions)}>
        <button type="button" {...stylex.props(ui.secondary)} onClick={onBack}>Back</button>
        <button
          type="button"
          {...stylex.props(ui.primary)}
          onClick={onNext}
          disabled={isLoading}
        >
          Continue
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
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.foreground,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  addBtn: {
    minHeight: 38,
    padding: "8px 14px",
    fontSize: 12,
    flexShrink: 0,
  },
  inlineForm: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    padding: 18,
    borderRadius: 14,
    backgroundColor: colors.elevated,
    border: "1px solid",
    borderColor: colors.border,
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
  },
  cardList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  itemCard: {
    padding: "14px 16px",
    borderRadius: 12,
    backgroundColor: colors.card,
    border: "1px solid",
    borderColor: colors.border,
  },
  itemCardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.foreground,
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 6,
  },
  skillTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 6,
  },
  linkRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  link: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11,
    color: colors.primary,
  },
  deleteBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "transparent",
    color: colors.muted,
    flexShrink: 0,
  },
  actions: {
    display: "flex",
    gap: 12,
    justifyContent: "flex-end",
    paddingTop: 8,
  },
});
