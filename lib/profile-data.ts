import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";

export type ProfileBundle = NonNullable<FunctionReturnType<typeof api.profile.getMyProfile>>;
export type ProfileSection = "basics" | "role" | "background" | "skills" | "portfolio" | "review";
export const profileSections: { id: ProfileSection; title: string; description: string }[] = [
  { id: "basics", title: "About you", description: "Add your name, location, and a short introduction." },
  { id: "role", title: "Your role", description: "Choose how you plan to use Zalen." },
  { id: "background", title: "Background", description: "Add the experience or business details relevant to your role." },
  { id: "skills", title: "Skills", description: "Choose your skills and experience levels." },
  { id: "portfolio", title: "Work & achievements", description: "Add projects or credentials. You can do this later." },
  { id: "review", title: "Review & finish", description: "Check your details before completing your profile." },
];
export function roleData(value: unknown): Record<string, string | string[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string | string[]] => typeof entry[1] === "string" || (Array.isArray(entry[1]) && entry[1].every(item => typeof item === "string"))));
}
