"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import art from "@/lib/art.json";
import { HARDWARE, INSIDE, SITES, STEPS, STUDIO } from "@/lib/content";
import { BackgroundChapter } from "./Background";
import { Boot } from "./Boot";
import { Contact } from "./Contact";
import { DeskyChapter } from "./Desky";
import { HardwareChapter } from "./Hardware";
import { InsideChapter } from "./Inside";
import { DESKY, DeskyBoard, DeskyDisplays, DeskyPanel, DeskyShell, KEYCHAIN, KeyBack, KeyBattery, KeyBoard, KeyFront, KeyScreen } from "./parts";
import { Problem } from "./Problem";
import { ProcessChapter } from "./Process";
import { Cta, Plans, Proof, Ribbon } from "./Sections";
import { TangleChapter } from "./Tangle";

export function Story() {
  // Decide after mount: the server can't know the preference, and a first render
  // that differs from the server's HTML breaks hydration.
  const prefersReduced = useReducedMotion();
  const [reduce, setReduce] = useState(false);
  useEffect(() => setReduce(Boolean(prefersReduced)), [prefersReduced]);
  if (reduce)
    return (
      <>
        <Still />
        <Plans />
        <Proof />
        <Contact />
      </>
    );
  return (
    <>
      <Boot />
      <Problem />
      <DeskyChapter />
      <HardwareChapter />
      <ProcessChapter />
      <BackgroundChapter />
      <TangleChapter />
      <InsideChapter />
      <Ribbon />
      <Plans />
      <Proof />
      <Cta />
      <Contact />
    </>
  );
}

const PIECES = ["desky", "butterfly", "keychain"] as const;
// Each device, still and closed: Desky and the keychain are their SVG layers stacked up.
const PIECE_ART = {
  desky: (
    <span className="still-stack" style={{ aspectRatio: DESKY.w / DESKY.h }}>
      <DeskyShell />
      <DeskyBoard />
      <DeskyDisplays />
      <DeskyPanel />
    </span>
  ),
  butterfly: <img src="/art/butterfly.webp" alt="" width={art.butterfly.w} height={art.butterfly.h} loading="lazy" />,
  keychain: (
    <span className="still-stack" style={{ aspectRatio: KEYCHAIN.w / KEYCHAIN.h }}>
      <KeyBack />
      <KeyBattery />
      <KeyBoard />
      <KeyScreen />
      <KeyFront />
    </span>
  ),
};

/** The same story without scroll animation, for people who ask their device for less motion. */
function Still() {
  return (
    <div className="still">
      <section id="top" className="still-hero">
        <img src="/art/mac.webp" alt="A beige computer" width={art.mac.w} height={art.mac.h} />
        <div>
          <h1>
            <span className="tape">
              Websites people <em>trust</em>,
            </span>
            <br />
            <span className="tape">by {STUDIO}.</span>
          </h1>
          <p>
            Getting a website is easy. Getting one people trust is hard. We are a studio of two in Bengaluru: we design brands and build fast
            websites for founders and local businesses.
          </p>
          <a className="btn btn-ink" href="#contact">
            Work with us
          </a>
        </div>
      </section>
      <section id="work" className="still-grid">
        <h2 className="still-h">Websites we&apos;ve built</h2>
        {SITES.map((s) => (
          <article key={s.slug} className="card still-card">
            <img src={`/sites/${s.slug}-0.jpg`} alt={`${s.name} on a phone`} width={780} height={1688} loading="lazy" />
            <h3 className="card-title">{s.name}</h3>
            <p>{s.line}</p>
            <a className="btn btn-ink" href={s.url} target="_blank" rel="noopener">
              Visit ↗
            </a>
          </article>
        ))}
      </section>
      <section id="hardware" className="still-grid">
        <h2 className="still-h">Hardware on our desk</h2>
        {PIECES.map((k) => (
          <article key={k} className="card still-card">
            <span role="img" aria-label={`Illustration of the ${HARDWARE[k].name}`}>
              {PIECE_ART[k]}
            </span>
            <p className="eyebrow">{HARDWARE[k].status}</p>
            <h3 className="card-title">{HARDWARE[k].name}</h3>
            <p>{HARDWARE[k].line}</p>
          </article>
        ))}
      </section>
      <section id="process" className="still-grid">
        <h2 className="still-h">How we work</h2>
        {STEPS.map((s) => (
          <article key={s.tab} className={`card still-card still-${s.tone}`}>
            <p className="eyebrow">{s.tab}</p>
            <h3 className="card-title">{s.lead}</h3>
            <p>{[...s.lines, ...s.close].join(" ")}</p>
          </article>
        ))}
      </section>
      <section className="still-grid">
        <h2 className="still-h">How {STUDIO} works</h2>
        {INSIDE.map((b) => (
          <article key={b.tone} className="card still-card">
            <h3 className="card-title">{b.note}</h3>
            <ul className="chips">
              {b.tags.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
