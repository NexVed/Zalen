export const navigation = [
  { name: "Overview", path: "/", description: "Track applications, saved opportunities, and portfolio projects." },
  { name: "Bounties", path: "/bounties", description: "Browse startup challenges, submission requirements, and rewards." },
  { name: "Freelancers", path: "/freelancers", description: "Find local businesses on the map. Prepare a service pitch and share your portfolio." },
  { name: "Forum", path: "/forum", description: "Ask questions, share work, and give feedback." },
  { name: "Investors", path: "/investors", description: "Browse investor profiles by funding stage and sector." },
  { name: "B2B", path: "/b2b", description: "Find service providers and business partnership requests." },
  { name: "Gigs", path: "/gigs", description: "Browse paid freelance projects by budget and skill." },
  { name: "Community", path: "/community", description: "Share projects with text, images, and video so your work can be seen." },
] as const;

export type HubView = "Freelancers" | "Forum" | "Investors" | "B2B";
export type View = typeof navigation[number]["name"] | "Opportunities" | "Profile";
const aliases = [
  { name: "Profile" as const, path: "/profile", description: "Manage your profile, skills, and work." },
  { name: "Opportunities" as const, path: "/opportunities", description: "Explore all startup opportunities." },
];
export const pages = [...navigation, ...aliases];
export function pageFor(view: View) { return pages.find(page => page.name === view)!; }
export function isHubView(view: View): view is HubView { return ["Freelancers", "Forum", "Investors", "B2B"].includes(view); }
