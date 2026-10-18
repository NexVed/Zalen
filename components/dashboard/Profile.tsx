"use client";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { profileSections } from "@/lib/profile-data";
import { MapPin, ArrowUpRight, Pencil, Plus, Check, Globe, LockKeyhole } from "lucide-react";
import { useAccountProfile } from "@/components/SyncUser";
import { ProfileFlow } from "@/components/onboarding/ProfileFlow";
import { ProfileAccess } from "@/components/onboarding/ProfileAccess";
import { ROLES } from "@/lib/onboarding-types";
import { roleData, type ProfileBundle, type ProfileSection } from "@/lib/profile-data";
import styles from "./Profile.module.css";

function safeLink(value?: string) { return value && /^https?:\/\//i.test(value) ? value : undefined; }
export function Profile() {
  const { status, bundle } = useAccountProfile();
  const router = useRouter(); const params = useSearchParams();
  const [editing, setEditing] = useState<ProfileSection | null>(() => profileSections.find(item => item.id === params.get("edit"))?.id ?? null); const [saved, setSaved] = useState(false);
  if (status !== "ready" || !bundle) return <ProfileAccess />;
  if (editing) return <ProfileFlow key={editing} bundle={bundle} section={editing} onDone={didSave => { setEditing(null); setSaved(!!didSave); router.replace("/profile", { scroll: false }); }} />;
  return <>{saved && <p className={styles.notice} role="status"><Check size={16} />Profile updated.<button onClick={() => setSaved(false)} aria-label="Dismiss profile update">Dismiss</button></p>}<ProfileDetails bundle={bundle} onEdit={section => { setSaved(false); setEditing(section); }} /></>;
}

export function ProfileDetails({ bundle, onEdit: edit }: { bundle: ProfileBundle; onEdit: (section: ProfileSection) => void }) {
  const { profile, user, skills, projects, achievements, onboarding } = bundle;
  const name = user.name || "Your profile";
  const role = ROLES.find(item => item.id === profile?.primaryRole);
  const background = roleData(bundle.roleDetails.find(item => item.role === profile?.primaryRole)?.data);
  return <div className={styles.page}>
    {!onboarding?.completed && <section className={styles.setup}><div><h2>Finish setting up your profile</h2><p>Your saved details are here. Continue from step {onboarding?.currentStep ?? 1}.</p></div><Link className={styles.primary} href="/onboarding">Continue setup<ArrowUpRight size={16} /></Link></section>}
    <section className={styles.identity}><div className={styles.identityTop}><span className={styles.avatar}>{user.imageUrl ? <Image unoptimized width={100} height={100} src={(user.imageUrl)!} alt={`${name}'s profile photo`} /> : name.slice(0, 1).toUpperCase()}</span><div className={styles.name}><span className={styles.caption}>My profile</span><h2>{name}</h2><p>{role?.description || "Choose a role to describe how you use Zalen."}</p><div className={styles.tags}>{role && <span>{role.label}</span>}{profile?.location && <span><MapPin size={13} />{profile.location}</span>}</div></div><button className={styles.secondary} onClick={() => edit("basics")}><Pencil size={14} />Edit profile</button></div><p className={styles.bio}>{profile?.bio || "Add an introduction with your experience, services, or current work."}</p><a className={styles.link} href="#portfolio"><Globe size={15} />View portfolio<ArrowUpRight size={14} /></a></section>
    <div className={styles.columns}><div className={styles.mainColumn}>
      <section className={styles.card}><div className={styles.heading}><div><h2>Skills</h2><p>{skills.length} skills added</p></div><button className={styles.edit} onClick={() => edit("skills")}><Pencil size={14} />Edit skills</button></div>{skills.length ? <div className={styles.tags}>{skills.map(item => <span key={item._id}>{item.name}{item.proficiency && ` · ${item.proficiency}`}</span>)}</div> : <p className={styles.empty}>Add skills to describe the work you can take on.</p>}</section>
      <section className={styles.card} id="portfolio"><div className={styles.heading}><div><h2>Portfolio</h2><p>Projects and examples of your work</p></div><button className={styles.edit} onClick={() => edit("portfolio")}><Plus size={15} />Manage work</button></div>{projects.length ? <div className={styles.items}>{projects.map(item => <article className={styles.item} key={item._id}><span className={styles.caption}>{item.category || "Project"}{item.status && ` · ${item.status.replaceAll("_", " ")}`}</span><h3>{item.title}</h3>{item.summary && <p>{item.summary}</p>}<div className={styles.tags}>{item.skills?.map(skill => <span key={skill}>{skill}</span>)}</div><div className={styles.links}>{safeLink(item.liveUrl) && <a href={item.liveUrl} target="_blank" rel="noopener noreferrer">View project<ArrowUpRight size={14} /></a>}{safeLink(item.repoUrl) && <a href={item.repoUrl} target="_blank" rel="noopener noreferrer">Repository<ArrowUpRight size={14} /></a>}</div></article>)}</div> : <div className={styles.empty}><p>No projects added yet.</p><button className={styles.secondary} onClick={() => edit("portfolio")}>Add your first project<Plus size={14} /></button></div>}</section>
      <section className={styles.card}><div className={styles.heading}><div><h2>Achievements</h2><p>Certifications, awards, and credentials</p></div><button className={styles.edit} onClick={() => edit("portfolio")}><Plus size={15} />Add achievement</button></div>{achievements.length ? <div className={styles.items}>{achievements.map(item => <article className={styles.item} key={item._id}><h3>{item.title}</h3><p>{[item.issuingOrg, item.dateAchieved].filter(Boolean).join(" · ")}</p>{safeLink(item.credentialUrl) && <a className={styles.link} href={item.credentialUrl} target="_blank" rel="noopener noreferrer">View credential<ArrowUpRight size={14} /></a>}</article>)}</div> : <p className={styles.empty}>No achievements added yet.</p>}</section>
    </div><aside className={styles.sideColumn}>
      <section className={styles.card}><div className={styles.heading}><h2>Role & background</h2><button className={styles.edit} onClick={() => edit("role")}>Edit role</button></div><p>{role?.label || "Choose your role"}</p>{Object.keys(background).length ? <dl className={styles.details}>{Object.entries(background).map(([key, value]) => <div key={key}><dt>{key.replace(/([A-Z])/g, " $1").replace(/^./, letter => letter.toUpperCase())}</dt><dd>{Array.isArray(value) ? value.join(", ") : value}</dd></div>)}</dl> : <p className={styles.empty}>Add experience or details relevant to your role.</p>}<button className={styles.edit} onClick={() => edit("background")}>Edit background<ArrowUpRight size={14} /></button></section>
      <section className={styles.card}><h2><LockKeyhole size={15} />Private contact details</h2><p className={styles.caption}>Only visible to you.</p><p className={styles.contact}>{user.email}</p><p className={styles.contact}>{profile?.phone ? `${profile.phoneCountryCode || ""} ${profile.phone}` : "No phone number added."}</p><button className={styles.edit} onClick={() => edit("basics")}>Edit contact details</button></section>
      <Link className={styles.primary} href="/bounties">Browse opportunities<ArrowUpRight size={15} /></Link>
    </aside></div>
  </div>;
}
