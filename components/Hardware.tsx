"use client";

import { motion, type MotionValue, useAnimationFrame, useMotionValue, useScroll, useTransform, useVelocity } from "motion/react";
import { type ComponentProps, type ReactNode, useEffect, useRef } from "react";
import art from "@/lib/art.json";
import { BUTTERFLY_PARTS, DESKY_SETS, HARDWARE, KEYCHAIN_PARTS } from "@/lib/content";
import { drawWorld, PH, PW } from "@/lib/pixel";
import { useChapter, useViewport } from "@/lib/story";
import { at, bezier, length, mix, type Pt, type Range, seg, stops, tipped } from "@/lib/stops";
import { DeskyModel, deskyGeometry, Widget } from "./Desky";
import { Adxl345, Esp32C3, KEY_RING, KEYCHAIN, KeyBack, KeyBattery, KeyBoard, KeyFront, KeyScreen, Lipo, Sg90 } from "./parts";
import { Callout, Chapter, pct } from "./ui";

const BEATS = [
  ["in", 1],
  ["hover", 1.2],
  ["inside", 2.2],
  ["dive", 0.5],
  ["carry", 1.1],
  ["drop", 0.7],
  ["key", 0.6],
  ["open", 0.8],
  ["kscreen", 0.55],
  ["kboard", 0.55],
  ["kbattery", 0.55],
  ["close", 0.7],
  ["zoom", 1.1],
  ["world", 1.6],
  ["back", 1],
  ["out", 0.6],
] as const;
const B = stops(BEATS);
const BF = art.butterfly;
const K = KEYCHAIN;
const S = K.screen;
const CX = S.x + S.w / 2;
const CY = S.y + S.h / 2;
const SCREEN_ASPECT = (S.w * K.w) / (S.h * K.h);
const RING: Pt = [KEY_RING.x, KEY_RING.y]; // top of the key ring, as fractions of the keychain drawing
const SMALL = 0.55; // the butterfly's size while it carries the keychain
const CHAIN = 0.035; // its chain, as a fraction of the viewport height
const PARTS = [Esp32C3, Adxl345, Sg90, Lipo];
const PART_W = [0.62, 0.55, 0.8, 0.66]; // each part's width, as a fraction of its slot
const KPARTS: Range[] = [B.kscreen, B.kboard, B.kbattery];
// Where each keychain callout points, in the drawing's units: the screen, the ESP32, the LiPo.
const KANCHORS = [
  [868, 470],
  [892, 640],
  [840, 470],
] as const;
const fmt = (v: number) => `${v < 0 ? "" : "+"}${v.toFixed(2)}`;
const clamp = (v: number, a: number) => Math.max(-a, Math.min(a, v));
const zoomed = (v: number) => (v < B.back[0] ? seg(v, B.zoom) : 1 - seg(v, B.back));

type Dims = { vw: number; vh: number; bh: number; kw: number; kh: number; kx: number; ky: number; wide: boolean };
const FLIGHTS = ["in", "dive", "carry", "drop"] as const;

/** Where everything is at progress v (px from the stage centre): the flight, and the keychain it fetches. */
function scene(v: number, d: Dims) {
  const { vw, vh } = d;
  const hover: Pt = d.wide ? [-0.15 * vw, 0.02 * vh] : [0, -0.17 * vh];
  const offset: Pt = [(RING[0] - 0.5) * d.kw, (RING[1] - 0.5) * d.kh]; // ring, from the keychain's centre
  const ring: Pt = [d.kx + offset[0], d.ky + offset[1]];
  const chain = CHAIN * vh;
  const legs = 0.44 * d.bh * SMALL;
  const top: Pt = [ring[0], ring[1] - chain - legs]; // the butterfly, holding the ring where it rests
  const low = 0.5 * vh + 0.4 * d.bh; // just below the fold, so it's back in view a moment later
  const paths = {
    in: [[0.62 * vw, -0.8 * vh], [0.4 * vw, -0.08 * vh], [0.08 * vw, -0.36 * vh], hover],
    dive: [hover, [hover[0] - 0.08 * vw, hover[1] + 0.3 * vh], [0.02 * vw, 0.42 * vh], [0.1 * vw, low]],
    carry: [[0.1 * vw, low], [0.16 * vw, 0.3 * vh], [top[0] + 0.1 * vw, top[1] + 0.25 * vh], top],
    drop: [top, [top[0] + 0.02 * vw, top[1] - 0.2 * vh], [-0.3 * vw, -0.55 * vh], [-0.8 * vw, -0.95 * vh]],
  } as const;

  // The butterfly: eased along each leg of its flight, leaning into turns, still while it hovers.
  let [bx, by] = v < B.dive[0] ? hover : paths.drop[3];
  let bs = v < B.dive[0] ? 1 : SMALL;
  let lean = 0;
  let flying = 0;
  const leg = FLIGHTS.find((k) => v >= B[k][0] && v < B[k][1]);
  if (leg) {
    const t = seg(v, B[leg]);
    const b = bezier(paths[leg], t);
    const speed = 4 * t * (1 - t); // eased: 0 where it stops, 1 mid-leg
    [bx, by] = [b.x, b.y];
    lean = clamp((b.dx / (Math.hypot(b.dx, b.dy) || 1)) * 26 * speed, 24);
    bs = leg === "in" ? mix(0.5, 1, t) : leg === "dive" ? mix(1, SMALL, t) : SMALL;
    flying = 1;
  }

  // Its insides come out one by one to a parts list beside it, then go back in.
  const home = seg(v, [at(B.inside, 0.84), B.inside[1]]);
  const slot = d.wide ? Math.min(180, 0.12 * vw) : 0.3 * vw;
  const parts = PARTS.map((_, k) => {
    const out = seg(v, [at(B.inside, 0.04 + k * 0.15), at(B.inside, 0.22 + k * 0.15)]) * (1 - home);
    const to: Pt = d.wide ? [0.1 * vw, (-0.28 + k * 0.19) * vh] : [(-0.45 + (k % 2) * 0.47) * vw, (0.1 + (k >> 1) * 0.17) * vh];
    return { x: mix(bx, to[0], out), y: mix(by, to[1], out), s: mix(0.25, 1, out), o: Math.min(1, out * 3), w: slot * PART_W[k] };
  });

  // The keychain hangs from its ring: below the butterfly while carried, then on its own,
  // swinging out the jolt of being let go; it's still by the time it comes apart.
  const hang = (pivot: Pt, deg: number): Pt => {
    const r = (deg * Math.PI) / 180;
    return [pivot[0] - (offset[0] * Math.cos(r) - offset[1] * Math.sin(r)), pivot[1] - (offset[0] * Math.sin(r) + offset[1] * Math.cos(r))];
  };
  let swing = 0;
  let k: Pt = [d.kx, d.ky];
  if (leg === "carry") {
    swing = lean * 0.8;
    k = hang([bx, by + legs + chain], swing);
  } else if (v >= B.drop[0] && v < B.open[0]) {
    const tau = (v - B.drop[0]) / (B.open[0] - B.drop[0]);
    swing = 9 * Math.exp(-4 * tau) * Math.sin(11 * tau);
    k = hang(ring, swing);
  }
  const z = zoomed(v);
  const fall = seg(v, B.out);
  return {
    bx,
    by,
    bs,
    lean,
    flying,
    parts,
    chain: v >= B.carry[0] ? 1 - seg(v, [B.drop[0], at(B.drop, 0.2)]) : 0,
    chainY: by + legs,
    kx: k[0] * (1 - z),
    ky: k[1] * (1 - z) + fall * 1.2 * vh,
    swing: swing + fall * 14,
    kshow: v >= B.carry[0] ? 1 : 0,
  };
}

/** The keychain coming apart, in its own unscaled px: layer heights, tilt, and callout points. */
function explode(v: number, g: ReturnType<typeof geometry>) {
  const settle = seg(v, [B.close[0], at(B.close, 0.6)]);
  const tip = seg(v, [B.open[0], at(B.open, 0.6)]) * (1 - seg(v, [at(B.close, 0.4), B.close[1]]));
  const apart = (r: Range) => seg(v, r) * (1 - settle);
  // (each layer sits one unit above the last: coplanar layers would z-fight while it tips)
  const board = g.boxW * 0.12 * apart([B.kbattery[0], at(B.kbattery, 0.7)]) + 1;
  const screen = board + g.boxW * 0.16 * apart([B.kboard[0], at(B.kboard, 0.7)]) + 1;
  const front = screen + g.boxW * 0.24 * apart([at(B.open, 0.3), B.open[1]]) + 1;
  const slide = -g.boxH * 0.32 * apart([B.kbattery[0], at(B.kbattery, 0.6)]); // the board slides back to bare the LiPo
  const s = g.rest ** (1 - zoomed(v)) * (1 + 0.25 * tip); // a little closer while it's apart
  const view = { rx: 48 * tip, rz: -18 * tip, s, d: 2.4 * g.boxW };
  const calls = KANCHORS.map(([ax, ay], i) => tipped((ax / K.w - 0.5) * g.boxW, (ay / K.h - 0.5) * g.boxH + (i < 2 ? slide : 0), [screen, board, 0][i], view));
  return { s, rx: view.rx, rz: view.rz, board, screen, front, slide, calls };
}

const useField = <T, F extends keyof T>(s: MotionValue<T>, f: F) => useTransform(() => s.get()[f]);

/**
 * Sizes for a viewport, in one place: no motion value may read both the viewport and
 * something derived from it, or it goes stale when the viewport changes.
 * At scale 1 the keychain's screen covers the viewport; on a portrait phone it fits the
 * width instead, or the cat would wander out of the visible slice.
 */
function geometry(vw: number, vh: number) {
  const wide = vw > 760;
  const boxW = (vw > vh ? Math.max(vw, vh * SCREEN_ASPECT) * 1.04 : vw * 0.98) / S.w;
  const boxH = boxW * (K.h / K.w);
  const rest = Math.min(((wide ? 0.4 : 0.78) * vw) / boxW, ((wide ? 0.44 : 0.34) * vh) / boxH);
  const bw = Math.min(0.62 * Math.min(vw, vh), 620);
  const dims: Dims = {
    vw,
    vh,
    bh: (bw * BF.h) / BF.w,
    kw: boxW * rest,
    kh: boxH * rest,
    kx: wide ? -0.13 * vw : 0,
    ky: wide ? 0.1 * vh : -0.04 * vh,
    wide,
  };
  return { boxW, boxH, rest, bw, dims };
}

// Desky flies off as the butterfly flies in and hovers; its insides come out to show how it
// works. Then it dives off the bottom and comes back up carrying the keychain, lets it go and
// flies off; the keychain comes apart, goes back together, and the camera dives into its screen.
export function HardwareChapter() {
  const { ref, p } = useChapter();
  const { w: vw, h: vh } = useViewport();

  const g = useTransform(() => geometry(vw.get(), vh.get()));
  const boxW = useField(g, "boxW");
  const boxH = useField(g, "boxH");
  const bw = useField(g, "bw");
  const s = useTransform(() => scene(p.get(), geometry(vw.get(), vh.get()).dims));
  const bx = useField(s, "bx");
  const by = useField(s, "by");
  const bs = useField(s, "bs");
  const lean = useField(s, "lean");
  const chain = useField(s, "chain");
  const chainY = useField(s, "chainY");
  const kx = useField(s, "kx");
  const ky = useField(s, "ky");
  const swing = useField(s, "swing");
  const kshow = useField(s, "kshow");
  const chainH = useTransform(() => CHAIN * vh.get());
  const x3 = useTransform(() => explode(p.get(), geometry(vw.get(), vh.get())));
  const scale = useField(x3, "s");
  const rotateX = useField(x3, "rx");
  const rotateZ = useField(x3, "rz");
  const board = useField(x3, "board");
  const screen = useField(x3, "screen");
  const front = useField(x3, "front");
  const slide = useField(x3, "slide");
  const perspective = useTransform(() => `${2.4 * geometry(vw.get(), vh.get()).boxW}px`);
  const zx = useTransform(() => {
    const z = zoomed(p.get());
    return `${-(CX - 0.5) * geometry(vw.get(), vh.get()).rest ** (1 - z) * z * 100}%`;
  });
  const zy = useTransform(() => {
    const z = zoomed(p.get());
    return `${-(CY - 0.5) * geometry(vw.get(), vh.get()).rest ** (1 - z) * z * 100}%`;
  });

  // Desky, as the last chapter left it, leaves as the butterfly arrives.
  const deskyW = useTransform(() => deskyGeometry(vw.get(), vh.get()).boxW);
  const deskyH = useTransform(() => deskyGeometry(vw.get(), vh.get()).boxH);
  const deskyRest = useTransform(() => deskyGeometry(vw.get(), vh.get()).rest);
  const deskyX = useTransform(p, [0, at(B.in, 0.8)], ["0vw", "-120vw"]);
  const deskyTilt = useTransform(p, [0, at(B.in, 0.8)], [0, -16]);

  const bCard = useTransform(p, [at(B.in, 0.75), B.in[1], at(B.hover, 0.92), B.hover[1]], [0, 1, 1, 0]);
  const kCard = useTransform(p, [at(B.drop, 0.6), B.drop[1], at(B.key, 0.9), at(B.open, 0.3)], [0, 1, 1, 0]);
  const caption = useTransform(p, [at(B.zoom, 0.85), B.zoom[1], at(B.world, 0.9), B.world[1]], [0, 1, 1, 0]);
  const white = useTransform(p, [at(B.out, 0.45), at(B.out, 0.95)], [0, 1]);
  const bEvents = useTransform(bCard, (v) => (v > 0.5 ? "auto" : "none"));

  // The real one: an ADXL345 feels your head move and an SG90 flaps the wings.
  // Here your pointer is the accelerometer, and scroll speed is the z axis.
  const ax = useMotionValue(0);
  const ay = useMotionValue(0);
  const { scrollY } = useScroll();
  const az = useTransform(useVelocity(scrollY), (v) => fmt(v / 4000));
  const axText = useTransform(ax, fmt);
  const ayText = useTransform(ay, fmt);
  const poke = useRef(0);
  const energy = useRef(0);
  const phase = useRef(0);
  const flap = useMotionValue(0);
  const right = useTransform(flap, (a) => -a);

  useEffect(() => {
    let last = { x: 0, y: 0, t: performance.now() };
    const move = (e: PointerEvent) => {
      const now = performance.now();
      const dt = Math.max(8, now - last.t);
      const vx = (e.clientX - last.x) / dt;
      const vy = (e.clientY - last.y) / dt;
      last = { x: e.clientX, y: e.clientY, t: now };
      poke.current = Math.min(1, poke.current + Math.hypot(vx, vy) * 0.05);
      ax.set(clamp(vx, 9.99));
      ay.set(clamp(vy, 9.99));
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [ax, ay]);

  useAnimationFrame((_, dt) => {
    poke.current *= Math.pow(0.15, dt / 1000); // your nudges calm down within a couple of seconds
    const target = Math.max(poke.current, s.get().flying * 0.75);
    energy.current += (target - energy.current) * Math.min(1, dt / 220); // ease toward it, never jump
    const e = energy.current;
    phase.current += dt * (0.005 + e * 0.02);
    flap.set((12 + e * 50) * Math.sin(phase.current));
  });

  return (
    <Chapter id="hardware" len={length(BEATS) * 0.6} tone="cream" chapterRef={ref} label="Hardware: the butterfly clutcher and the pixel keychain">
      <div className="desky-anchor" aria-hidden>
        <motion.div className="desky-rise" style={{ x: deskyX, rotate: deskyTilt }}>
          <div className="float">
            <DeskyModel box={{ width: deskyW, height: deskyH, scale: deskyRest }} screen={(i) => <Widget name={DESKY_SETS[0][i]} />} />
          </div>
        </motion.div>
      </div>
      <div className="hw-anchor">
        <motion.div className="key-drop" style={{ x: kx, y: ky, rotate: swing, opacity: kshow }}>
          <motion.div className="keychain" style={{ width: boxW, height: boxH, scale, x: zx, y: zy, perspective }} role="img" aria-label="The pixel keychain">
            <motion.div className="keychain-3d" style={{ rotateX, rotateZ }}>
              <div className="layer">
                <KeyBack />
              </div>
              <div className="layer">
                <KeyBattery />
              </div>
              <motion.div className="layer" style={{ z: board, y: slide }}>
                <KeyBoard />
              </motion.div>
              <motion.div className="layer" style={{ z: screen, y: slide }}>
                <KeyScreen />
                <div className="key-screen" style={{ left: pct(S.x), top: pct(S.y), width: pct(S.w), height: pct(S.h) }}>
                  <PixelWorld />
                </div>
              </motion.div>
              <motion.div className="layer" style={{ z: front, y: slide }}>
                <KeyFront />
              </motion.div>
            </motion.div>
          </motion.div>
          {KEYCHAIN_PARTS.map((part, i) => (
            <KeyCallout key={part.title} i={i} part={part} p={p} x3={x3} />
          ))}
        </motion.div>
        <motion.span className="bfly-chain" style={{ x: bx, y: chainY, height: chainH, opacity: chain }} aria-hidden />
        {BUTTERFLY_PARTS.map((part, k) => (
          <BugPart key={part.title} k={k} part={part} s={s} />
        ))}
        <motion.div className="bfly-wrap" style={{ x: bx, y: by, scale: bs, rotate: lean }}>
          <motion.div className="bfly" style={{ width: bw }}>
            <motion.img src="/art/butterfly.webp" alt="" className="wing wing-l" style={{ rotateY: flap }} width={BF.w} height={BF.h} />
            <motion.img src="/art/butterfly.webp" alt="" className="wing wing-r" style={{ rotateY: right }} width={BF.w} height={BF.h} />
            <img src="/art/butterfly.webp" alt="Illustration of the butterfly clutcher" className="wing wing-body" width={BF.w} height={BF.h} />
          </motion.div>
        </motion.div>
      </div>
      <HwCard which="butterfly" style={{ opacity: bCard, pointerEvents: bEvents }}>
        <p className="hint">
          <span className="on-hover">Move your cursor. The wings follow.</span>
          <span className="on-touch">Drag your finger. The wings follow.</span>
        </p>
        <p className="readout" aria-hidden>
          <span>
            x <motion.span>{axText}</motion.span>
          </span>
          <span>
            y <motion.span>{ayText}</motion.span>
          </span>
          <span>
            z <motion.span>{az}</motion.span>
          </span>
        </p>
      </HwCard>
      <HwCard which="keychain" style={{ opacity: kCard }} />
      <motion.p className="key-caption" style={{ opacity: caption }}>
        <span className="tape">A pixel cat lives in here.</span>
      </motion.p>
      <motion.div className="white-layer" style={{ opacity: white }} />
    </Chapter>
  );
}

/** One of the butterfly's parts, out of its body and named. */
function BugPart({ k, part, s }: { k: number; part: (typeof BUTTERFLY_PARTS)[number]; s: MotionValue<ReturnType<typeof scene>> }) {
  const Part = PARTS[k];
  const x = useTransform(() => s.get().parts[k].x);
  const y = useTransform(() => s.get().parts[k].y);
  const scale = useTransform(() => s.get().parts[k].s);
  const opacity = useTransform(() => s.get().parts[k].o);
  const width = useTransform(() => s.get().parts[k].w);
  return (
    <motion.div className="bug-part" style={{ x, y, opacity }}>
      <motion.div className="bug-part-art" style={{ width, scale }}>
        <Part />
      </motion.div>
      <p className="callout-text">
        <b>{part.title}</b> {part.detail}
      </p>
    </motion.div>
  );
}

/** One of the keychain's parts, named while its step of the exploded view plays. */
function KeyCallout({ i, part, p, x3 }: { i: number; part: (typeof KEYCHAIN_PARTS)[number]; p: MotionValue<number>; x3: MotionValue<ReturnType<typeof explode>> }) {
  const r = KPARTS[i];
  const gone = i < KPARTS.length - 1 ? KPARTS[i + 1][0] : B.close[0]; // each gives way to the next
  const opacity = useTransform(p, (v) => seg(v, [r[0], at(r, 0.3)]) * (1 - seg(v, [gone, gone + 0.01])));
  const x = useTransform(() => x3.get().calls[i].x);
  const y = useTransform(() => x3.get().calls[i].y);
  return <Callout n={i + 1} title={part.title} detail={part.detail} style={{ x, y, opacity }} />;
}

function HwCard({ which, style, children }: { which: "butterfly" | "keychain"; style: ComponentProps<typeof motion.aside>["style"]; children?: ReactNode }) {
  const hw = HARDWARE[which];
  return (
    <motion.aside className="hw-card card" style={style}>
      <p className="eyebrow">
        Hardware {hw.n} · <span className="status">{hw.status}</span>
      </p>
      <h2 className="card-title">{hw.name}</h2>
      <p>{hw.line}</p>
      <ul className="chips">
        {hw.specs.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      {children}
    </motion.aside>
  );
}

function PixelWorld() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let raf = 0;
    const tick = () => {
      drawWorld(ctx, Math.floor(performance.now() / 83) / 12); // ~12 fps, like a tiny LCD
      raf = requestAnimationFrame(tick);
    };
    drawWorld(ctx, 0);
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) raf = requestAnimationFrame(tick);
    });
    io.observe(canvas);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);
  return <canvas ref={ref} width={PW} height={PH} className="pixel-canvas" role="img" aria-label="A pixel cat chasing a butterfly" />;
}
