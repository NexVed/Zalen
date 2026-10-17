"use client";
import Image from "next/image";
import * as stylex from "@stylexjs/stylex";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, Compass, Eye, FolderCheck, Sparkles, Check, Plus } from "lucide-react";
import { colors } from "@/styles/tokens.stylex";
import { ui } from "./ui";
import type { DemoState } from "@/lib/demo-data";

const views = [12, 10, 18, 16, 24, 20, 32, 28, 43, 36, 47, 56].map((value, index) => ({ value, index }));
export function Overview({ state, total, onExplore, onProfile, onWorkspace }: { state: DemoState; total: number; onExplore: () => void; onProfile: () => void; onWorkspace: () => void }) {
  const complete = Boolean(state.profile.link);
  return <>
    <section {...stylex.props(s.heroGrid)} aria-label="Your launchpad">
      <div {...stylex.props(s.hero)}>
        <div {...stylex.props(s.heroContent)}>
          <span {...stylex.props(s.eyebrow)}><span {...stylex.props(s.star)}><Sparkles size={13} /></span> A LITTLE AMBITION GOES A LONG WAY</span>
          <h2 {...stylex.props(s.heroTitle)}>Your potential.<br /><span {...stylex.props(s.gradientText)}>Meet possibility.</span></h2>
          <p {...stylex.props(s.heroBody)}>Real challenges. Inspiring startups. Your next big thing.<br />Let your work open the right doors.</p>
          <button {...stylex.props(ui.primary, s.heroButton)} onClick={onExplore}>Explore opportunities <ArrowUpRight size={16} /></button>
        </div>
        <div {...stylex.props(s.art)}><Image src="/brand/zalen-crystal.png" alt="Zalen's crystalline Z surrounded by glowing pink and gold orbital rings" fill sizes="(max-width: 700px) 300px, 500px" preload {...stylex.props(s.artImage)} /></div>
        <span {...stylex.props(s.artCaption)}>BUILT FOR YOUR NEXT CHAPTER</span>
      </div>
      <div {...stylex.props(ui.card, s.profile)}>
        <div {...stylex.props(ui.between)}><span {...stylex.props(ui.pill, ui.pink)}><Sparkles size={11} /> YOUR GROWTH SPACE</span><ArrowUpRight size={17} {...stylex.props(ui.muted)} /></div>
        <div {...stylex.props(s.profileMiddle)}><div><h2 {...stylex.props(s.profileTitle)}>A little more you.<br />A lot more possibility.</h2><p {...stylex.props(s.profileText)}>A complete profile helps the<br />right opportunities find you.</p></div><div {...stylex.props(s.ring)}><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="43" fill="none" stroke="var(--border)" strokeWidth="5" /><circle cx="50" cy="50" r="43" fill="none" stroke="var(--accent-primary)" strokeWidth="5" strokeDasharray={`${complete ? 270 : 216} 270`} strokeLinecap="round" transform="rotate(-90 50 50)" /></svg><span {...stylex.props(s.ringValue)}>{complete ? "100" : "80"}<small>%</small></span></div></div>
        <div {...stylex.props(s.profileBottom)}><span {...stylex.props(ui.row, ui.caption)}><Check size={12} {...stylex.props(s.check)} /> Skills added <Check size={12} {...stylex.props(s.check)} /> Interests set</span><button {...stylex.props(ui.textButton, s.profileLink)} onClick={onProfile}>{complete ? "Edit profile" : "Complete profile"}<ArrowRight size={14} /></button></div>
      </div>
    </section>
    <section {...stylex.props(s.stats)} aria-label="Your activity at a glance">
      <button {...stylex.props(ui.card, s.stat)} onClick={onExplore}><div {...stylex.props(ui.between)}><span {...stylex.props(s.statLabel)}>Opportunities for you</span><Compass size={16} {...stylex.props(s.pinkIcon)} /></div><div {...stylex.props(ui.between)}><span {...stylex.props(s.statValue)}>{String(total).padStart(2, "0")}</span><span {...stylex.props(ui.pill, ui.green)}><Sparkles size={10} /> Matched to your skills</span></div><span {...stylex.props(s.statFoot)}>A new starting point is waiting <ArrowUpRight size={12} /></span></button>
      <button {...stylex.props(ui.card, s.stat)} onClick={onWorkspace}><div {...stylex.props(ui.between)}><span {...stylex.props(s.statLabel)}>Active applications</span><BriefcaseBusiness size={16} {...stylex.props(s.orangeIcon)} /></div><div {...stylex.props(ui.between)}><span {...stylex.props(s.statValue)}>{String(state.applications.length).padStart(2, "0")}</span><div {...stylex.props(s.stageDots)}><i /><i /><i /></div></div><span {...stylex.props(s.statFoot)}><span {...stylex.props(s.highlight)}>1 shortlisted</span> Keep your momentum going</span></button>
      <button {...stylex.props(ui.card, s.stat)} onClick={onWorkspace}><div {...stylex.props(ui.between)}><span {...stylex.props(s.statLabel)}>Portfolio projects</span><FolderCheck size={16} {...stylex.props(s.purpleIcon)} /></div><div {...stylex.props(ui.between)}><span {...stylex.props(s.statValue)}>{String(state.portfolio.length).padStart(2, "0")}</span><span {...stylex.props(ui.row, s.projectTiles)}><span>F</span><span>H</span><Plus size={12} /></span></div><span {...stylex.props(s.statFoot)}>Your work. Your story. Your proof. <ArrowUpRight size={12} /></span></button>
      <div {...stylex.props(ui.card, s.stat)}><div {...stylex.props(ui.between)}><span {...stylex.props(s.statLabel)}>Profile views</span><Eye size={16} {...stylex.props(s.blueIcon)} /></div><div {...stylex.props(ui.between)}><span {...stylex.props(s.statValue)}>128</span><div {...stylex.props(s.chart)} role="img" aria-label="Demo profile views trend upward over the last 7 days"><ResponsiveContainer width="100%" height={44} initialDimension={{ width: 110, height: 44 }}><AreaChart data={views}><defs><linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.25} /><stop offset="100%" stopColor="var(--accent-primary)" stopOpacity={0} /></linearGradient></defs><Area type="monotone" dataKey="value" stroke="var(--accent-primary)" strokeWidth={1.8} fill="url(#viewsFill)" isAnimationActive={false} /></AreaChart></ResponsiveContainer></div></div><span {...stylex.props(s.statFoot)}><span {...stylex.props(s.highlight)}>↗ 24.3%</span> vs. last 7 days</span></div>
    </section>
  </>;
}
const s = stylex.create({
  heroGrid: { display: "grid", gridTemplateColumns: { default: "1.85fr 1fr", "@media (max-width: 1000px)": "1fr" }, gap: 20, marginBottom: 20 },
  hero: { position: "relative", overflow: "hidden", borderRadius: 18, minHeight: 260, backgroundColor: "var(--hero-bg)", backgroundImage: "radial-gradient(ellipse at 90% 70%, var(--hero-wash), transparent 65%)", border: "1px solid", borderColor: colors.border },
  heroContent: { position: "relative", zIndex: 2, padding: { default: "28px 32px", "@media (max-width: 700px)": "26px 22px" } },
  eyebrow: { display: "flex", alignItems: "center", gap: 7, fontSize: 9, fontWeight: 600, letterSpacing: "1.5px", color: colors.body },
  star: { color: colors.pink, display: "inline-flex" },
  heroTitle: { fontFamily: "var(--font-display)", fontSize: { default: 36, "@media (max-width: 700px)": 30 }, lineHeight: 1.12, letterSpacing: "-1.4px", fontWeight: 600, marginTop: 14 },
  gradientText: { backgroundImage: "linear-gradient(90deg, var(--accent-secondary), var(--accent-warm))", backgroundClip: "text", color: "transparent" },
  heroBody: { color: colors.body, fontSize: 11, lineHeight: 1.8, marginTop: 12 },
  heroButton: { marginTop: 18, minHeight: 38, fontSize: 11, padding: "9px 15px" },
  art: { position: "absolute", right: { default: -32, "@media (max-width: 700px)": -85 }, top: -6, width: "51%", height: "104%", maskImage: "linear-gradient(to right, transparent, black 28%, black 78%, transparent)", opacity: { default: 0.9, "@media (max-width: 700px)": 0.4 } },
  artImage: { objectFit: "cover", objectPosition: "center", maskImage: "linear-gradient(to bottom, transparent, black 14%, black 80%, transparent)" },
  artCaption: { position: "absolute", right: 30, bottom: 20, fontSize: 7, letterSpacing: "2px", color: colors.muted, display: { default: "block", "@media (max-width: 700px)": "none" } },
  profile: { padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between", backgroundImage: "radial-gradient(ellipse at 100% 0%, var(--hero-wash), transparent 70%)" },
  profileMiddle: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBlock: 21 },
  profileTitle: { fontFamily: "var(--font-display)", fontSize: 22, letterSpacing: "-0.6px", lineHeight: 1.35, fontWeight: 500 },
  profileText: { color: colors.muted, fontSize: 11, lineHeight: 1.7, marginTop: 10 },
  ring: { position: "relative", width: 88, height: 88, flexShrink: 0 },
  ringValue: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 500, gap: 1 },
  profileBottom: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, borderTop: "1px solid", borderColor: colors.subtleBorder, paddingTop: 15, flexWrap: "wrap" },
  profileLink: { color: colors.primary, fontSize: 11 },
  check: { color: colors.green },
  stats: { display: "grid", gridTemplateColumns: { default: "repeat(4, minmax(0, 1fr))", "@media (max-width: 900px)": "repeat(2, minmax(0, 1fr))", "@media (max-width: 400px)": "1fr" }, gap: 16, marginBottom: 32 },
  stat: { padding: "19px 22px", textAlign: "left", color: colors.foreground, display: "flex", flexDirection: "column", gap: 12, transition: "border-color 150ms", borderColor: { default: colors.subtleBorder, ":hover": colors.border } },
  statLabel: { fontSize: 11, color: colors.body },
  statValue: { fontFamily: "var(--font-display)", fontSize: 32, lineHeight: 1, fontWeight: 500, letterSpacing: "-1px" },
  statFoot: { display: "flex", alignItems: "center", gap: 6, color: colors.muted, fontSize: 9, minHeight: 14, flexWrap: "wrap" },
  pinkIcon: { color: colors.pink }, orangeIcon: { color: colors.warm }, purpleIcon: { color: colors.purple }, blueIcon: { color: colors.blue },
  highlight: { color: colors.green },
  chart: { width: 110, height: 44, minWidth: 0 },
  projectTiles: { color: colors.purple, fontFamily: "var(--font-display)", gap: 12, backgroundColor: colors.softPurple, borderRadius: 6, padding: "6px 10px", fontSize: 13 },
  stageDots: { display: "flex", gap: 5, height: 7, width: 72, borderRadius: 4, backgroundImage: "linear-gradient(to right, var(--accent-primary) 35%, var(--accent-warm) 35%, var(--accent-warm) 65%, var(--border) 65%)" },
});
