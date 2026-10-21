"use client";

import { motion, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { STUDIO } from "@/lib/content";
import { useChapter } from "@/lib/story";
import { FloppyRig } from "./Floppy";
import { Mac, MAC_ORIGIN } from "./Mac";
import { Blob, PixelDuo, PixelFloppy } from "./svg";
import { Chapter, Typer, usePast } from "./ui";

const HELLO = "Your business is about to look a lot more trustworthy.";

// The opener: the computer boots and types hello. Scroll, and a hand feeds it a floppy, one
// continuous move, and the screen melts into a portal that fills the page with purple.
export function Boot() {
  const { ref, p } = useChapter();
  const timed = useBooted();
  const scrolled = usePast(p, 0.02); // scrolling skips the boot
  const booted = timed || scrolled;
  const hint = useTransform(p, [0, 0.04], [1, 0]);
  const hello = useTransform(p, [0, 0.06, 0.1], [1, 1, 0]);
  const meet = useTransform(p, [0.1, 0.15], [0, 1]);
  const insert = useTransform(p, [0.15, 0.58], [0, 1]);
  const spin = useTransform(p, [0.6, 0.84], [0, 600]);
  const shrink = useTransform(p, [0.6, 0.84], [1, 0.04]);
  const lean = useTransform(p, [0.58, 1], [1, 1.35]);
  // The camera drops to the slot while the hand works, then comes back up to the screen.
  const frame = useTransform(p, [0.12, 0.2, 0.56, 0.64], ["0svh", "-20svh", "-20svh", "0svh"]);
  const yellow = useTransform(p, [0.62, 0.85], [0, 9]);
  const green = useTransform(p, [0.68, 0.92], [0, 9]);
  // Purple covers the whole view just before the chapter ends: the next one opens on purple.
  const purple = useTransform(p, [0.76, 0.97], [0, 7.5]);
  const turn = useTransform(p, [0.6, 1], [0, 160]);

  return (
    <Chapter id="top" len={3.6} tone="cream" chapterRef={ref} label="Hello" first>
      <h1 className="sr">{STUDIO}: a two-person studio for websites and branding</h1>
      <Mac
        className="boot-mac"
        style={{ y: frame, scale: lean, transformOrigin: MAC_ORIGIN }}
        outside={
          <>
            <motion.p className="boot-hint" style={{ opacity: hint }}>
              <span>Scroll down ↓</span>
            </motion.p>
            <FloppyRig t={insert} />
            <div className="boot-portal" aria-hidden>
              <motion.div className="blob blob-yellow" style={{ scale: yellow, rotate: turn }}>
                <Blob seed={1} />
              </motion.div>
              <motion.div className="blob blob-green" style={{ scale: green, rotate: turn }}>
                <Blob seed={4} />
              </motion.div>
              <motion.div className="blob blob-purple" style={{ scale: purple, rotate: turn }}>
                <Blob seed={7} />
              </motion.div>
            </div>
          </>
        }
      >
        <motion.div className="boot-screen" style={{ rotate: spin, scale: shrink }}>
          {!booted && (
            <motion.div className="boot-load" style={{ opacity: hello }} aria-hidden>
              <PixelFloppy />
              <span className="boot-bar">
                <span />
              </span>
            </motion.div>
          )}
          <motion.p className="boot-hello" style={{ opacity: hello }}>
            <Typer text={HELLO} on={booted} />
          </motion.p>
          <motion.div className="boot-meet" style={{ opacity: meet }}>
            <PixelDuo pose="wave" />
            <p>
              Meet <em>{STUDIO}</em>.
            </p>
          </motion.div>
        </motion.div>
      </Mac>
    </Chapter>
  );
}

/** The computer boots for a moment when the page opens (the bar fills in CSS), then types. */
function useBooted() {
  const [booted, setBooted] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setBooted(true), 1500);
    return () => clearTimeout(id);
  }, []);
  return booted;
}
