"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as MapInstance, Marker } from "maplibre-gl";
import type { LocalBusiness } from "@/lib/local-business";
import { useTheme } from "@/components/ThemeProvider";
import styles from "./BusinessFinder.module.css";

export function BusinessMap({ businesses, center, selected, onSelect, onArea }: { businesses: LocalBusiness[]; center: { lat: number; lon: number }; selected: string; onSelect: (business: LocalBusiness) => void; onArea: (center: { lat: number; lon: number }) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapInstance | null>(null);
  const markers = useRef<Marker[]>([]);
  const callbacks = useRef({ onSelect, onArea });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const { theme } = useTheme();
  useEffect(() => { callbacks.current = { onSelect, onArea }; }, [onSelect, onArea]);
  useEffect(() => {
    let disposed = false;
    let instance: MapInstance | undefined;
    const observer = new ResizeObserver(() => instance?.resize());
    import("maplibre-gl").then(library => {
      if (disposed || !container.current) return;
      library.setWorkerUrl("/maps/maplibre-worker.mjs");
      instance = new library.Map({ container: container.current, center: [77.5946, 12.9716], zoom: 14, style: { version: 8, sources: { streets: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, maxzoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>' } }, layers: [{ id: "streets", type: "raster", source: "streets" }] } });
      map.current = instance;
      instance.addControl(new library.NavigationControl({ showCompass: false }), "bottom-right");
      instance.on("load", () => { if (!disposed) setReady(true); });
      instance.on("error", () => { if (!disposed) setError(true); });
      instance.on("idle", () => { if (!disposed && instance?.areTilesLoaded()) setError(false); });
      instance.on("moveend", () => { const point = instance?.getCenter(); if (point) callbacks.current.onArea({ lat: point.lat, lon: point.lng }); });
      observer.observe(container.current);
    }).catch(() => { if (!disposed) setError(true); });
    return () => { disposed = true; observer.disconnect(); markers.current.forEach(marker => marker.remove()); instance?.remove(); map.current = null; };
  }, [attempt]);
  useEffect(() => { if (ready) map.current?.flyTo({ center: [center.lon, center.lat], zoom: 14 }); }, [center, ready]);
  useEffect(() => {
    if (!ready || !map.current) return;
    let disposed = false;
    import("maplibre-gl").then(library => {
      if (disposed || !map.current) return;
      markers.current.forEach(marker => marker.remove());
      markers.current = businesses.map((business, index) => {
        const button = document.createElement("button");
        button.className = `${styles.marker} ${selected === business.id ? styles.selectedMarker : ""}`;
        button.textContent = String(index + 1);
        button.setAttribute("aria-label", `Select ${business.name}`);
        button.setAttribute("aria-pressed", String(selected === business.id));
        button.onclick = () => callbacks.current.onSelect(business);
        return new library.Marker({ element: button }).setLngLat([business.lon, business.lat]).addTo(map.current!);
      });
    });
    return () => { disposed = true; };
  }, [businesses, selected, ready]);
  return <div className={`${styles.mapPanel} ${theme === "dark" ? styles.darkMap : ""}`}><div ref={container} className={styles.map} role="region" aria-label="Local business street map. Pan or zoom, then search this area." />{!ready && !error && <p className={styles.mapStatus} role="status">Loading street map…</p>}{error && <div className={styles.mapStatus} role="status">Map tiles could not load. Business search is still available. <button onClick={() => { setError(false); setReady(false); setAttempt(value => value + 1); }}>Retry map</button></div>}<span className={styles.mapHint}>Move the map, then select “Search this area”</span></div>;
}
