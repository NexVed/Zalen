"use client";
import { createContext, useContext, useSyncExternalStore } from "react";
type Theme = "dark" | "light";
const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void }>({ theme: "dark", toggleTheme: () => {} });
function subscribe(callback: () => void) {
  window.addEventListener("zalen-theme", callback);
  return () => window.removeEventListener("zalen-theme", callback);
}
function snapshot(): Theme { return document.documentElement.dataset.theme === "light" ? "light" : "dark"; }
const serverSnapshot = (): Theme => "dark";
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  function toggleTheme() {
    const next = snapshot() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("zalen-theme", next); } catch { /* The theme still works without storage. */ }
    window.dispatchEvent(new Event("zalen-theme"));
  }
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
