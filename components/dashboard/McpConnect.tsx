"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronRight, Code2, Copy, ExternalLink, Eye, EyeOff, KeyRound, Link2, Loader2, MessageCircle, Plug, RotateCw, ShieldCheck, Terminal, Trash2 } from "lucide-react";
import { useLiveQuery } from "@/lib/use-live-query";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ServiceState } from "./ServiceState";
import styles from "./McpConnect.module.css";

const endpoint = process.env.NEXT_PUBLIC_MCP_URL ?? "http://127.0.0.1:8080/mcp";
const clients = [
  { id: "claude", name: "Claude Code", description: "Terminal & editor", icon: MessageCircle },
  { id: "codex", name: "Codex", description: "App, CLI & editor", icon: Terminal },
  { id: "other", name: "Other app", description: "HTTP MCP clients", icon: Code2 },
] as const;
type Client = typeof clients[number]["id"];
type Connection = "idle" | "checking" | "reachable" | "verified" | "failed";

export function McpConnect({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const { data: keys, error: keysFailed, retry } = useLiveQuery(api.mcp.listKeys, signedIn ? {} : "skip");
  const createKey = useMutation(api.mcp.createKey);
  const revokeKey = useMutation(api.mcp.revokeKey);
  const [client, setClient] = useState<Client>("claude");
  const [step, setStep] = useState(1);
  const [name, setName] = useState("Claude Code");
  const [token, setToken] = useState("");
  const [existingToken, setExistingToken] = useState("");
  const [createdKeyId, setCreatedKeyId] = useState<Id<"mcpKeys"> | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<Id<"mcpKeys"> | null>(null);
  const [showSecrets, setShowSecrets] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");
  const [connection, setConnection] = useState<Connection>("idle");
  const [connectionMessage, setConnectionMessage] = useState("");
  const selected = clients.find(item => item.id === client)!;
  const local = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?=[:/]|$)/.test(endpoint);

  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setCopied(label); setError(""); }
    catch { setError("Copy is unavailable. Show and select the configuration to copy it manually."); }
  }
  async function create() {
    if (!signedIn) { router.push("/sign-in"); return; }
    setBusy(true); setError("");
    try {
      const created = await createKey({ name: name.trim() || selected.name });
      setToken(created.token); setCreatedKeyId(created.id); setShowSecrets(false); setCopied(""); setConnection("idle"); setStep(3);
    } catch { setError("Could not create a key. Try again, or check your connection."); }
    finally { setBusy(false); }
  }
  async function revoke(keyId: Id<"mcpKeys">) {
    setBusy(true); setError("");
    try {
      await revokeKey({ keyId });
      if (keyId === createdKeyId) { setToken(""); setCreatedKeyId(null); setConnection("idle"); }
      setRevokeTarget(null);
    } catch { setError("Could not revoke this key. Please try again."); }
    finally { setBusy(false); }
  }
  async function checkConnection() {
    setConnection("checking"); setConnectionMessage("");
    try {
      const signal = AbortSignal.timeout(8000);
      async function rpc(method: string, params: object = {}) {
        const response = await fetch(endpoint, { method: "POST", signal, credentials: "omit", headers: { "Content-Type": "application/json", Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
        if (!response.ok) throw new Error("The server did not accept the connection.");
        const payload = await response.json();
        if (payload.error || payload.result?.isError) throw new Error("The server could not verify this key. Check the key and try again.");
        return payload.result;
      }
      const info = await rpc("initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "zalen-setup", version: "1.0" } });
      if (info?.serverInfo?.name !== "zalen") throw new Error("This endpoint did not identify itself as Zalen.");
      if (token) {
        await rpc("tools/call", { name: "zalen_whoami", arguments: {} });
        setConnection("verified"); setConnectionMessage("Your key is verified. Add the configuration to your app to finish connecting.");
      } else {
        setConnection("reachable"); setConnectionMessage("The server is reachable. Add a key to check access to your account.");
      }
    } catch (reason) {
      setConnection("failed"); setConnectionMessage(reason instanceof TypeError || reason instanceof DOMException ? "Couldn’t reach the server. Check that it is running and allows this website to connect." : reason instanceof Error ? reason.message : "Could not verify the connection.");
    }
  }
  function config(secret: string) {
    if (client === "codex") return `[mcp_servers.zalen]\nurl = ${JSON.stringify(endpoint)}\nhttp_headers = { Authorization = ${JSON.stringify(`Bearer ${secret}`)} }`;
    return JSON.stringify({ mcpServers: { zalen: { type: "http", url: endpoint, headers: { Authorization: `Bearer ${secret}` } } } }, null, 2);
  }
  const displayToken = token ? showSecrets ? token : "<key hidden — included when you copy>" : "<your Zalen key>";

  return <section className={styles.card} aria-labelledby="mcp-heading">
    <header className={styles.header}><span className={styles.emblem}><Plug size={23} /></span><div><h2 id="mcp-heading">Connect your app to Zalen</h2><p>Use your projects, opportunities, and community from your preferred assistant.</p></div><span className={styles.transport}>MCP</span></header>
    <div className={styles.steps} role="group" aria-label="Connection setup steps">{["Choose app", "Access key", "Connect & check"].map((label, index) => <button key={label} onClick={() => { setStep(index + 1); setError(""); }} aria-current={step === index + 1 ? "step" : undefined}><span>{step > index + 1 ? <Check size={13} /> : index + 1}</span>{label}{index < 2 && <ChevronRight size={14} />}</button>)}</div>
    <div className={styles.body}>
      {step === 1 && <>
        <div className={styles.sectionHeading}><h3>Which app would you like to connect?</h3><p>We’ll show the setup format for your app.</p></div>
        <div className={styles.clients}>{clients.map(({ id, name: clientName, description, icon: Icon }) => <button key={id} aria-pressed={client === id} onClick={() => { setClient(id); setName(clientName); setCopied(""); }}><Icon size={24} /><strong>{clientName}</strong><span>{description}</span>{client === id && <CheckCircle2 className={styles.selected} size={17} />}</button>)}</div>
        <div className={styles.actions}><span className={styles.helper}>Works with HTTP MCP connections.</span><button className={styles.primary} onClick={() => setStep(2)}>Continue <ArrowRight size={15} /></button></div>
      </>}
      {step === 2 && <>
        <div className={styles.sectionHeading}><h3>Create an access key</h3><p>Give this connection a name so you can recognize it later.</p></div>
        <form className={styles.keyForm} onSubmit={event => { event.preventDefault(); void create(); }}><label>Connection name<input value={name} onChange={event => setName(event.target.value)} maxLength={60} required placeholder="e.g. My laptop" /></label><button type="submit" className={styles.primary} disabled={busy || (signedIn && keys === undefined) || keysFailed || (keys?.length ?? 0) >= 5}>{busy ? <Loader2 size={15} /> : <KeyRound size={15} />}{busy ? "Creating…" : signedIn ? "Create access key" : "Sign in to continue"}</button></form>
        <p className={styles.scope}><ShieldCheck size={16} />This key lets your app read your Zalen account and use its tools to post, apply, comment, and update your profile. You can revoke it below.</p>
        {token && <button className={styles.textButton} onClick={() => setStep(3)}>Continue with the key from this session <ArrowRight size={14} /></button>}
        {signedIn && <details className={styles.existing}><summary>Already have a key?</summary><form onSubmit={event => { event.preventDefault(); setToken(existingToken.trim()); setExistingToken(""); setCreatedKeyId(null); setShowSecrets(false); setConnection("idle"); setCopied(""); setStep(3); }}><label>Your existing Zalen key<input type="password" value={existingToken} onChange={event => setExistingToken(event.target.value)} autoComplete="off" required minLength={12} maxLength={512} placeholder="Paste your saved key" /></label><button type="submit" className={styles.secondary}>Use this key <ArrowRight size={14} /></button></form></details>}
        <div className={styles.actions}><button className={styles.textButton} onClick={() => setStep(1)}><ArrowLeft size={15} />Back</button><button className={styles.textButton} onClick={() => setStep(3)}>View setup first <ArrowRight size={15} /></button></div>
      </>}
      {step === 3 && <>
        <div className={styles.sectionHeading}><h3>Add Zalen to {selected.name}</h3><p>{client === "codex" ? "Add this to your Codex config.toml under MCP servers." : client === "claude" ? "Add this server to your Claude Code .mcp.json configuration." : "Add an HTTP server named “zalen” in your app’s MCP settings."}</p></div>
        <div className={styles.endpoint}><Link2 size={17} /><div><span>Server URL</span><code>{endpoint}</code></div><button aria-label="Copy server URL" title="Copy server URL" onClick={() => void copy(endpoint, "URL")}>{copied === "URL" ? <Check size={16} /> : <Copy size={16} />}</button></div>
        {local && <p className={styles.helper}>This address works on this computer. Cloud-hosted assistants need a publicly reachable HTTPS server.</p>}
        {token ? <p className={styles.success}><CheckCircle2 size={16} />Key ready. Copy it before leaving this page; it won’t be shown again.</p> : <p className={styles.helper}>The preview contains a placeholder. <button className={styles.textButton} onClick={() => setStep(2)}>Add your access key</button> to copy a complete configuration.</p>}
        <div className={styles.codePanel}><div className={styles.codeHeading}><span>{client === "codex" ? "config.toml" : "MCP configuration · JSON"}</span>{token && <button className={styles.textButton} onClick={() => setShowSecrets(value => !value)}>{showSecrets ? <EyeOff size={14} /> : <Eye size={14} />}{showSecrets ? "Hide key" : "Show key"}</button>}</div><pre tabIndex={0} aria-label="MCP configuration preview">{config(displayToken)}</pre><button className={styles.copyButton} disabled={!token} onClick={() => void copy(config(token), "configuration")}>{copied === "configuration" ? <Check size={15} /> : <Copy size={15} />}{copied === "configuration" ? "Copied configuration" : "Copy configuration"}</button></div>
        <div className={styles.check}><div><h4>Check your connection</h4><p>Tests the server and, when provided, your access key. No posts or profile changes are made.</p></div><button className={styles.secondary} disabled={connection === "checking"} onClick={() => void checkConnection()}>{connection === "checking" ? <Loader2 size={15} /> : <RotateCw size={15} />}{connection === "checking" ? "Checking…" : "Test connection"}</button></div>
        {connectionMessage && <p className={connection === "failed" ? styles.error : styles.success} role="status">{connection === "verified" || connection === "reachable" ? <CheckCircle2 size={16} /> : <Link2 size={16} />}{connectionMessage}</p>}
        <div className={styles.actions}><button className={styles.textButton} onClick={() => setStep(2)}><ArrowLeft size={15} />Back</button><a className={styles.textButton} href={client === "codex" ? "https://developers.openai.com/codex/mcp/" : "https://code.claude.com/docs/en/mcp"} target="_blank" rel="noopener noreferrer">Setup guide <ExternalLink size={13} /></a></div>
      </>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      {copied && <p className={styles.srOnly} role="status">Copied {copied}.</p>}
    </div>
    <section className={styles.keys} aria-labelledby="connection-keys-heading"><div className={styles.sectionHeading}><h3 id="connection-keys-heading">Your access keys <span>{keys?.length ?? 0} / 5</span></h3><p>Each app can have its own key. Revoking a key stops that connection.</p></div>
      {!signedIn ? <p className={styles.helper}>Sign in to create and manage your connection keys.</p> : keysFailed ? <ServiceState title="Connection keys" onRetry={retry} /> : keys === undefined ? <p className={styles.helper} role="status">Loading your keys…</p> : !keys.length ? <p className={styles.helper}>No access keys yet. Create one in step 2.</p> : keys.map(key => <article key={key.id} className={styles.keyRow}><span className={styles.keyIcon}><KeyRound size={17} /></span><div><strong>{key.name}</strong><p><code>{key.prefix}…</code> · {key.lastUsedAt ? `Last used ${new Date(key.lastUsedAt).toLocaleDateString()}` : "Not used yet"}</p></div>{revokeTarget === key.id ? <div className={styles.revokeActions}><button disabled={busy} className={styles.dangerButton} onClick={() => void revoke(key.id)}>Confirm revoke</button><button className={styles.textButton} onClick={() => setRevokeTarget(null)}>Cancel</button></div> : <button className={styles.textButton} disabled={busy} onClick={() => setRevokeTarget(key.id)}><Trash2 size={14} />Revoke</button>}</article>)}
    </section>
  </section>;
}
