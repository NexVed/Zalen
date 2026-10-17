"use client";
import Link from "next/link";
import * as stylex from "@stylexjs/stylex";
import { useConvexAuth, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { MapPin, Mail, Phone, ExternalLink, GitBranch, User } from "lucide-react";
import { colors } from "@/styles/tokens.stylex";
import { ui } from "./ui";
import { ROLES } from "@/lib/onboarding-types";

interface ProfileProps {
  userId: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _api = api as any;

type ProfileBundle = {
  user: { clerkUserId: string };
  profile: {
    phone?: string;
    phoneCountryCode?: string;
    bio?: string;
    location?: string;
    primaryRole?: string;
  } | null;
  skills: { name: string; proficiency?: string }[];
  projects: {
    _id: string;
    title: string;
    summary?: string;
    skills?: string[];
    status?: string;
    liveUrl?: string;
    repoUrl?: string;
    category?: string;
    role?: string;
  }[];
  achievements: {
    _id: string;
    title: string;
    category?: string;
    issuingOrg?: string;
    dateAchieved?: string;
    credentialUrl?: string;
  }[];
  roleDetails: { role: string; data: Record<string, unknown> }[];
  onboarding: { completed: boolean } | null;
} | null;

export function Profile({ userId }: ProfileProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { user: clerkUser } = useUser();

  const profileBundle = useQuery(
    isAuthenticated ? _api.profile.getMyProfile : "skip",
  ) as ProfileBundle | undefined;

  if (isLoading) {
    return (
      <div {...stylex.props(s.loading)}>
        <span {...stylex.props(s.loadingSpinner)} role="status" aria-label="Loading profile…" />
      </div>
    );
  }

  if (!isAuthenticated || !userId) {
    return (
      <div {...stylex.props(ui.empty)}>
        <User size={36} strokeWidth={1.2} />
        <p {...stylex.props(ui.body)}>Sign in to view your profile.</p>
        <Link href="/sign-in" {...stylex.props(ui.primary)}>Sign in</Link>
      </div>
    );
  }

  if (profileBundle === undefined) {
    return (
      <div {...stylex.props(s.loading)}>
        <span {...stylex.props(s.loadingSpinner)} role="status" aria-label="Loading profile…" />
      </div>
    );
  }

  if (!profileBundle?.onboarding?.completed) {
    return (
      <div {...stylex.props(ui.empty)}>
        <User size={36} strokeWidth={1.2} />
        <p {...stylex.props(ui.body)}>Complete your profile to show it here.</p>
        <Link href="/onboarding" {...stylex.props(ui.primary)}>Complete onboarding</Link>
      </div>
    );
  }

  const { profile, skills, projects, achievements, roleDetails } = profileBundle;
  const roleInfo = ROLES.find(r => r.id === profile?.primaryRole);

  const initials = clerkUser?.fullName
    ? clerkUser.fullName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div {...stylex.props(s.container)}>
      {/* ── Profile header ── */}
      <div {...stylex.props(ui.card, s.profileCard)}>
        <div {...stylex.props(s.profileHeader)}>
          {/* Avatar */}
          <div {...stylex.props(s.avatar)}>
            <span {...stylex.props(s.avatarInitials)}>{initials}</span>
          </div>

          {/* Identity */}
          <div {...stylex.props(s.identity)}>
            <div {...stylex.props(s.nameRow)}>
              <h2 {...stylex.props(s.name)}>{clerkUser?.fullName ?? "—"}</h2>
              {roleInfo && (
                <span {...stylex.props(ui.pill, ui.pink)}>{roleInfo.label}</span>
              )}
            </div>
            {clerkUser?.primaryEmailAddress?.emailAddress && (
              <span {...stylex.props(s.metaRow)}>
                <Mail size={12} />
                {clerkUser.primaryEmailAddress.emailAddress}
              </span>
            )}
            {profile?.phone && (
              <span {...stylex.props(s.metaRow)}>
                <Phone size={12} />
                {profile.phoneCountryCode ?? ""} {profile.phone}
              </span>
            )}
            {profile?.location && (
              <span {...stylex.props(s.metaRow)}>
                <MapPin size={12} />
                {profile.location}
              </span>
            )}
          </div>

          {/* Edit button */}
          <Link href="/onboarding" {...stylex.props(ui.secondary, s.editBtn)}>
            Edit profile
          </Link>
        </div>

        {profile?.bio && (
          <p {...stylex.props(s.bio)}>{profile.bio}</p>
        )}
      </div>

      {/* ── Skills ── */}
      {skills.length > 0 && (
        <div {...stylex.props(ui.card, s.section)}>
          <div {...stylex.props(s.sectionHeader)}>
            <h3 {...stylex.props(s.sectionTitle)}>Skills</h3>
            <Link href="/onboarding" {...stylex.props(s.sectionEdit)}>Edit</Link>
          </div>
          <div {...stylex.props(s.tagRow)}>
            {skills.map(skill => (
              <span key={skill.name} {...stylex.props(ui.pill)}>
                {skill.name}
                {skill.proficiency && (
                  <span {...stylex.props(s.proficiency)}> · {skill.proficiency}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Role details ── */}
      {roleDetails.length > 0 && (
        <div {...stylex.props(ui.card, s.section)}>
          <div {...stylex.props(s.sectionHeader)}>
            <h3 {...stylex.props(s.sectionTitle)}>Background</h3>
            <Link href="/onboarding" {...stylex.props(s.sectionEdit)}>Edit</Link>
          </div>
          <div {...stylex.props(s.detailGrid)}>
            {Object.entries(roleDetails[0]?.data ?? {})
              .filter(([, v]) => typeof v === "string" && v)
              .slice(0, 6)
              .map(([key, value]) => (
                <div key={key} {...stylex.props(s.detailRow)}>
                  <span {...stylex.props(s.detailLabel)}>
                    {key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}
                  </span>
                  <span {...stylex.props(s.detailValue)}>{value as string}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Portfolio projects ── */}
      {projects.length > 0 && (
        <div {...stylex.props(ui.card, s.section)}>
          <div {...stylex.props(s.sectionHeader)}>
            <h3 {...stylex.props(s.sectionTitle)}>Portfolio</h3>
            <Link href="/onboarding" {...stylex.props(s.sectionEdit)}>Add / edit</Link>
          </div>
          <div {...stylex.props(s.projectList)}>
            {projects.map(project => (
              <div key={project._id} {...stylex.props(s.projectCard)}>
                <div {...stylex.props(s.projectTop)}>
                  <p {...stylex.props(s.projectTitle)}>{project.title}</p>
                  <div {...stylex.props(s.projectLinks)}>
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
                {project.summary && (
                  <p {...stylex.props(s.projectSummary)}>{project.summary}</p>
                )}
                {project.skills && project.skills.length > 0 && (
                  <div {...stylex.props(s.tagRow)}>
                    {project.skills.map(sk => (
                      <span key={sk} {...stylex.props(ui.pill)}>{sk}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Achievements ── */}
      {achievements.length > 0 && (
        <div {...stylex.props(ui.card, s.section)}>
          <div {...stylex.props(s.sectionHeader)}>
            <h3 {...stylex.props(s.sectionTitle)}>Achievements</h3>
            <Link href="/onboarding" {...stylex.props(s.sectionEdit)}>Add / edit</Link>
          </div>
          <div {...stylex.props(s.projectList)}>
            {achievements.map(ach => (
              <div key={ach._id} {...stylex.props(s.projectCard)}>
                <div {...stylex.props(s.projectTop)}>
                  <p {...stylex.props(s.projectTitle)}>{ach.title}</p>
                  {ach.credentialUrl && (
                    <a href={ach.credentialUrl} target="_blank" rel="noreferrer" {...stylex.props(s.link)}>
                      <ExternalLink size={12} /> Credential
                    </a>
                  )}
                </div>
                {ach.issuingOrg && (
                  <p {...stylex.props(s.projectSummary)}>
                    {ach.issuingOrg}
                    {ach.dateAchieved ? ` · ${ach.dateAchieved}` : ""}
                  </p>
                )}
                {ach.category && (
                  <div {...stylex.props(s.tagRow)}>
                    <span {...stylex.props(ui.pill, ui.purple)}>{ach.category}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const s = stylex.create({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    maxWidth: 720,
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  loadingSpinner: {
    display: "inline-block",
    width: 28,
    height: 28,
    border: "3px solid",
    borderColor: colors.border,
    borderTopColor: colors.primary,
    borderRadius: "50%",
    animationName: "spin",
    animationDuration: "0.7s",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
  },
  profileCard: {
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  profileHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    background: "linear-gradient(140deg, var(--surface-pink), var(--surface-orange))",
    border: "2px solid",
    borderColor: colors.border,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.primary,
    fontFamily: "var(--font-display)",
  },
  identity: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 5,
    minWidth: 0,
  },
  nameRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  name: {
    fontFamily: "var(--font-display)",
    fontSize: 20,
    fontWeight: 600,
    letterSpacing: "-0.5px",
    color: colors.foreground,
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    color: colors.muted,
  },
  editBtn: {
    minHeight: 36,
    padding: "7px 14px",
    fontSize: 12,
    flexShrink: 0,
  },
  bio: {
    fontSize: 13,
    color: colors.body,
    lineHeight: 1.7,
    borderTop: "1px solid",
    borderColor: colors.subtleBorder,
    paddingTop: 14,
  },
  section: {
    padding: "18px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.foreground,
  },
  sectionEdit: {
    fontSize: 11,
    color: colors.primary,
  },
  tagRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },
  proficiency: {
    color: colors.muted,
  },
  detailGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  detailRow: {
    display: "flex",
    gap: 12,
    fontSize: 12,
  },
  detailLabel: {
    color: colors.muted,
    minWidth: 120,
    flexShrink: 0,
  },
  detailValue: {
    color: colors.body,
  },
  projectList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  projectCard: {
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid",
    borderColor: colors.subtleBorder,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  projectTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  projectTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.foreground,
  },
  projectSummary: {
    fontSize: 11,
    color: colors.muted,
  },
  projectLinks: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  link: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11,
    color: colors.primary,
  },
});
