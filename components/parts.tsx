// Hardware, drawn as SVG: it stays sharp however far the camera zooms, and each device comes
// apart into layers for its exploded view. Coordinates are each drawing's own units; colours
// come from globals.css (.f-* fills, .s-* strokes, .ln = ink outline).
import type { ReactNode } from "react";

/** A rounded rectangle as a path, so shapes can be combined into one path with holes. */
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${2 * r - w}a${r} ${r} 0 0 1 ${-r} ${-r}v${2 * r - h}a${r} ${r} 0 0 1 ${r} ${-r}z`;

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
/** Trig results differ in the last digit between the server and the browser; round them so hydration matches. */
const r2 = (v: number) => Math.round(v * 100) / 100;

/* ---------------------------------------------------------------- the floppy */

/** A 3.5" disk, label side, face-on (90 × 94 mm). The shutter end goes into the drive first. */
export function FloppyDisk() {
  return (
    <svg viewBox="-1 -1 92 96" className="part" aria-hidden>
      <path d="M3 0H85L90 5V91Q90 94 87 94H3Q0 94 0 91V3Q0 0 3 0Z" className="ln f-purple" strokeWidth="1.4" />
      <path d={rr(21, -0.5, 48, 31, 1.5)} className="ln f-silver" strokeWidth="1.2" />
      <path d={rr(49, 5, 11, 20, 1)} className="f-ink" />
      <path d="M14 94V48Q14 44 18 44H72Q76 44 76 48V94" className="ln f-paper" strokeWidth="1.2" />
      <path d="M22 62H68M22 72H68M22 82H56" className="s-lavender" strokeWidth="1.2" strokeLinecap="round" />
      <text x="45" y="56.5" textAnchor="middle" className="disk-label">
        thelocalcode
      </text>
      <path d={rr(4, 85, 5, 5, 0.8)} className="f-ink" />
      <path d={rr(81, 85, 5, 5, 0.8)} className="f-ink" />
      <path d="M5 6L9 3V9Z" className="f-ink" />
    </svg>
  );
}

/* ---------------------------------------------------------------- Desky */

/** Desky's drawing size and its three screens (fractions of it), where live content goes. */
export const DESKY = {
  w: 1394,
  h: 931,
  screens: [0.0746, 0.3056, 0.5366].map((x) => ({ x, y: 0.3927, w: 0.1966, h: 0.4657 })),
};
const SCR = DESKY.screens.map((s) => ({ x: s.x * DESKY.w, y: s.y * DESKY.h, w: s.w * DESKY.w, h: s.h * DESKY.h }));
const PANEL = { x: 36, y: 312, w: 1322, h: 538 };
const desky = (children: ReactNode) => (
  <svg viewBox={`0 0 ${DESKY.w} ${DESKY.h}`} className="part" aria-hidden>
    {children}
  </svg>
);

const GRILL = [0, 1, 2, 3, 4].flatMap((ring) =>
  range(ring ? ring * 6 : 1).map((k) => {
    const a = (k / (ring * 6 || 1)) * Math.PI * 2 + ring * 0.3;
    return [r2(Math.cos(a) * ring * 16), r2(Math.sin(a) * ring * 15)] as const;
  }),
);

/** The case: speakers, antenna, feet, and the empty cavity you see once the panel is off. */
export function DeskyShell() {
  return desky(
    <>
      <path d="M127 262L136 214H168L177 262Z" className="ln f-shell" strokeWidth="7" />
      <path d={rr(146, 30, 12, 188, 6)} className="ln f-silver" strokeWidth="6" />
      <circle cx="152" cy="24" r="17" className="ln f-silver" strokeWidth="6" />
      {[377, 1015].map((cx) => (
        <g key={cx}>
          <path d={`M${cx - 118} 262C${cx - 118} 116 ${cx - 62} 56 ${cx} 56C${cx + 62} 56 ${cx + 118} 116 ${cx + 118} 262Z`} className="ln f-shell" strokeWidth="7" />
          <ellipse cx={cx} cy="152" rx="86" ry="80" className="ln f-silver" strokeWidth="5" />
          {GRILL.map(([dx, dy], i) => (
            <circle key={i} cx={cx + dx} cy={152 + dy} r="5" className="f-shell" />
          ))}
          <path d={rr(cx - 100, 244, 200, 24, 12)} className="ln f-shell" strokeWidth="6" />
        </g>
      ))}
      <path d={rr(62, 860, 100, 62, 14)} className="ln f-shell" strokeWidth="7" />
      <path d={rr(1232, 860, 100, 62, 14)} className="ln f-shell" strokeWidth="7" />
      <path d={rr(6, 240, 1382, 640, 46)} className="ln f-shell" strokeWidth="8" />
      <path d="M52 270H1342" className="s-shell-hi" strokeWidth="8" strokeLinecap="round" />
      <path d={rr(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 22)} className="f-cavity" />
      {[
        [84, 356],
        [1310, 356],
        [84, 806],
        [1310, 806],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="15" className="ln f-steel" strokeWidth="4" />
      ))}
    </>,
  );
}

/** The silver front: three bezels with real holes, the knob, the status light, the vents. */
export function DeskyPanel() {
  const holes = SCR.map((s) => rr(s.x, s.y, s.w, s.h, 6)).join("");
  return desky(
    <>
      <path d={rr(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 22) + holes} fillRule="evenodd" className="ln f-silver" strokeWidth="7" />
      {SCR.map((s) => (
        <path key={s.x} d={rr(s.x - 15, s.y - 15, s.w + 30, s.h + 30, 18) + rr(s.x, s.y, s.w, s.h, 6)} fillRule="evenodd" className="f-ink" />
      ))}
      {[
        [64, 342],
        [1325, 819],
      ].map(([x, y]) => (
        <g key={x}>
          <circle cx={x} cy={y} r="15" className="ln f-silver" strokeWidth="5" />
          <path d={`M${x - 9} ${y + 5}L${x + 9} ${y - 5}`} className="s-ink" strokeWidth="5" strokeLinecap="round" />
        </g>
      ))}
      <circle cx="1194" cy="389" r="22" className="ln f-led" strokeWidth="6" />
      <circle cx="1187" cy="382" r="6" className="f-paper" opacity="0.7" />
      <circle cx="1194" cy="539" r="98" className="f-ink" />
      {range(40).map((k) => {
        const a = (k / 40) * Math.PI * 2;
        return (
          <path
            key={k}
            d={`M${r2(1194 + Math.cos(a) * 82)} ${r2(539 + Math.sin(a) * 82)}L${r2(1194 + Math.cos(a) * 95)} ${r2(539 + Math.sin(a) * 95)}`}
            className="s-shell-hi"
            strokeWidth="5"
          />
        );
      })}
      <circle cx="1194" cy="539" r="74" className="ln f-shell" strokeWidth="5" />
      <path d="M1194 480V514" className="s-paper" strokeWidth="9" strokeLinecap="round" />
      {[659, 706, 752].map((y) => (
        <path key={y} d={rr(1092, y, 205, 27, 13.5)} className="f-ink" />
      ))}
    </>,
  );
}

/** Three ILI9341 modules: red boards with their pin headers; the glass is where content goes. */
export function DeskyDisplays() {
  return desky(
    <>
      {SCR.map((s) => (
        <g key={s.x}>
          <path d={rr(s.x - 26, 316, s.w + 52, 512, 12)} className="ln f-pcb-red" strokeWidth="6" />
          {[
            [s.x - 12, 332],
            [s.x + s.w + 12, 332],
            [s.x - 12, 812],
            [s.x + s.w + 12, 812],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="7" className="f-cavity s-gold" strokeWidth="3" />
          ))}
          <path d={rr(s.x + s.w / 2 - 76, 322, 152, 24, 4)} className="f-ink" />
          {range(9).map((k) => (
            <rect key={k} x={s.x + s.w / 2 - 70 + k * 16.5} y="330" width="8" height="8" className="f-gold" />
          ))}
          <path d={rr(s.x - 8, s.y - 8, s.w + 16, s.h + 16, 8)} className="f-ink" />
          <text x={s.x + s.w / 2} y="822" textAnchor="middle" className="silk">
            ILI9341 · 240×320
          </text>
        </g>
      ))}
    </>,
  );
}

// The Pi sits low in the case; its 40-pin header runs along its top edge.
const PI = { x: 490, y: 612 };
const pinX = (col: number) => PI.x + 56 + col * 16.2;
// Header columns each screen's wires leave from (pin p is in column (p - 1) / 2): screens 1 and 2
// share SPI0 in the middle of the header (MOSI 19, MISO 21, SCLK 23, then CE0 24 / CE1 26),
// screen 3 has SPI1 to itself at the far end (pins 35, 38, 40, and CE0 on pin 12).
const BUNDLES = [
  [9, 10, 11, 11],
  [9, 10, 11, 12],
  [17, 18, 19, 5],
] as const;
const WIRES = ["purple", "yellow", "mint", "pink"] as const;
const WIRE_PATHS = BUNDLES.flatMap((cols, i) => {
  const hx = SCR[i].x + SCR[i].w / 2;
  return cols.map((col, j) => {
    const sx = pinX(col);
    const ex = hx - 50 + j * 33;
    return { d: `M${sx} ${PI.y + 20}C${sx} ${PI.y - 120} ${ex} 470 ${ex} 342`, colour: WIRES[j] };
  });
});

/** The Raspberry Pi Zero 2W and the wiring harness up to each screen's header. */
export function DeskyBoard() {
  return desky(
    <>
      <g transform={`translate(${PI.x} ${PI.y})`}>
        <path d={rr(0, 0, 413, 191, 22)} className="ln f-pcb" strokeWidth="6" />
        {[
          [22, 22],
          [391, 22],
          [22, 169],
          [391, 169],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="10" className="f-cavity s-gold" strokeWidth="4" />
        ))}
        <path d={rr(46, 10, 330, 38, 5)} className="f-ink" />
        {range(40).map((k) => (
          <rect key={k} x={51 + (k >> 1) * 16.2} y={k % 2 ? 31 : 15} width="9" height="9" className="f-gold" />
        ))}
        <path d={rr(150, 74, 98, 98, 8)} className="ln f-ink" strokeWidth="4" />
        <text x="199" y="128" textAnchor="middle" className="silk">
          RP3A0
        </text>
        <path d={rr(264, 84, 66, 54, 6)} className="ln f-silver" strokeWidth="4" />
        <path d={rr(38, 172, 62, 30, 5)} className="ln f-silver" strokeWidth="4" />
        <path d={rr(276, 176, 44, 26, 4)} className="ln f-silver" strokeWidth="4" />
        <path d={rr(336, 176, 44, 26, 4)} className="ln f-silver" strokeWidth="4" />
        <path d={rr(-10, 68, 34, 72, 5)} className="ln f-steel" strokeWidth="4" />
        <path d={rr(394, 60, 28, 78, 4)} className="ln f-cream" strokeWidth="4" />
        <text x="60" y="150" className="silk">
          Pi Zero 2 W
        </text>
        {[
          [110, 70],
          [120, 96],
          [256, 152],
          [348, 70],
        ].map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="14" height="8" className="f-gold" />
        ))}
      </g>
      {WIRE_PATHS.map((w) => (
        <g key={w.d}>
          <path d={w.d} className="s-ink" strokeWidth="14" fill="none" strokeLinecap="round" />
          <path d={w.d} className={`s-${w.colour}`} strokeWidth="7" fill="none" strokeLinecap="round" />
        </g>
      ))}
    </>,
  );
}

/** Data running up the wires: dashes that travel from the Pi to the screens (CSS animates them). */
export function DeskySignal() {
  return desky(
    <>
      {WIRE_PATHS.map((w) => (
        <path key={w.d} d={w.d} className="signal" strokeWidth="5" fill="none" strokeLinecap="round" />
      ))}
    </>,
  );
}

/* ---------------------------------------------------------------- the keychain */

export const KEYCHAIN = { w: 1000, h: 780, screen: { x: 0.422, y: 350 / 780, w: 0.416, h: 234 / 780 } };
const KS = { x: 422, y: 350, w: 416, h: 234 };
const keychain = (children: ReactNode) => (
  <svg viewBox={`0 0 ${KEYCHAIN.w} ${KEYCHAIN.h}`} className="part" aria-hidden>
    {children}
  </svg>
);
const LUG = rr(340, 186, 150, 132, 54) + "M388 228a24 24 0 1 0 48 0a24 24 0 1 0 -48 0z";
/** The top of the key ring (fractions of the drawing): what the butterfly's chain hooks onto. */
export const KEY_RING = { x: 300 / KEYCHAIN.w, y: 98 / KEYCHAIN.h };

/** The back half of the shell, with the key ring through its lug and the key on the ring. */
export function KeyBack() {
  return keychain(
    <>
      <circle cx="300" cy="210" r="112" className="s-ink" strokeWidth="34" fill="none" />
      <circle cx="300" cy="210" r="112" className="s-silver" strokeWidth="20" fill="none" />
      <path d="M140 300a62 62 0 1 1 124 0a62 62 0 1 1 -124 0zM195 279a16 16 0 1 0 32 0a16 16 0 1 0 -32 0z" fillRule="evenodd" className="ln f-silver" strokeWidth="7" />
      <path d="M176 356L218 362L176 640L150 654L140 626L128 620L134 596L122 588L128 562L118 554Z" className="ln f-silver" strokeWidth="7" />
      <path d="M190 380L160 600" className="s-steel" strokeWidth="6" strokeLinecap="round" />
      <path d={LUG} fillRule="evenodd" className="ln f-yellow-deep" strokeWidth="8" />
      <path d={rr(344, 262, 600, 490, 70)} className="ln f-yellow-deep" strokeWidth="8" />
      <path d={rr(370, 288, 548, 438, 52)} className="f-yellow-dark" />
    </>,
  );
}

/** A small LiPo pouch with its leads. */
export function KeyBattery() {
  return keychain(
    <>
      <path d="M470 352C430 330 420 300 450 280" className="s-red" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M492 352C470 320 480 296 500 282" className="s-ink" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d={rr(440, 350, 400, 230, 26)} className="ln f-silver" strokeWidth="7" />
      <path d={rr(486, 396, 308, 138, 10)} className="f-lavender" />
      <text x="640" y="478" textAnchor="middle" className="silk silk-ink silk-lg">
        3.7 V LiPo
      </text>
    </>,
  );
}

/** The board: an ESP32 module, USB-C at the edge, and the two buttons' switches. */
export function KeyBoard() {
  return keychain(
    <>
      <path d={rr(372, 296, 520, 424, 30)} className="ln f-pcb-ink" strokeWidth="6" />
      <path d={rr(430, 330, 196, 210, 10)} className="ln f-pcb" strokeWidth="4" />
      <path d="M446 350H610V372H446V394H610" className="s-gold" strokeWidth="6" fill="none" />
      <path d={rr(430, 404, 196, 136, 10)} className="ln f-silver" strokeWidth="4" />
      <text x="528" y="482" textAnchor="middle" className="silk silk-ink silk-lg">
        ESP32
      </text>
      <path d={rr(852, 466, 52, 70, 12)} className="ln f-silver" strokeWidth="5" />
      {[560, 700].map((x) => (
        <g key={x}>
          <path d={rr(x - 34, 640, 68, 68, 6)} className="ln f-silver" strokeWidth="4" />
          <circle cx={x} cy="674" r="18" className="f-ink" />
        </g>
      ))}
      {[
        [680, 360],
        [700, 380],
        [760, 420],
        [690, 560],
        [800, 600],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="22" height="12" className="f-gold" />
      ))}
    </>,
  );
}

/** The colour screen module; the glass is where the pixel world is drawn. */
export function KeyScreen() {
  return keychain(
    <>
      <path d={rr(366, 420, 34, 96, 4)} className="ln f-ribbon" strokeWidth="4" />
      <path d={rr(392, 318, 476, 300, 14)} className="ln f-pcb-blue" strokeWidth="6" />
      <path d={rr(KS.x - 12, KS.y - 12, KS.w + 24, KS.h + 24, 10)} className="f-ink" />
    </>,
  );
}

/** The front half of the shell: a window for the screen, two buttons, USB-C on the side. */
export function KeyFront() {
  return keychain(
    <>
      <path d={rr(344, 262, 600, 490, 70) + rr(KS.x, KS.y, KS.w, KS.h, 8)} fillRule="evenodd" className="ln f-yellow-deep" strokeWidth="8" />
      <path d={rr(928, 470, 16, 66, 8)} className="f-ink" />
      <path d={LUG} fillRule="evenodd" className="ln f-yellow" strokeWidth="8" />
      <path d={rr(330, 250, 600, 490, 70) + rr(KS.x, KS.y, KS.w, KS.h, 8)} fillRule="evenodd" className="ln f-yellow" strokeWidth="8" />
      <path d={rr(KS.x - 24, KS.y - 24, KS.w + 48, KS.h + 48, 26) + rr(KS.x, KS.y, KS.w, KS.h, 8)} fillRule="evenodd" className="f-ink" />
      {[560, 700].map((x) => (
        <g key={x}>
          <circle cx={x} cy="672" r="34" className="ln f-ink" strokeWidth="6" />
          <circle cx={x - 10} cy="662" r="8" className="f-shell-hi" />
        </g>
      ))}
    </>,
  );
}

/* ---------------------------------------------------------------- the butterfly's insides */

/** ESP32-C3 Super Mini: USB-C on one end, antenna on the other, smaller than a stamp. */
export function Esp32C3() {
  return (
    <svg viewBox="-8 -4 236 188" className="part" aria-hidden>
      <path d={rr(6, 6, 213, 168, 14)} className="ln f-pcb-blue" strokeWidth="6" />
      {range(8).map((k) => (
        <g key={k}>
          <circle cx={44 + k * 22} cy="22" r="7" className="f-cavity s-gold" strokeWidth="4" />
          <circle cx={44 + k * 22} cy="158" r="7" className="f-cavity s-gold" strokeWidth="4" />
        </g>
      ))}
      <path d={rr(-4, 58, 50, 64, 12)} className="ln f-silver" strokeWidth="5" />
      <path d={rr(94, 54, 64, 64, 6)} className="ln f-ink" strokeWidth="3" />
      <text x="126" y="92" textAnchor="middle" className="silk">
        C3
      </text>
      <path d={rr(178, 46, 28, 88, 5)} className="f-ink" />
      <rect x="64" y="124" width="18" height="12" className="f-silver" />
      <rect x="166" y="124" width="10" height="8" className="f-red" />
    </svg>
  );
}

/** ADXL345 accelerometer on its little purple board. */
export function Adxl345() {
  return (
    <svg viewBox="-2 -2 204 154" className="part" aria-hidden>
      <path d={rr(6, 6, 188, 138, 12)} className="ln f-purple" strokeWidth="6" />
      {range(8).map((k) => (
        <circle key={k} cx={30 + k * 20} cy="24" r="7" className="f-cavity s-gold" strokeWidth="4" />
      ))}
      <path d={rr(78, 60, 44, 44, 4)} className="ln f-ink" strokeWidth="3" />
      <circle cx="28" cy="120" r="11" className="f-cavity s-gold" strokeWidth="4" />
      <circle cx="172" cy="120" r="11" className="f-cavity s-gold" strokeWidth="4" />
      <text x="100" y="130" textAnchor="middle" className="silk">
        ADXL345
      </text>
    </svg>
  );
}

/** SG90 micro servo from above: mounting tabs, the output horn, three leads. */
export function Sg90() {
  const leads = ["M212 74C246 74 250 120 284 126", "M212 88C244 90 246 136 284 142", "M212 102C240 106 242 152 284 158"];
  return (
    <svg viewBox="0 0 290 176" className="part" aria-hidden>
      {leads.map((d) => (
        <path key={d} d={d} className="s-ink" strokeWidth="12" fill="none" strokeLinecap="round" />
      ))}
      {leads.map((d, i) => (
        <path key={d} d={d} className={["s-brown", "s-red", "s-orange"][i]} strokeWidth="6" fill="none" strokeLinecap="round" />
      ))}
      <path d={rr(10, 68, 236, 38, 8)} className="ln f-servo-dark" strokeWidth="6" />
      <circle cx="28" cy="87" r="7" className="f-cavity" />
      <circle cx="228" cy="87" r="7" className="f-cavity" />
      <path d={rr(42, 40, 172, 94, 10)} className="ln f-servo" strokeWidth="6" />
      <circle cx="86" cy="87" r="34" className="ln f-servo-dark" strokeWidth="5" />
      <path d={rr(76, 4, 20, 118, 10)} className="ln f-paper" strokeWidth="5" />
      <circle cx="86" cy="87" r="8" className="f-ink" />
      {[22, 40, 58].map((y) => (
        <circle key={y} cx="86" cy={y} r="3" className="f-ink" />
      ))}
    </svg>
  );
}

/** A small LiPo pouch, with the leads to its USB-C charger. */
export function Lipo() {
  return (
    <svg viewBox="-4 -4 232 140" className="part" aria-hidden>
      <path d="M26 24C10 10 2 4 0 0" className="s-red" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M42 24C30 8 24 2 22 0" className="s-ink" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d={rr(10, 22, 206, 104, 14)} className="ln f-silver" strokeWidth="6" />
      <path d={rr(40, 40, 146, 68, 6)} className="f-lavender" />
      <text x="113" y="80" textAnchor="middle" className="silk silk-ink silk-lg">
        LiPo · USB-C
      </text>
    </svg>
  );
}
