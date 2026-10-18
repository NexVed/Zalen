"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function LandingMotion({ children, className }: { children: ReactNode; className: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    // Content is visible before JS loads, and remains readable if animation fails.
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (disposed || !root.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-entrance]", { y: 28, opacity: 0, duration: 0.9, stagger: 0.12, ease: "power3.out", clearProps: "all" });
        gsap.utils.toArray<HTMLElement>("[data-reveal]", root.current!).forEach(element => {
          gsap.from(element, {
            y: 36, opacity: 0, duration: 0.8, ease: "power3.out", clearProps: "all",
            scrollTrigger: { trigger: element, start: "top 94%", once: true },
          });
        });
        gsap.to("[data-hero-art]", {
          y: 45, rotation: 4, ease: "none",
          scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: 1 },
        });
      }, root);
      cleanup = () => media.revert();
    }).catch(() => { /* The static page remains usable without animation. */ });
    return () => { disposed = true; cleanup?.(); };
  }, []);

  return <div ref={root} className={className}>{children}</div>;
}
