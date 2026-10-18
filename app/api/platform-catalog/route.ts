import { directory, discussions } from "@/lib/hub-data";
import { cities, opportunities } from "@/lib/demo-data";
import { pages } from "@/lib/navigation";

export function GET() {
  return Response.json({
    pages: pages.map((page) => ({ name: page.name, path: page.path, description: page.description })),
    opportunities,
    cities,
    investors: directory.filter((entry) => entry.kind === "investor"),
    businesses: directory.filter((entry) => entry.kind === "business"),
    talent: directory.filter((entry) => entry.kind === "freelancer"),
    discussions,
  });
}
