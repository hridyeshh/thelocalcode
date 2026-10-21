"use client";

import { motion, type MotionStyle, type MotionValue, useTransform } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import { DESKY_PARTS, DESKY_SETS, HARDWARE, INTRO, SITES } from "@/lib/content";
import { useChapter, useViewport } from "@/lib/story";
import { at, length, mix, seg, stops, tipped, type Range } from "@/lib/stops";
import { introType } from "./Mac";
import { DESKY, DeskyBoard, DeskyDisplays, DeskyPanel, DeskyShell, DeskySignal } from "./parts";
import { DeskyIcon, type DeskyWidget, PixelPet } from "./svg";
import { Callout, Chapter, pct, usePast } from "./ui";

const BEATS = [
  ["intro", 0.8],
  ["enter", 0.9],
  ["swap", 1.5],
  ["open", 0.9],
  ["screens", 0.7],
  ["pi", 0.7],
  ["wires", 0.7],
  ["close", 0.9],
  ["sites", 0.8],
  ["zoom1", 0.9],
  ["hold1", 1.4],
  ["pan2", 0.7],
  ["hold2", 1.4],
  ["pan3", 0.7],
  ["hold3", 1.4],
  ["out", 0.9],
  ["rest", 0.25],
] as const;
const B = stops(BEATS);
const SCREENS = DESKY.screens;
const SCREEN_ASPECT = (SCREENS[0].w * DESKY.w) / (SCREENS[0].h * DESKY.h); // width / height
const CX = SCREENS.map((s) => s.x + s.w / 2);
const CY = SCREENS[0].y + SCREENS[0].h / 2;
const HOLDS: Range[] = [B.hold1, B.hold2, B.hold3];
const ENTERS: Range[] = [B.zoom1, B.pan2, B.pan3];
const PARTS: Range[] = [B.screens, B.pi, B.wires];
// Each screen redraws top to bottom, one after another, like the real TFTs refreshing.
const redraws = (r: Range, from: number, len: number, step: number): Range[] =>
  [0, 1, 2].map((i) => [at(r, from + i * step), at(r, from + len + i * step)] as const);
const WIDGET_SWAPS = redraws(B.swap, 0.1, 0.22, 0.26);
const SITE_SWAPS = redraws(B.sites, 0, 0.45, 0.2);
const HOME_SWAPS = redraws(B.out, 0.3, 0.3, 0.2); // zooming out, the screens go back to being a desk display
// Each screen scrolls through three stacked phone captures (780×1688 each).
const VISIBLE = 1 / SCREEN_ASPECT / ((3 * 1688) / 780);
const HW = HARDWARE.desky;
const CARD_MAX = 340; // site card width cap; keep in sync with .site-card
const APP = ["clock", "weather", "music", "timer", "gif", "quote", "pet"] as const;
// Where each callout points, in the drawing's units: the third screen, the Pi, the wiring.
const ANCHORS = [
  [1048, 600],
  [905, 700],
  [872, 486],
] as const;

const zoomed = (v: number) => (v < B.out[0] ? seg(v, B.zoom1) : 1 - seg(v, [B.out[0], at(B.out, 0.8)]));
const focusAt = (v: number) => (v < B.pan3[0] ? mix(CX[0], CX[1], seg(v, B.pan2)) : mix(CX[1], CX[2], seg(v, B.pan3)));
const wipe = (t: number) => `inset(0 0 ${(1 - t) * 100}% 0)`;

/**
 * Desky's size for a viewport. Author big, scale down: at scale 1 a screen is as large as it
 * gets when zoomed in, so the website inside is drawn at full resolution, not upscaled.
 * One function of the viewport, so no motion value reads both the viewport and something
 * derived from it (those go stale when the viewport changes).
 */
export function deskyGeometry(vw: number, vh: number) {
  const wide = vw > 760;
  const screenH = Math.min((vw < vh ? 0.6 : 0.78) * vh, (0.86 * vw) / SCREEN_ASPECT);
  const boxH = screenH / SCREENS[0].h;
  const boxW = boxH * (DESKY.w / DESKY.h);
  const rest = Math.min(((wide ? 0.5 : 0.9) * vw) / boxW, (0.46 * vh) / boxH);
  // Zoomed in, the site card sits on the left, so slide the screen right until it clears it.
  const cardRight = 0.04 * vw + Math.min(CARD_MAX, 0.27 * vw);
  const clear = wide ? Math.max(0, cardRight + 0.03 * vw + (screenH * SCREEN_ASPECT) / 2 - vw / 2) : 0;
  return { boxW, boxH, rest, clear, vh, d: 2.4 * boxW };
}

/** Everything that moves, at progress v: the camera (zoom and pan) and the exploded view. */
function scene(v: number, g: ReturnType<typeof deskyGeometry>) {
  const z = zoomed(v);
  // It tips back to lie face-up and comes apart layer by layer; closing, the layers settle
  // first, then it stands back up.
  const settle = seg(v, [B.close[0], at(B.close, 0.6)]);
  const tip = seg(v, [B.open[0], at(B.open, 0.6)]) * (1 - seg(v, [at(B.close, 0.4), B.close[1]]));
  const apart = (r: Range) => seg(v, r) * (1 - settle);
  const panel = apart([at(B.open, 0.3), B.open[1]]);
  const screens = apart([B.screens[0], at(B.screens, 0.7)]);
  const pi = apart([B.pi[0], at(B.pi, 0.7)]);
  // (each layer sits one unit above the last: coplanar layers would z-fight while it tips)
  const board = g.boxW * 0.08 * pi + 1;
  const displays = board + g.boxW * 0.15 * screens + 1;
  const bare = apart([B.wires[0], at(B.wires, 0.6)]);
  const slide = g.boxH * 0.3 * bare; // the screens slide back to bare the wiring
  const grow = g.rest ** (1 - z); // geometric: an even zoom
  const s = grow * (1 - 0.16 * tip);
  const x = (-(focusAt(v) - 0.5) * g.boxW * grow + g.clear) * z;
  const y = -(CY - 0.5) * g.boxH * grow * z - 0.05 * g.vh * tip + 0.09 * g.vh * bare;
  const view = { rx: 50 * tip, rz: -24 * tip, s, d: g.d, tx: x, ty: y };
  const calls = ANCHORS.map(([ax, ay], i) =>
    tipped((ax / DESKY.w - 0.5) * g.boxW, (ay / DESKY.h - 0.5) * g.boxH - (i ? 0 : slide), i ? board : displays, view),
  );
  return { s, x, y, rx: view.rx, rz: view.rz, board, displays, panel: displays + g.boxW * 0.2 * panel + 1, slide: -slide, wires: apart(B.wires), calls };
}
type Scene = ReturnType<typeof scene>;
const useField = <F extends keyof Scene>(s: MotionValue<Scene>, f: F) => useTransform(() => s.get()[f]);

// Inside the computer: Desky floats in and shows what it does, comes apart to show how it's
// built, then its screens become our three websites and the camera zooms into each one.
export function DeskyChapter() {
  const { ref, p } = useChapter();
  const { w: vw, h: vh } = useViewport();

  const sc = useTransform(() => scene(p.get(), deskyGeometry(vw.get(), vh.get())));
  const boxW = useTransform(() => deskyGeometry(vw.get(), vh.get()).boxW);
  const boxH = useTransform(() => deskyGeometry(vw.get(), vh.get()).boxH);
  const perspective = useTransform(() => `${deskyGeometry(vw.get(), vh.get()).d}px`);
  const scale = useField(sc, "s");
  const x = useField(sc, "x");
  const y = useField(sc, "y");
  const rotateX = useField(sc, "rx");
  const rotateZ = useField(sc, "rz");
  const board = useField(sc, "board");
  const displays = useField(sc, "displays");
  const panel = useField(sc, "panel");
  const wires = useField(sc, "wires");
  const slide = useField(sc, "slide");
  const fontSize = useTransform(() => introType(vw.get(), vh.get()).F);
  const width = useTransform(() => introType(vw.get(), vh.get()).W);

  const riseY = useTransform(p, [at(B.intro, 0.3), B.enter[1]], ["85vh", "0vh"]);
  const tilt = useTransform(p, [at(B.intro, 0.3), B.enter[1]], [-10, 0]);
  const white = useTransform(p, [at(B.intro, 0.5), B.intro[1]], [1, 0]);
  const intro = useTransform(p, [at(B.intro, 0.35), at(B.intro, 0.8)], [1, 0]);
  const side = useTransform(p, [at(B.enter, 0.55), B.enter[1], B.open[0], at(B.open, 0.3)], [0, 1, 1, 0]);
  const sideEvents = useTransform(side, (v) => (v > 0.5 ? "auto" : "none"));

  return (
    <Chapter id="work" len={length(BEATS) * 0.55} tone="cream" chapterRef={ref} label="Our work, shown on Desky">
      <motion.div className="white-layer" style={{ opacity: white }} />
      {/* The line the camera dove into, finished typing: the dive ends on exactly this frame. */}
      <motion.div className="desky-intro" style={{ opacity: intro }}>
        <motion.p className="intro-line" style={{ fontSize, width }}>
          {INTRO}
          <span className="caret" />
        </motion.p>
      </motion.div>
      <div className="desky-anchor">
        <motion.div className="desky-rise" style={{ y: riseY, rotate: tilt }}>
          <div className="float">
            <DeskyModel
              box={{ width: boxW, height: boxH, scale, x, y, perspective }}
              turn={{ rotateX, rotateZ }}
              lift={{ board, displays, panel, slide }}
              signal={wires}
              screen={(i) => (
                <>
                  <Widget name={DESKY_SETS[0][i]} />
                  <Layer p={p} range={WIDGET_SWAPS[i]}>
                    <Widget name={DESKY_SETS[1][i]} />
                  </Layer>
                  <Layer p={p} range={SITE_SWAPS[i]} className="desky-site">
                    <SiteStrip slug={SITES[i].slug} p={p} hold={HOLDS[i]} />
                  </Layer>
                  <Layer p={p} range={HOME_SWAPS[i]}>
                    <Widget name={DESKY_SETS[0][i]} />
                  </Layer>
                </>
              )}
            />
            {DESKY_PARTS.map((part, i) => (
              <PartCallout key={part.title} i={i} part={part} p={p} sc={sc} />
            ))}
          </div>
        </motion.div>
      </div>
      <motion.aside className="hw-tag card" style={{ opacity: side, pointerEvents: sideEvents }}>
        <p className="eyebrow">
          Hardware {HW.n} · <span className="status ok">{HW.status}</span>
        </p>
        <h2 className="card-title">{HW.name}</h2>
        <p>{HW.line}</p>
        <ul className="chips">
          {HW.can.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="specs">{HW.specs.join(" · ")}</p>
      </motion.aside>
      <motion.div className="phone-wrap" style={{ opacity: side }} aria-hidden>
        <Phone p={p} />
      </motion.div>
      {SITES.map((site, i) => (
        <SiteCard key={site.slug} site={site} i={i} p={p} enter={ENTERS[i]} hold={HOLDS[i]} />
      ))}
    </Chapter>
  );
}

/**
 * Desky in four layers that can come apart in 3D: the case, the Pi and its wiring, the three
 * screens (where `screen(i)` is drawn) and the front panel. Without `turn`/`lift` it's closed.
 */
export function DeskyModel({
  box,
  turn,
  lift,
  signal,
  screen,
}: {
  box: MotionStyle;
  turn?: MotionStyle;
  lift?: { board: MotionValue<number>; displays: MotionValue<number>; panel: MotionValue<number>; slide: MotionValue<number> };
  signal?: MotionValue<number>;
  screen: (i: number) => ReactNode;
}) {
  return (
    <motion.div className="desky" style={box} role="img" aria-label="Desky, a retro desk display with three screens">
      <motion.div className="desky-3d" style={turn}>
        <div className="layer">
          <DeskyShell />
        </div>
        <motion.div className="layer" style={{ z: lift?.board }}>
          <DeskyBoard />
          {signal && (
            <motion.div className="layer" style={{ opacity: signal }}>
              <DeskySignal />
            </motion.div>
          )}
        </motion.div>
        <motion.div className="layer" style={{ z: lift?.displays, y: lift?.slide }}>
          <DeskyDisplays />
          {SCREENS.map((s, i) => (
            <div key={s.x} className="desky-screen" style={{ left: pct(s.x), top: pct(s.y), width: pct(s.w), height: pct(s.h) }}>
              {screen(i)}
            </div>
          ))}
        </motion.div>
        <motion.div className="layer" style={{ z: lift?.panel, y: lift?.slide }}>
          <DeskyPanel />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/** One part of the exploded view, named on screen while its step plays. */
function PartCallout({ i, part, p, sc }: { i: number; part: (typeof DESKY_PARTS)[number]; p: MotionValue<number>; sc: MotionValue<Scene> }) {
  const r = PARTS[i];
  const gone = i < PARTS.length - 1 ? PARTS[i + 1][0] : B.close[0]; // each gives way to the next
  const opacity = useTransform(p, (v) => seg(v, [r[0], at(r, 0.3)]) * (1 - seg(v, [gone, gone + 0.012])));
  const x = useTransform(() => sc.get().calls[i].x);
  const y = useTransform(() => sc.get().calls[i].y);
  return <Callout n={i + 1} title={part.title} detail={part.detail} style={{ x, y, opacity }} />;
}

/** Content that redraws over what's below it, top to bottom, as `range` plays. */
function Layer({ p, range, className, children }: { p: MotionValue<number>; range: Range; className?: string; children: ReactNode }) {
  const clipPath = useTransform(p, (v) => wipe(seg(v, range)));
  return (
    <motion.div className={`desky-layer ${className ?? ""}`} style={{ clipPath }}>
      {children}
    </motion.div>
  );
}

/** Desky's iPhone app, mirroring what the screens show. */
function Phone({ p }: { p: MotionValue<number> }) {
  const swapped = [usePast(p, WIDGET_SWAPS[0][0]), usePast(p, WIDGET_SWAPS[1][0]), usePast(p, WIDGET_SWAPS[2][0])];
  const last = swapped.lastIndexOf(true);
  const live = swapped.map((s, i) => DESKY_SETS[s ? 1 : 0][i]);
  return (
    <div className="phone">
      <p className="phone-head">
        <span>DESKY</span>
        <span className="phone-live">● LIVE</span>
      </p>
      <ol className="phone-slots">
        {live.map((name, i) => (
          <li key={i} className={i === last ? "lit" : undefined}>
            <span>SCREEN {i + 1}</span>
            <DeskyIcon name={name} />
            <b>{name.toUpperCase()}</b>
          </li>
        ))}
      </ol>
      <p className="phone-label">DRAG A WIDGET ONTO A SCREEN</p>
      <ul className="phone-lib">
        {APP.map((name) => (
          <li key={name} className={(live as readonly string[]).includes(name) ? "on" : undefined}>
            <DeskyIcon name={name} />
            {name.toUpperCase()}
          </li>
        ))}
      </ul>
      {last >= 0 && (
        <p key={last} className="phone-toast">
          SCREEN {last + 1} UPDATED
        </p>
      )}
    </div>
  );
}

function SiteStrip({ slug, p, hold }: { slug: string; p: MotionValue<number>; hold: Range }) {
  const y = useTransform(p, [hold[0], hold[1]], ["0%", `${-(1 - VISIBLE) * 100}%`]);
  return (
    <motion.div className="site-strip" style={{ y }}>
      {[0, 1, 2].map((k) => (
        <img key={k} src={`/sites/${slug}-${k}.jpg`} alt="" width={780} height={1688} loading="lazy" decoding="async" />
      ))}
    </motion.div>
  );
}

function SiteCard({ site, i, p, enter, hold }: { site: (typeof SITES)[number]; i: number; p: MotionValue<number>; enter: Range; hold: Range }) {
  const o = useTransform(p, [at(enter, 0.6), enter[1], at(hold, 0.85), hold[1]], [0, 1, 1, 0]);
  const x = useTransform(p, [at(enter, 0.6), enter[1]], ["-3vw", "0vw"]);
  const events = useTransform(o, (v) => (v > 0.5 ? "auto" : "none"));
  return (
    <motion.aside className="site-card card" style={{ opacity: o, x, pointerEvents: events }}>
      <p className="eyebrow">Website {i + 1} of 3</p>
      <h2 className="card-title">{site.name}</h2>
      <p>{site.line}</p>
      <ul className="chips">
        {site.did.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
      <a className="btn btn-ink" href={site.url} target="_blank" rel="noopener">
        Visit {new URL(site.url).hostname.replace("www.", "")} ↗
      </a>
    </motion.aside>
  );
}

const fill = (f: string) => ({ "--fill": f }) as CSSProperties;

/** Desky's widgets, redrawn from its own screen designs (240×320 TFTs, near-black, warm accents). */
export function Widget({ name }: { name: DeskyWidget }) {
  switch (name) {
    case "clock":
      return (
        <div className="w">
          <p className="w-row">
            <span className="w-label">BENGALURU</span>
            <span className="w-warm">37″</span>
          </p>
          <div className="w-hero">
            <b className="w-big">
              14<span className="w-warm">:</span>32
            </b>
            <span className="w-label">
              SATURDAY · <span className="w-warm">06 JUN</span>
            </span>
          </div>
          <span className="w-bar w-bar-warm" style={fill("62%")} />
        </div>
      );
    case "weather":
      return (
        <div className="w">
          <p className="w-label">BANGALORE</p>
          <div className="w-hero">
            <span className="w-sun" aria-hidden />
            <b className="w-big">28°</b>
            <span className="w-text">PARTLY CLOUDY</span>
          </div>
          <p className="w-row w-stats">
            <span>
              HUMIDITY <b>72%</b>
            </span>
            <span>
              FEELS <b>31°</b>
            </span>
          </p>
        </div>
      );
    case "music":
      return (
        <div className="w">
          <p className="w-label">NOW PLAYING</p>
          <div className="w-hero">
            <span className="w-cover" aria-hidden>
              <DeskyIcon name="music" />
            </span>
            <b className="w-title">Midnight City</b>
            <span className="w-text">M83</span>
          </div>
          <span className="w-bar w-bar-music" style={fill("38%")} />
        </div>
      );
    case "pet":
      return (
        <div className="w">
          <p className="w-label">PIXEL</p>
          <div className="w-hero w-pet">
            <PixelPet />
          </div>
          <p className="w-label">HAPPINESS</p>
          <span className="w-bar w-bar-done" style={fill("86%")} />
        </div>
      );
    case "gif":
      return (
        <div className="w">
          <p className="w-label">SCENE · SUNRISE</p>
          <div className="w-scene" aria-hidden>
            <span className="w-scene-sun" />
            <span className="w-scene-hill" />
          </div>
        </div>
      );
    default:
      return (
        <div className="w">
          <p className="w-label">TIMER</p>
          <div className="w-hero">
            <b className="w-big">25:00</b>
            <span className="w-label w-done">FOCUS</span>
          </div>
          <span className="w-bar w-bar-done" style={fill("100%")} />
        </div>
      );
  }
}
