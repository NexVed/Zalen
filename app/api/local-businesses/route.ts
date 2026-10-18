import type { LocalBusiness } from "@/lib/local-business";

type GeocodeResult = { lat?: number; lon?: number; formatted?: string };
type PlaceFeature = {
  properties?: {
    place_id?: string;
    name?: string;
    address_line1?: string;
    address_line2?: string;
    lat?: number;
    lon?: number;
    distance?: number;
    categories?: string[];
    website?: string;
    contact?: { phone?: string };
    datasource?: { raw?: { name?: string; phone?: string; website?: string } };
  };
};

const categories: Record<string, string> = {
  "Food & drink": "catering.restaurant,catering.cafe,catering.bar,catering.fast_food,catering.bakery",
  Shops: "commercial",
  Services: "service,office,healthcare",
};

function key() {
  return process.env.GEOAPIFY_API_KEY || process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || "";
}

function label(categories: string[] | undefined) {
  const specific = [...(categories ?? [])].sort((a, b) => b.split(".").length - a.split(".").length || b.length - a.length)[0];
  const raw = specific?.split(".").pop() || "business";
  return raw.replaceAll("_", " ");
}

export async function GET(request: Request) {
  const apiKey = key();
  if (!apiKey) return Response.json({ error: "Add a Geoapify API key to list businesses." }, { status: 503 });
  const params = new URL(request.url).searchParams;
  try {
    const query = params.get("location")?.trim();
    let lat = Number(params.get("lat"));
    let lon = Number(params.get("lon"));
    let location = "Selected map area";
    if (query) {
      if (query.length < 3 || query.length > 120) return Response.json({ error: "Enter a city or area (3–120 characters)." }, { status: 400 });
      const geocode = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(query)}&limit=1&format=json&apiKey=${apiKey}`, { cache: "no-store", signal: AbortSignal.timeout(12000) });
      if (!geocode.ok) throw new Error("Location search is unavailable.");
      const places = (await geocode.json()) as { results?: GeocodeResult[] };
      const match = places.results?.[0];
      if (!match || match.lat == null || match.lon == null) return Response.json({ error: "Location not found. Try a city and country." }, { status: 404 });
      lat = match.lat;
      lon = match.lon;
      location = match.formatted || query;
    } else if (!params.has("lat") || !params.has("lon")) {
      return Response.json({ error: "Choose a location first." }, { status: 400 });
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return Response.json({ error: "Invalid map coordinates." }, { status: 400 });
    const category = categories[params.get("category") || ""] || "commercial,catering,service,office";
    const places = await fetch(`https://api.geoapify.com/v2/places?categories=${category}&filter=circle:${lon.toFixed(5)},${lat.toFixed(5)},2000&bias=proximity:${lon.toFixed(5)},${lat.toFixed(5)}&limit=60&apiKey=${apiKey}`, { cache: "no-store", signal: AbortSignal.timeout(20000) });
    if (places.status === 401 || places.status === 403) throw new Error("The places key was rejected.");
    if (!places.ok) throw new Error("Business search is busy. Please try again shortly.");
    const result = (await places.json()) as { features?: PlaceFeature[] };
    const businesses: LocalBusiness[] = (result.features ?? []).flatMap((feature) => {
      const item = feature.properties ?? {};
      const raw = item.datasource?.raw;
      const name = item.name || raw?.name;
      const pointLat = item.lat;
      const pointLon = item.lon;
      if (!name || pointLat == null || pointLon == null) return [];
      const website = item.website || raw?.website || "";
      return [{
        id: item.place_id || `${pointLat},${pointLon},${name}`,
        name,
        category: label(item.categories),
        lat: pointLat,
        lon: pointLon,
        address: [item.address_line1, item.address_line2].filter(Boolean).join(", "),
        website: /^https?:\/\//i.test(website) ? website : website ? `https://${website}` : "",
        phone: item.contact?.phone || raw?.phone || "",
        distance: typeof item.distance === "number" ? Math.round(item.distance) : undefined,
      }];
    });
    return Response.json({ businesses, center: { lat, lon }, location, source: "geoapify" }, { headers: { "Cache-Control": "private, max-age=120" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error && !error.name.includes("Timeout") ? error.message : "Business search timed out. Please try again." }, { status: 503 });
  }
}
