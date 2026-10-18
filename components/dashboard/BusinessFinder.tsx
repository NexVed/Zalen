"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import * as stylex from "@stylexjs/stylex";
import { ExternalLink, LocateFixed, MapPin, Search, X } from "lucide-react";
import { businessCategories, type LocalBusiness } from "@/lib/local-business";
import { useHubState } from "@/lib/use-hub-state";
import { BusinessMap } from "./BusinessMap";
import { ui } from "./ui";
import hub from "./Hub.module.css";
import styles from "./BusinessFinder.module.css";

export function BusinessFinder({ userId, search, onSearch }: { userId: string | null; search: string; onSearch: (value: string) => void }) {
  const router = useRouter();
  const [state, update] = useHubState(userId);
  const [location, setLocation] = useState("Bengaluru, India");
  const [area, setArea] = useState("Bengaluru");
  const [category, setCategory] = useState("All businesses");
  const [center, setCenter] = useState({ lat: 12.9716, lon: 77.5946 });
  const [mapArea, setMapArea] = useState(center);
  const [businesses, setBusinesses] = useState<LocalBusiness[]>([]);
  const [selected, setSelected] = useState("");
  const [pitch, setPitch] = useState<LocalBusiness | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const request = useRef<AbortController | null>(null);
  const lastQuery = useRef<URLSearchParams | null>(null);
  const find = useCallback(async (params: URLSearchParams, selectedCategory = "All businesses") => {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setLoading(true); setError(""); setMessage(""); setBusinesses([]); setSelected(""); setSearched(false);
    lastQuery.current = new URLSearchParams(params);
    params.set("category", selectedCategory);
    try {
      const response = await fetch(`/api/local-businesses?${params}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(25000)]) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Business search is unavailable.");
      if (controller.signal.aborted) return;
      setBusinesses(data.businesses); setCenter(data.center); setMapArea(data.center); setArea(data.location); setSearched(true);
    } catch (value) { if (!controller.signal.aborted) setError(value instanceof Error ? value.message : "Could not load businesses. Try again."); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => void find(new URLSearchParams({ location: "Bengaluru, India" })), 0);
    return () => { clearTimeout(timer); request.current?.abort(); };
  }, [find]);
  function searchArea() { void find(new URLSearchParams({ lat: String(mapArea.lat), lon: String(mapArea.lon) }), category); }
  function locate() {
    if (!navigator.geolocation) { setError("Location access is unavailable. Search for a city instead."); return; }
    setMessage("Waiting for location permission…");
    navigator.geolocation.getCurrentPosition(position => { setMessage(""); setCenter({ lat: position.coords.latitude, lon: position.coords.longitude }); void find(new URLSearchParams({ lat: String(position.coords.latitude), lon: String(position.coords.longitude) }), category); }, () => { setMessage(""); setError("Could not access your location. Enter a city or move the map instead."); }, { timeout: 10000 });
  }
  const visible = businesses.filter(business => `${business.name} ${business.category} ${business.address}`.toLowerCase().includes(search.toLowerCase()));
  const drafts = state.drafts.filter(draft => draft.kind === "business-pitch");
  return <div className={styles.page}>
    <div className={styles.toolbar}>
      <form className={styles.location} onSubmit={event => { event.preventDefault(); void find(new URLSearchParams({ location }), category); }}><input aria-label="City or area" required minLength={3} maxLength={120} value={location} onChange={event => setLocation(event.target.value)} placeholder="City or neighbourhood" {...stylex.props(ui.input)} /><button type="submit" disabled={loading} {...stylex.props(ui.primary)}><Search size={15} />{loading ? "Searching…" : "Find businesses"}</button></form>
      <select aria-label="Business category" value={category} disabled={loading} onChange={event => { const next = event.target.value; setCategory(next); if (lastQuery.current) void find(new URLSearchParams(lastQuery.current), next); }} {...stylex.props(ui.input)}>{businessCategories.map(value => <option key={value}>{value}</option>)}</select>
      <button disabled={loading} onClick={searchArea} {...stylex.props(ui.secondary)}><MapPin size={14} />Search this area</button>
      <button disabled={loading} onClick={locate} {...stylex.props(ui.secondary)}><LocateFixed size={14} />Near me</button>
    </div>
    {error && <div role="alert"><p className={styles.error}>{error}</p><button {...stylex.props(ui.secondary)} onClick={() => void find(new URLSearchParams(lastQuery.current ?? { location }), category)}>Retry search</button> <a className={styles.muted} href={`https://www.google.com/maps/search/${encodeURIComponent(`${category === "All businesses" ? "businesses" : category} near ${location}`)}`} target="_blank" rel="noopener noreferrer">Search this location on Google Maps</a></div>}{message && <p className={styles.muted} role="status">{message}</p>}
    <div className={styles.layout}>
      <BusinessMap businesses={visible} center={center} selected={selected} onSelect={business => { setSelected(business.id); document.getElementById(`business-${business.id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }} onArea={setMapArea} />
      <section className={styles.results} aria-label="Local businesses" aria-busy={loading}>
        <div className={styles.summary}><h2>{loading ? "Searching nearby businesses…" : searched ? `${visible.length} businesses found` : "Find businesses to pitch"}</h2><p className={styles.muted}>{searched ? `${area} · Within 2 km · Up to 60 results` : "Search a city, use your location, or move the map. Select a business to review its details and draft a service pitch."}</p>{searched && <input type="search" aria-label="Filter business results" placeholder="Filter by business name or type" value={search} onChange={event => onSearch(event.target.value)} {...stylex.props(ui.input)} />}</div>
        {!loading && searched && !visible.length && <p className={styles.note}>No businesses match this search. Try another area or category.</p>}
        {visible.map((business, index) => <article id={`business-${business.id}`} key={business.id} className={`${styles.business} ${selected === business.id ? styles.selected : ""}`}>
          <button className={styles.select} aria-pressed={selected === business.id} onClick={() => { setSelected(business.id); setCenter({ lat: business.lat, lon: business.lon }); }}><span className={styles.number}>{index + 1}.</span><span><strong>{business.name}</strong><br /><span className={styles.muted}>{business.category}{business.address && ` · ${business.address}`}</span></span></button>
          <p className={styles.muted}>{business.distance != null ? `${business.distance} m away · ` : ""}{business.phone || "Phone not listed"} · {business.website ? "Website available" : "Website not listed"}</p>
          <div className={styles.actions}><button {...stylex.props(ui.primary)} onClick={() => { if (!userId) { router.push("/sign-in"); return; } setPitch(business); }}>Draft service pitch</button>{business.website && <a href={business.website} target="_blank" rel="noopener noreferrer">Website <ExternalLink size={12} /></a>}<a href={`https://www.google.com/maps/dir/?api=1&destination=${business.lat},${business.lon}`} target="_blank" rel="noopener noreferrer">Directions <ExternalLink size={12} /></a></div>
        </article>)}
        <p className={styles.note}>Business listings by <a href="https://www.geoapify.com/" target="_blank" rel="noopener noreferrer">Geoapify</a>. A missing phone or website does not mean the business has none.</p>
      </section>
    </div>
    <section className={styles.drafts} aria-label="Saved business pitches"><h2>My business pitches ({drafts.length})</h2>{!drafts.length && <p className={styles.muted}>Select a business to prepare a pitch with your services and portfolio. Drafts are saved in your account on this device.</p>}{drafts.map(draft => <article key={draft.id} className={styles.draft}><span className={styles.muted}>For {draft.recipient} · Draft, not sent</span><h3>{draft.title}</h3><p className={styles.muted}>{draft.body}</p><div className={styles.actions}><button {...stylex.props(ui.textButton)} onClick={async () => { try { await navigator.clipboard.writeText(`${draft.title}\n\n${draft.body}`); setMessage("Pitch copied."); } catch { setMessage("Copy is unavailable. Select the draft text to copy it."); } }}>Copy pitch</button><button {...stylex.props(ui.textButton)} onClick={() => update(current => ({ ...current, drafts: current.drafts.filter(item => item.id !== draft.id) }))}>Delete draft</button></div></article>)}</section>
    <Dialog.Root open={!!pitch} onOpenChange={open => { if (!open) setPitch(null); }}><Dialog.Portal><Dialog.Overlay className={hub.overlay} /><Dialog.Content className={hub.dialog}><div className={hub.dialogScroll}><div className={hub.dialogHeading}><Dialog.Title className={hub.dialogTitle}>Pitch your services</Dialog.Title><Dialog.Close aria-label="Close pitch" {...stylex.props(ui.iconButton)}><X size={18} /></Dialog.Close></div><Dialog.Description className={hub.dialogDescription}>Prepare a pitch for {pitch?.name} and include examples of your work. Saving a draft does not contact the business.</Dialog.Description><form className={styles.form} onSubmit={event => { event.preventDefault(); if (!pitch || !userId) return; const data = new FormData(event.currentTarget); update(current => ({ ...current, drafts: [{ id: crypto.randomUUID(), kind: "business-pitch", recipient: pitch.name, title: String(data.get("title")), body: `${data.get("body")}\n\nPortfolio: ${data.get("portfolio")}` }, ...current.drafts] })); setPitch(null); setMessage("Business pitch saved on this device."); }}><label {...stylex.props(ui.label)}>Service / subject<input name="title" required minLength={5} maxLength={140} placeholder="Website design for your business" {...stylex.props(ui.input)} /></label><label {...stylex.props(ui.label)}>Your pitch<textarea name="body" rows={6} required minLength={30} maxLength={5000} placeholder="Describe the service, relevant experience, estimated scope, and next step." {...stylex.props(ui.input)} /></label><label {...stylex.props(ui.label)}>Portfolio URL<input type="url" name="portfolio" required maxLength={500} placeholder="https://your-portfolio.com" {...stylex.props(ui.input)} /></label><button type="submit" {...stylex.props(ui.primary)}>Save pitch draft</button></form></div></Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
