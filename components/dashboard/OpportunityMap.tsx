"use client";
import { useEffect, useRef, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import type { Map as MapInstance, StyleSpecification } from "maplibre-gl";
import { ArrowUpRight, Globe2, MapPin, Minus, Plus, RotateCcw } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { cities, type Opportunity } from "@/lib/demo-data";
import { colors } from "@/styles/tokens.stylex";
import { ui } from "./ui";

export function OpportunityMap({ items, city, onCity }: { items: Opportunity[]; city: string; onCity: (city: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const { theme } = useTheme();
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!container.current) return;
    let disposed = false;
    let map: MapInstance | undefined;
    const resizeObserver = new ResizeObserver(() => map?.resize());
    async function initialize() {
      try {
        const maplibre = await import("maplibre-gl");
        maplibre.setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href);
        if (disposed || !container.current) return;
        const css = getComputedStyle(document.documentElement);
        const token = (name: string) => css.getPropertyValue(name).trim();
        const style: StyleSpecification = {
          version: 8,
          sources: {
            countries: { type: "geojson", data: "/maps/countries.geojson", attribution: '<a href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer">Natural Earth</a>' },
            cities: { type: "geojson", data: { type: "FeatureCollection", features: cities.map(c => ({ type: "Feature", properties: { name: c.name }, geometry: { type: "Point", coordinates: c.coordinates } })) } },
          },
          layers: [
            { id: "background", type: "background", paint: { "background-color": token("--map-bg") } },
            { id: "land", type: "fill", source: "countries", paint: { "fill-color": token("--map-land"), "fill-opacity": 0.85 } },
            { id: "borders", type: "line", source: "countries", paint: { "line-color": token("--map-line"), "line-width": 0.7 } },
            { id: "city-halos", type: "circle", source: "cities", paint: { "circle-color": token("--accent-primary"), "circle-radius": 11, "circle-opacity": 0.15 } },
            { id: "city-points", type: "circle", source: "cities", paint: { "circle-color": token("--accent-primary"), "circle-radius": 4, "circle-stroke-width": 1.5, "circle-stroke-color": token("--accent-premium") } },
          ],
        };
        map = new maplibre.Map({ container: container.current, style, center: [78.5, 22.5], zoom: 3.1, minZoom: 2, maxZoom: 7, attributionControl: { compact: true }, scrollZoom: false, dragRotate: false, touchPitch: false });
        mapRef.current = map;
        map.on("load", () => { if (!disposed) { setReady(true); setError(false); } });
        map.on("error", () => { if (!disposed) setError(true); });
        cities.filter(c => c.name !== "Pune").forEach(c => {
          const label = document.createElement("button");
          label.className = "city-map-label";
          label.textContent = c.name;
          label.setAttribute("aria-label", `Show opportunities in ${c.name}`);
          label.addEventListener("click", () => onCity(c.name));
          new maplibre.Marker({ element: label, anchor: "left", offset: [9, 0] }).setLngLat(c.coordinates).addTo(map!);
        });
        map.on("click", "city-points", e => { const name = e.features?.[0]?.properties?.name; if (typeof name === "string") onCity(name); });
        map.on("mouseenter", "city-points", () => { if (map) map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "city-points", () => { if (map) map.getCanvas().style.cursor = ""; });
        resizeObserver.observe(container.current);
      } catch { if (!disposed) setError(true); }
    }
    void initialize();
    return () => { disposed = true; resizeObserver.disconnect(); map?.remove(); mapRef.current = null; };
  }, [theme, onCity, retry]);

  return <section {...stylex.props(ui.card, s.card)} aria-labelledby="map-title">
    <div {...stylex.props(ui.between, s.heading)}><div><h2 id="map-title" {...stylex.props(ui.heading, s.title)}>Opportunity, everywhere.</h2><p {...stylex.props(s.subtitle)}>Your next chapter could start anywhere.</p></div><Globe2 size={19} {...stylex.props(ui.muted)} /></div>
    <div {...stylex.props(s.mapWrap)}>
      <div ref={container} {...stylex.props(s.map)} aria-label="Interactive map of demo opportunities across India" />
      {!ready && !error && <span {...stylex.props(s.loading)} role="status">Finding your world of possibilities...</span>}
      {error && <div {...stylex.props(s.mapError)}><Globe2 size={24} /><p>The map couldn&apos;t load.<br />Explore the cities below.</p><button {...stylex.props(ui.textButton)} onClick={() => setRetry(v => v + 1)}><RotateCcw size={12} />Retry map</button></div>}
      <span {...stylex.props(s.mapBadge)}><span {...stylex.props(s.dot)} /> INDIA&apos;S BUILDERS, CONNECTED</span>
      <div {...stylex.props(s.mapControls)}><button aria-label="Zoom map in" {...stylex.props(s.mapButton)} onClick={() => mapRef.current?.zoomIn()}><Plus size={14} /></button><button aria-label="Zoom map out" {...stylex.props(s.mapButton)} onClick={() => mapRef.current?.zoomOut()}><Minus size={14} /></button></div>
    </div>
    <div {...stylex.props(s.locationList)}>{cities.slice(0, 3).map(c => <button key={c.name} {...stylex.props(s.location, city === c.name && s.selected)} aria-pressed={city === c.name} onClick={() => onCity(city === c.name ? "" : c.name)}><span {...stylex.props(ui.row)}><MapPin size={12} />{c.name}</span><span {...stylex.props(ui.row, s.cityCount)}>{items.filter(o => o.location === c.name).length} opportunities <ArrowUpRight size={12} /></span></button>)}</div>
    <div {...stylex.props(s.mapFooter)}><span {...stylex.props(ui.row)}><Globe2 size={13} />Good work knows no boundaries.</span><button {...stylex.props(ui.textButton)} onClick={() => onCity("")}>View all <ArrowUpRight size={12} /></button></div>
  </section>;
}
const s = stylex.create({
  card: { overflow: "hidden" },
  heading: { padding: "22px 22px 18px" },
  title: { fontSize: 17 }, subtitle: { fontSize: 10, color: colors.muted, marginTop: 7 },
  mapWrap: { position: "relative", height: 250, backgroundColor: "var(--map-bg)", borderBlock: "1px solid", borderColor: colors.subtleBorder },
  map: { position: "absolute", inset: 0 },
  mapBadge: { position: "absolute", top: 13, left: 16, display: "flex", alignItems: "center", gap: 6, fontSize: 7, letterSpacing: "1px", color: colors.body, backgroundColor: "color-mix(in srgb, var(--bg-card), transparent 15%)", padding: "7px 8px", borderRadius: 5, pointerEvents: "none" },
  dot: { width: 4, height: 4, borderRadius: "50%", backgroundColor: colors.primary },
  mapControls: { position: "absolute", right: 12, bottom: 26, display: "flex", flexDirection: "column", border: "1px solid", borderColor: colors.border, borderRadius: 7, overflow: "hidden" },
  mapButton: { backgroundColor: colors.card, color: colors.body, width: 27, height: 27, display: "flex", alignItems: "center", justifyContent: "center" },
  loading: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: colors.muted, fontSize: 11, pointerEvents: "none" },
  mapError: { position: "absolute", inset: 0, backgroundColor: "var(--map-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: colors.muted, fontSize: 12, textAlign: "center" },
  locationList: { padding: "9px 20px" },
  location: { width: "100%", backgroundColor: { default: "transparent", ":hover": colors.elevated }, color: colors.body, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "13px 3px", borderBottom: "1px solid", borderColor: colors.subtleBorder, fontSize: 11, textAlign: "left" },
  selected: { color: colors.primary },
  cityCount: { color: colors.muted, fontSize: 9 },
  mapFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 5, padding: "4px 22px 15px", color: colors.muted, fontSize: 9, flexWrap: "wrap" },
});
