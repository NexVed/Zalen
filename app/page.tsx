import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Zalen — Find your people. Build your next thing.",
  description: "A shared space for startup challenges, freelance projects, local business discovery, and the people building what's next. Find work, show your skills, and connect on Zalen.",
};

export default function Home() { return <LandingPage />; }
