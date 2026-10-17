export const navigation = [
  { name: "Overview", path: "/", description: "Track applications, saved opportunities, and portfolio projects." },
  { name: "Bounties", path: "/bounties", description: "Browse startup challenges, submission requirements, and rewards." },
  { name: "Freelancers", path: "/freelancers", description: "Find local businesses on the map. Prepare a service pitch and share your portfolio." },
  { name: "Forum", path: "/forum", description: "Ask questions, share work, and give feedback." },
  { name: "Investors", path: "/investors", description: "Browse investor profiles by funding stage and sector." },
  { name: "B2B", path: "/b2b", description: "Find service providers and business partnership requests." },
  { name: "Gigs", path: "/gigs", description: "Browse paid freelance projects by budget and skill." },
  { name: "Events", path: "/events", description: "Browse meetups, workshops, and upcoming events." },
  { name: "My workspace", path: "/workspace", description: "Manage applications and portfolio projects." },
] as const;

export type HubView = "Freelancers" | "Forum" | "Investors" | "B2B";
export type View = typeof navigation[number]["name"] | "Opportunities" | "Community";
const aliases = [
  { name: "Opportunities" as const, path: "/opportunities", description: "Explore all startup opportunities." },
  { name: "Community" as const, path: "/community", description: "Meet other builders and find your next event." },
];
export const pages = [...navigation, ...aliases];
export function pageFor(view: View) { return pages.find(page => page.name === view)!; }
export function isHubView(view: View): view is HubView { return ["Freelancers", "Forum", "Investors", "B2B"].includes(view); }
