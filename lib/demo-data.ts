export type OpportunityType = "Challenge" | "Paid project" | "Internship";
export type Opportunity = {
  id: string; company: string; title: string; category: OpportunityType; location: string;
  remote: boolean; amount: string; duration: string; deadline: string; skills: string[];
  match: number; tone: "pink" | "purple" | "orange" | "blue" | "green";
  description: string; deliverables: string[]; rubric: string[]; applicants: number;
};

// Fictional organizations and outcomes for the interactive design preview.
export const opportunities: Opportunity[] = [
  { id: "orbit", company: "Orbit Labs", title: "Build a better onboarding experience", category: "Challenge", location: "Bengaluru", remote: true, amount: "₹15,000", duration: "1 week", deadline: "Oct 28, 2026", skills: ["UI/UX Design", "Figma", "Prototyping"], match: 98, tone: "pink", applicants: 18,
    description: "Help us turn a first visit into a great first impression. Design a simple, thoughtful onboarding flow for our creator platform.",
    deliverables: ["A 5–7 screen interactive Figma prototype", "A short walkthrough of your design decisions", "Responsive layouts for mobile and desktop"], rubric: ["Clarity & usability · 40%", "Visual craft · 35%", "Problem solving · 25%"] },
  { id: "layer", company: "Layer Studio", title: "Frontend developer intern", category: "Internship", location: "Mumbai", remote: true, amount: "₹20,000/mo", duration: "3 months", deadline: "Nov 02, 2026", skills: ["React", "Next.js", "TypeScript"], match: 95, tone: "purple", applicants: 24,
    description: "Join a small product team building collaborative tools. Bring designs to life with accessible, responsive React interfaces and learn alongside experienced developers.", deliverables: ["Your portfolio or GitHub profile", "One frontend project you are proud of", "A short introduction and availability"], rubric: ["Frontend fundamentals · 40%", "Project quality · 35%", "Communication · 25%"] },
  { id: "bloom", company: "Bloom Collective", title: "Design a sustainable brand identity", category: "Paid project", location: "Delhi", remote: true, amount: "₹12,000", duration: "2 weeks", deadline: "Nov 05, 2026", skills: ["Branding", "Figma", "Visual Design"], match: 92, tone: "green", applicants: 12,
    description: "Shape the identity of a new sustainable lifestyle brand. We are looking for a clear, warm visual direction that makes conscious choices feel effortless.", deliverables: ["Logo concept and visual direction", "Color and typography guidelines", "Three example social templates"], rubric: ["Brand relevance · 40%", "Originality · 30%", "Consistency · 30%"] },
  { id: "nova", company: "Nova Systems", title: "Turn product data into a story", category: "Challenge", location: "Hyderabad", remote: false, amount: "₹10,000", duration: "5 days", deadline: "Oct 30, 2026", skills: ["Data Analysis", "Python", "Visualization"], match: 88, tone: "blue", applicants: 9,
    description: "Explore an anonymized sample dataset and help our team understand how people use our product. Find the story behind the numbers.", deliverables: ["A reproducible analysis notebook", "Three clear, useful visualizations", "A one-page insights summary"], rubric: ["Analytical rigor · 45%", "Clarity · 30%", "Practical insights · 25%"] },
  { id: "forma", company: "Forma Works", title: "Create a landing page that connects", category: "Paid project", location: "Pune", remote: true, amount: "₹18,000", duration: "10 days", deadline: "Nov 08, 2026", skills: ["Next.js", "UI/UX Design", "CSS"], match: 94, tone: "orange", applicants: 15,
    description: "Build a responsive launch page for a creative collaboration tool. Work from a clear brief and turn an early concept into a polished web experience.", deliverables: ["A responsive landing page", "Accessible components and source code", "A short handover document"], rubric: ["Implementation quality · 40%", "Design execution · 35%", "Accessibility · 25%"] },
  { id: "capsule", company: "Capsule", title: "Product design internship", category: "Internship", location: "Bengaluru", remote: false, amount: "₹18,000/mo", duration: "3 months", deadline: "Nov 12, 2026", skills: ["UI/UX Design", "Research", "Figma"], match: 91, tone: "purple", applicants: 21,
    description: "Help a growing team make everyday tools simpler. Take part in user research, ideation, prototyping, and design reviews.", deliverables: ["Two portfolio case studies", "A short note about your design interests", "Your internship availability"], rubric: ["Design process · 40%", "Portfolio craft · 35%", "Curiosity · 25%"] },
];

export const cities = [
  { name: "Bengaluru", coordinates: [77.5946, 12.9716] as [number, number] },
  { name: "Mumbai", coordinates: [72.8777, 19.076] as [number, number] },
  { name: "Delhi", coordinates: [77.209, 28.6139] as [number, number] },
  { name: "Hyderabad", coordinates: [78.4867, 17.385] as [number, number] },
  { name: "Pune", coordinates: [73.8567, 18.5204] as [number, number] },
];

export const events = [
  { id: "build", day: "24", month: "OCT", title: "Founders & builders meetup", kind: "Founders & builders meetup", location: "Bengaluru · Online", time: "Sat, Oct 24 · 4:00 PM IST", description: "An informal demo meetup for early builders. Bring an idea, share what you are working on, and meet potential collaborators.", tone: "pink" as const },
  { id: "portfolio", day: "28", month: "OCT", title: "The portfolio review room", kind: "Live mentor session", location: "Online", time: "Wed, Oct 28 · 6:00 PM IST", description: "A guided portfolio review session focused on telling the story behind your work. Prepare one project and a question for the group.", tone: "orange" as const },
];

export type Application = { opportunityId: string; status: "In review" | "Shortlisted" | "Submitted"; note: string; link: string };
export type PortfolioItem = { id: string; title: string; type: string; link: string };
export type DemoState = {
  saved: string[]; applications: Application[]; joined: string[]; customOpportunities: Opportunity[];
  profile: { name: string; headline: string; skills: string; link: string };
  portfolio: PortfolioItem[];
};
export const initialDemo: DemoState = {
  saved: [], joined: [], customOpportunities: [], applications: [],
  profile: { name: "", headline: "", skills: "", link: "" },
  portfolio: [],
};
