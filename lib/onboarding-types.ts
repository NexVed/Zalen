export interface BasicInfoData {
  phone?: string;
  phoneCountryCode?: string;
  bio?: string;
  location?: string;
  avatarStorageId?: string;
}

export interface SkillEntry {
  name: string;
  category?: string;
  proficiency?: string;
}

export interface ProjectEntry {
  id?: string; // Convex ID if already saved
  title: string;
  summary?: string;
  description?: string;
  category?: string;
  skills?: string[];
  role?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  liveUrl?: string;
  repoUrl?: string;
  visibility?: string;
}

export interface AchievementEntry {
  id?: string; // Convex ID if already saved
  title: string;
  category?: string;
  issuingOrg?: string;
  dateAchieved?: string;
  description?: string;
  credentialUrl?: string;
  visibility?: string;
}

export interface OnboardingFormData {
  basicInfo?: BasicInfoData;
  role?: string;
  roleDetails?: Record<string, unknown>;
  skills?: SkillEntry[];
}

export const ROLES = [
  { id: "student", label: "Student", description: "Discover opportunities, demonstrate skills, and build your portfolio." },
  { id: "graduate", label: "Recent Graduate / Job Seeker", description: "Showcase your capabilities and find internships, projects, and jobs." },
  { id: "founder", label: "Founder / Startup Member", description: "Publish challenges, discover talent, and build your team." },
  { id: "recruiter", label: "Recruiter / Hiring Manager", description: "Discover candidates, evaluate skills, and manage opportunities." },
  { id: "business", label: "Local Business Owner", description: "Find local talent for projects, digital services, and business needs." },
  { id: "freelancer", label: "Freelancer / Independent Pro", description: "Showcase previous work and connect with clients." },
  { id: "mentor", label: "Mentor / Industry Professional", description: "Share expertise and support emerging talent." },
  { id: "institution", label: "College / Institution Rep", description: "Connect students with opportunities and support institutional initiatives." },
] as const;
