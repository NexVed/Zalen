import type { Metadata } from "next";
import { Providers } from "@/app/providers";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "./globals.css";
export const metadata: Metadata = {
  title: "Zalen — Where potential becomes opportunity",
  description: "Find your next startup challenge, show what you can do, and turn real work into your next opportunity.",
};
const themeScript = `(function(){try{var t=localStorage.getItem('zalen-theme');document.documentElement.dataset.theme=t==='light'||t==='dark'?t:window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}catch(e){}})()`;
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body><a className="skip-link" href="#main">Skip to content</a><Providers>{children}</Providers></body>
    </html>
  );
}
