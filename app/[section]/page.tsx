import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { pages } from "@/lib/navigation";

export function generateStaticParams() {
  return pages.filter(page => page.path !== "/").map(page => ({ section: page.path.slice(1) }));
}

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const page = pages.find(page => page.path === `/${section}`);
  return { title: `${page?.name ?? "Page not found"} · Zalen`, description: page?.description };
}

export default function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  return <Suspense fallback={<main id="main" aria-busy="true" role="status">Opening your Zalen space…</main>}><SectionContent params={params} /></Suspense>;
}

async function SectionContent({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const page = pages.find(page => page.path === `/${section}`);
  if (!page) notFound();
  return <Dashboard initialView={page.name} />;
}
