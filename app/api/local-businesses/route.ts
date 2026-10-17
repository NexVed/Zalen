import type { LocalBusiness } from "@/lib/local-business";

type Element = { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };
const headers = { "User-Agent": "ZalenLocalBusinessFinder/1.0", Accept: "application/json" };
let lastGeocode = 0;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  try {
    const query = params.get("location")?.trim();
    let lat = Number(params.get("lat"));
    let lon = Number(params.get("lon"));
    let location = "Selected map area";
    if (query) {
      if (query.length < 3 || query.length > 120) return Response.json({ error: "Enter a city or area (3–120 characters)." }, { status: 400 });
      // Explicit searches only; avoid autocomplete against the public geocoder.
      if (Date.now() - lastGeocode < 1100) return Response.json({ error: "Please wait a moment before searching again." }, { status: 429 });
      lastGeocode = Date.now();
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`, { headers, signal: AbortSignal.timeout(12000), next: { revalidate: 86400 } });
      if (!response.ok) throw new Error("Location search is unavailable. Try moving the map and searching this area.");
      const places = await response.json();
      if (!places.length) return Response.json({ error: "Location not found. Try a city and country." }, { status: 404 });
      lat = Number(places[0].lat); lon = Number(places[0].lon); location = places[0].display_name;
    } else if (!params.has("lat") || !params.has("lon")) {
      return Response.json({ error: "Choose a location first." }, { status: 400 });
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return Response.json({ error: "Invalid map coordinates." }, { status: 400 });
    const category = params.get("category");
    const selectors = category === "Food & drink" ? ['[amenity~"^(restaurant|cafe|bar|fast_food|bakery)$"]'] : category === "Shops" ? ['[shop]'] : category === "Services" ? ['[office]', '[craft]', '[amenity~"^(clinic|dentist|veterinary|gym)$"]'] : ['[shop]', '[office]', '[craft]', '[amenity~"^(restaurant|cafe|bar|fast_food|clinic|dentist|veterinary)$"]'];
    const data = `[out:json][timeout:20];(${selectors.map(selector => `nwr${selector}[name](around:2000,${lat.toFixed(5)},${lon.toFixed(5)});`).join("")});out center tags 80;`;
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(data)}`, { headers, signal: AbortSignal.timeout(25000), next: { revalidate: 3600 } });
    if (!response.ok) throw new Error("Business search is busy. Please try again shortly.");
    const result = await response.json();
    if (result.remark) throw new Error("Business search timed out. Please retry this area.");
    const businesses: LocalBusiness[] = (result.elements as Element[]).flatMap(element => {
      const tags = element.tags ?? {};
      const point = element.center ?? element;
      if (!tags.name || point.lat == null || point.lon == null) return [];
      const rawSite = tags.website || tags["contact:website"] || "";
      const website = /^https?:\/\//i.test(rawSite) ? rawSite : rawSite ? `https://${rawSite}` : "";
      return [{ id: `${element.type}/${element.id}`, name: tags.name, category: (tags.shop || tags.office || tags.craft || tags.amenity || "Business").replaceAll("_", " "), lat: point.lat, lon: point.lon, address: [tags["addr:housenumber"], tags["addr:street"], tags["addr:suburb"], tags["addr:city"]].filter(Boolean).join(", "), website, phone: tags.phone || tags["contact:phone"] || "" }];
    });
    return Response.json({ businesses, center: { lat, lon }, location }, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error && !error.name.includes("Timeout") ? error.message : "Business search timed out. Please try again." }, { status: 503 });
  }
}
