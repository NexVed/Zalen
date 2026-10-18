import Image from "next/image";
import { ArrowDown, ArrowDownRight, ArrowUpRight, BriefcaseBusiness, Check, Code2, Compass, Folder, GitBranch, MapPin, MessageCircle, Plug, Radio, Store, Trophy, Users } from "lucide-react";
import { GetStarted } from "./GetStarted";
import { LandingMotion } from "./LandingMotion";
import styles from "./LandingPage.module.css";

const steps = [
  { number: "01", title: "Make your entrance.", text: "Create an account or sign in. Your overview brings the platform together, with profile setup ready when you are." },
  { number: "02", title: "Find your next project.", text: "Browse a startup brief, find a freelance gig, or spot a local business that could use your skills." },
  { number: "03", title: "Let your work speak.", text: "Apply with a proposal, add projects to your portfolio, and share what you’re building with the community." },
];

const questions = [
  { q: "Who is Zalen for?", a: "Students, freelancers, startup teams, and businesses. Whether you’re finding your first project or looking for someone to help build yours, there’s a place to start." },
  { q: "What can I find here?", a: "Startup bounties, freelance gigs, local businesses, investor and B2B directories, a public forum, and a community feed for sharing projects." },
  { q: "Do I need a finished portfolio?", a: "No. Start with an account and explore the dashboard. You can add your skills, projects, and background as you go." },
  { q: "Can I connect my own assistant?", a: "Yes. MCP connect in your profile gives you a guided setup for supported assistants. Create an access key, copy the configuration, and check the connection. You can revoke access at any time." },
];

export function LandingPage() {
  return <LandingMotion className={styles.page}>
    <header className={styles.header}>
      <a href="#main" className={styles.wordmark} aria-label="Zalen home"><Image src="/icon.svg" alt="" width={34} height={34} /><span>zalen<span className={styles.brandDot}>.</span></span></a>
      <nav className={styles.nav} aria-label="Landing page navigation"><a href="#about">The idea</a><a href="#platform">The platform</a><a href="#how-it-works">How it works</a></nav>
      <GetStarted />
    </header>

    <main id="main">
      <section className={styles.hero} data-hero aria-labelledby="landing-title">
        <div className={styles.heroCanvas}>
          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.orbit} /><div className={styles.orbitTwo} />
            <div className={styles.crystal} data-hero-art><Image src="/brand/zalen-crystal.png" alt="" fill sizes="(max-width: 700px) 90vw, 65vw" preload /></div>
            <span className={`${styles.callout} ${styles.calloutTop}`}>Ideas meet opportunity<i /></span>
            <span className={`${styles.callout} ${styles.calloutBottom}`}><i />Skills become real work</span>
            <span className={styles.visualIndex}>Z / 01</span>
          </div>
        </div>
        <div className={styles.heroStamp}><span className={styles.liveDot} />A place for people who build</div>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow} data-entrance>Projects. People. Possibilities.</p>
          <h1 id="landing-title" data-entrance>Find your people.<br />Build your<br /><em>next thing.</em></h1>
          <p className={styles.heroDescription} data-entrance>From your first freelance project to your next startup idea. Find the work, people, and opportunities to move it forward.</p>
          <div data-entrance><GetStarted light /></div>
          <div className={styles.heroBottom} data-entrance><span>YOUR NEXT CHAPTER STARTS HERE</span><ArrowDown size={18} aria-hidden="true" /></div>
        </div>
        <div className={styles.heroNote}><span className={styles.noteIcon}><ArrowUpRight size={28} /></span><div><strong>A place to find work.<br />And your kind of people.</strong><p>Your next opportunity has a starting point.</p></div></div>
      </section>

      <div className={styles.disciplines} aria-label="A platform for many kinds of work"><span>Design</span><span aria-hidden="true">/</span><span>Development</span><span aria-hidden="true">/</span><span>Business</span><span aria-hidden="true">/</span><span>Research</span><span aria-hidden="true">/</span><span>Everything in between</span></div>

      <section id="about" className={styles.about} aria-labelledby="about-title">
        <div className={styles.sectionLabel} data-reveal><span className={styles.smallDot} />THE IDEA BEHIND ZALEN<span>01 /</span></div>
        <div className={styles.aboutBody} data-reveal><h2 id="about-title">There’s a gap between<br />“I could do that” and<br /><span>“Here’s what I built.”</span></h2><div className={styles.aboutAside}><ArrowDownRight size={44} strokeWidth={1} aria-hidden="true" /><p>Zalen brings opportunities and the people ready for them into one space. Explore project briefs, discover businesses, and build a portfolio through the work you do.</p><p>For those starting out.<br />And those starting something.</p></div></div>
      </section>

      <section id="platform" className={styles.platform} aria-labelledby="platform-title">
        <div className={styles.sectionHeading} data-reveal><div><p className={styles.eyebrow}>ONE PLATFORM. DIFFERENT WAYS FORWARD.</p><h2 id="platform-title">More ways to<br /><span>make your move.</span></h2></div><p>Find a challenge. Meet a collaborator.<br />Turn a nearby business into your next pitch.</p></div>
        <div className={styles.bento}>
          <article className={`${styles.feature} ${styles.workCard}`} data-reveal>
            <div className={styles.cardTop}><span><Trophy size={17} /> BOUNTIES & GIGS</span><span>01</span></div>
            <h3>Good work starts<br />with a good brief.</h3><p>Startup challenges and freelance projects, with the scope, skills, and reward laid out before you apply.</p>
            <div className={styles.projectPreviews} aria-label="Illustrative project briefs">
              <div className={styles.projectPreview}><span className={styles.projectIcon}><Code2 size={20} /></span><div><small>STARTUP BOUNTY</small><strong>Build a better onboarding flow</strong><span>Development <i /> Product</span></div><ArrowUpRight size={20} /></div>
              <div className={styles.projectPreview}><span className={styles.projectIcon}><BriefcaseBusiness size={20} /></span><div><small>FREELANCE PROJECT</small><strong>A fresh website for a local café</strong><span>Design <i /> Web</span></div><ArrowUpRight size={20} /></div>
              <span className={styles.previewCaption}>A glimpse of the kinds of work you can find.</span>
            </div>
          </article>
          <article className={`${styles.feature} ${styles.mapCard}`} data-reveal>
            <div className={styles.cardTop}><span><MapPin size={17} /> LOCAL DISCOVERY</span><span>02</span></div>
            <h3>Your next client<br />could be next door.</h3><p>Explore businesses on the map, discover what they do, and prepare a pitch with your portfolio.</p>
            <div className={styles.mapPreview} aria-hidden="true">
              <svg viewBox="0 0 500 270" fill="none"><path d="M-30 180C80 90 90 230 220 110S370 30 530 90" stroke="#c4d4c1" strokeWidth="50" /><path d="M-20 55L520 220M-20 155L400 285M65-20L-10 290M210-20L110 290M365-20L270 290M500-10L405 290" stroke="#f8f8ee" strokeWidth="18" /><path d="M-20 55L520 220M210-20L110 290M500-10L405 290" stroke="#c5c7bb" strokeWidth="1" /><path d="M170 240L213 95L335 134L360 54" stroke="#e84873" strokeWidth="4" strokeDasharray="7 7" /></svg>
              <span className={`${styles.mapPin} ${styles.pinOne}`}><Store size={20} /></span><span className={`${styles.mapPin} ${styles.pinTwo}`}><MapPin size={21} /></span><span className={`${styles.mapPin} ${styles.pinThree}`}><Store size={18} /></span><span className={styles.mapLabel}>A new perspective on nearby.</span>
            </div>
          </article>
          <article className={`${styles.feature} ${styles.portfolioCard}`} data-reveal>
            <div className={styles.cardTop}><span><Folder size={17} /> YOUR PORTFOLIO</span><span>03</span></div>
            <div className={styles.portfolioVisual} aria-hidden="true"><div className={styles.sampleProject}><span>SELECTED WORK / 001</span><div className={styles.abstractShape} /><strong>Made by you.</strong></div><span className={styles.projectTag}><Check size={13} /> Skills, with something to show.</span></div>
            <h3>More than a résumé.</h3><p>Bring your skills, projects, and experience together in a profile that tells your story.</p>
          </article>
          <article className={`${styles.feature} ${styles.communityCard}`} data-reveal>
            <div className={styles.cardTop}><span><Users size={17} /> FORUM & COMMUNITY</span><span>04</span></div>
            <div className={styles.communityVisual} aria-hidden="true"><div><span className={styles.avatar}>D</span><span>Made a thing. Thoughts?</span></div><div><span className={styles.avatar}>R</span><span>Let’s build on that.</span></div><div><span className={styles.avatar}>A</span><span>I’ve been working on this too.</span></div></div>
            <h3>Build in good company.</h3><p>Share your progress, ask a question, and exchange feedback with people doing the work.</p>
          </article>
          <article className={`${styles.feature} ${styles.networkCard}`} data-reveal>
            <div className={styles.cardTop}><span><GitBranch size={17} /> INVESTORS & B2B</span><span>05</span></div>
            <div className={styles.networkVisual} aria-hidden="true"><span className={styles.networkOrbit} /><span className={styles.networkOrbit} /><span className={styles.networkCenter}>z.</span><span className={styles.networkNode}>Founders</span><span className={styles.networkNode}>Investors</span><span className={styles.networkNode}>Businesses</span></div>
            <h3>Find the right connection.</h3><p>Explore investor profiles, service providers, and partnership requests for your next step.</p>
          </article>
        </div>
      </section>

      <section className={styles.mcp} aria-labelledby="mcp-title" data-reveal>
        <div className={styles.mcpSurface} />
        <div className={styles.mcpCopy}><p className={styles.eyebrow}><Plug size={15} /> CONNECTED TO YOUR WORKFLOW</p><h2 id="mcp-title">Your workspace.<br />Meet your assistant.</h2><p>Connect Zalen to an assistant you already use. Find opportunities, work with your profile, and take action through MCP, with access you control.</p><div className={styles.mcpBenefits}><span><Check size={15} /> Guided setup</span><span><Check size={15} /> Personal access keys</span><span><Check size={15} /> Revoke anytime</span></div></div>
        <div className={styles.connectionDiagram} aria-label="Zalen connects to Claude Code, Codex, and other HTTP MCP clients"><div className={styles.connectionBrand}>zalen<span>.</span><small>YOUR WORKSPACE</small></div><div className={styles.connectionLine}><span /><Plug size={21} /><span /></div><div className={styles.clients}><div><Code2 size={17} />Claude Code</div><div><Compass size={17} />Codex</div><div><Radio size={17} />Other MCP clients</div></div><span className={styles.connectionCaption}>Your tools. Your permissions.</span></div>
        <span className={styles.mcpTab}>A MORE CONNECTED WAY TO WORK <ArrowUpRight size={16} /></span>
      </section>

      <section id="how-it-works" className={styles.how} aria-labelledby="how-title">
        <div className={styles.sectionHeading} data-reveal><div><p className={styles.eyebrow}>FROM CURIOUS TO CONNECTED</p><h2 id="how-title">A starting point.<br /><span>Then it’s your move.</span></h2></div><span className={styles.stepCount}>01 — 03 <ArrowDownRight size={30} strokeWidth={1.2} /></span></div>
        <div className={styles.steps}>{steps.map(step => <article key={step.number} data-reveal><span className={styles.stepNumber}>{step.number}<ArrowUpRight size={24} strokeWidth={1} /></span><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
      </section>

      <section className={styles.faq} aria-labelledby="faq-title"><div data-reveal><p className={styles.eyebrow}>BEFORE YOU JUMP IN</p><h2 id="faq-title">A few things<br />to know.</h2><MessageCircle size={50} strokeWidth={1} className={styles.faqIcon} aria-hidden="true" /></div><div className={styles.questions}>{questions.map(({ q, a }, index) => <article key={q} data-reveal><span>0{index + 1}</span><div><h3>{q}</h3><p>{a}</p></div></article>)}</div></section>

      <section className={styles.closing} aria-labelledby="closing-title" data-reveal><div className={styles.closingSurface} /><p className={styles.eyebrow}>THE NEXT THING WON’T BUILD ITSELF.</p><h2 id="closing-title">Let’s see what<br /><em>you can do.</em></h2><GetStarted /><span className={styles.closingMark} aria-hidden="true">z.</span><span className={styles.closingNote}>A place to start.<br />Room to grow.</span></section>
    </main>

    <footer className={styles.footer}><span className={styles.wordmark}>zalen<span className={styles.brandDot}>.</span></span><p>Projects, people, and what comes next.</p><span>© 2026 Zalen</span></footer>
  </LandingMotion>;
}
