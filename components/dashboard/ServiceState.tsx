"use client";
import { Component, type ReactNode } from "react";
import { AlertCircle, RotateCw } from "lucide-react";
import { clerkConfigured } from "@/lib/auth-config";
import styles from "./ServiceState.module.css";

export function ServiceState({ title, loading = false, onRetry }: { title: string; loading?: boolean; onRetry?: () => void }) {
  return <div className={styles.state} role="status" aria-live="polite" aria-busy={loading}>
    {loading ? <><span>Loading {title.toLowerCase()}…</span><div className={styles.skeleton} /><div className={styles.skeleton} /><div className={styles.skeleton} /></> : <><AlertCircle size={24} /><h3>{title} is temporarily unavailable</h3><p>We couldn’t load this section. Your other pages are still available.</p>{onRetry && <button onClick={onRetry}><RotateCw size={15} />Try again</button>}</>}
  </div>;
}

export class ServiceBoundary extends Component<{ children: ReactNode; title: string }, { failed: boolean; attempt: number }> {
  state = { failed: false, attempt: 0 };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!clerkConfigured || !process.env.NEXT_PUBLIC_CONVEX_URL) return <ServiceState title={this.props.title} />;
    if (this.state.failed) return <ServiceState title={this.props.title} onRetry={() => this.setState(value => ({ failed: false, attempt: value.attempt + 1 }))} />;
    return <div key={this.state.attempt}>{this.props.children}</div>;
  }
}
