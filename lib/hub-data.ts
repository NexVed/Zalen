export type DirectoryKind = "freelancer" | "investor" | "business";
export type DirectoryEntry = {
  id: string; kind: DirectoryKind; name: string; title: string; location: string;
  tags: string[]; description: string; detail: string; available: boolean;
};
export type Reply = { id: string; author: string; body: string };
export type Thread = { id: string; title: string; category: string; body: string; author: string };
export type Draft = { id: string; recipient: string; kind: "pitch" | "partnership" | "business-pitch"; title: string; body: string };
export type HubState = { listings: DirectoryEntry[]; threads: Thread[]; replies: Record<string, Reply[]>; votes: string[]; drafts: Draft[] };
export const emptyHub: HubState = { listings: [], threads: [], replies: {}, votes: [], drafts: [] };

// Illustrative profiles, not verified people, firms, or investment offers.
export const directory: DirectoryEntry[] = [
  { id: "talent-design", kind: "freelancer", name: "Mira — Product design", title: "Product design and UX research.", location: "Bengaluru", tags: ["Design", "Figma", "Research"], description: "Product discovery, clear user journeys, and interfaces built around the people who use them.", detail: "₹2,000 / hour", available: true },
  { id: "talent-code", kind: "freelancer", name: "Arjun — Frontend engineering", title: "React and Next.js frontend development.", location: "Remote", tags: ["Development", "React", "Next.js"], description: "Accessible websites, responsive product experiences, and reliable frontend systems for small teams.", detail: "₹2,500 / hour", available: true },
  { id: "talent-brand", kind: "freelancer", name: "Leena — Brand & storytelling", title: "Brand strategy and launch copy.", location: "Mumbai", tags: ["Branding", "Writing", "Strategy"], description: "Positioning, visual direction, and launch copy that help an early-stage business find its voice.", detail: "From ₹15,000 / project", available: false },
  { id: "talent-data", kind: "freelancer", name: "Kabir — Data & automation", title: "Data dashboards and workflow automation.", location: "Delhi", tags: ["Development", "Python", "Analytics"], description: "Practical dashboards, data pipelines, and small automations for everyday operational problems.", detail: "₹1,800 / hour", available: true },
  { id: "capital-north", kind: "investor", name: "Northstar Seed Collective", title: "Pre-seed software investments.", location: "Bengaluru", tags: ["Pre-seed", "SaaS", "AI"], description: "Example thesis: capital-efficient software teams with a clear customer problem and an early working product.", detail: "Illustrative cheque: ₹25L–₹1Cr", available: true },
  { id: "capital-operator", kind: "investor", name: "Operator Angel Circle", title: "Consumer and marketplace angel investments.", location: "Remote", tags: ["Angel", "Consumer", "Marketplace"], description: "Example thesis: founder-led consumer products and marketplaces with evidence of repeat usage.", detail: "Illustrative cheque: ₹5L–₹25L", available: true },
  { id: "capital-earth", kind: "investor", name: "Earthward Ventures", title: "Climate and hardware seed funding.", location: "Mumbai", tags: ["Seed", "Climate", "Hardware"], description: "Example thesis: climate-focused teams moving from technical validation to a repeatable business model.", detail: "Illustrative cheque: ₹50L–₹2Cr", available: true },
  { id: "business-design", kind: "business", name: "Studio Assembly", title: "Product design services.", location: "Remote", tags: ["Offering", "Design", "Product"], description: "A sample service listing for product audits, prototyping, and design systems delivered in focused sprints.", detail: "Project partnership", available: true },
  { id: "business-build", kind: "business", name: "Launch Foundry", title: "Looking for a frontend delivery partner.", location: "Bengaluru", tags: ["Seeking", "Development", "SaaS"], description: "A sample partnership request for a small engineering studio to collaborate on an early product launch.", detail: "Delivery partnership", available: true },
  { id: "business-growth", kind: "business", name: "Common Ground", title: "Let’s reach the right community, together.", location: "Delhi", tags: ["Offering", "Marketing", "Community"], description: "A sample collaboration offer for community-led launch campaigns, events, and content partnerships.", detail: "Growth partnership", available: true },
];

export const discussions: Thread[] = [
  { id: "forum-feedback", title: "What makes a first portfolio case study useful?", category: "Feedback", author: "Zalen editorial", body: "A useful case study shows the problem, your decisions, and what you learned. What would you want to see before working with an early-career designer? Share an approach or ask for feedback on your own work." },
  { id: "forum-build", title: "The weekend build log: what are you making?", category: "Build logs", author: "Zalen editorial", body: "Use this space to describe one thing you are building, the smallest useful version of it, and a decision you are trying to make. A specific question is a great place for someone else to help." },
  { id: "forum-founder", title: "Finding your first collaborator without a big network", category: "Questions", author: "Zalen editorial", body: "Start with a small, well-defined problem and be clear about scope, time, and compensation. What has helped you find a collaborator? What would you like to understand before joining a project?" },
];
