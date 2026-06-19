"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts up from 0 to `value` once it scrolls into view (easeOut), with an
 * optional start delay for staggering. Pads to `pad` digits (e.g. 01). Honors
 * prefers-reduced-motion by jumping straight to the final value.
 */
export function NumberTicker({
  value,
  pad = 2,
  durationMs = 1100,
  delayMs = 0,
  className,
}: {
  value: number;
  pad?: number;
  durationMs?: number;
  delayMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    let raf = 0;
    let started = false;

    const run = () => {
      const start = performance.now() + delayMs;
      const tick = (now: number) => {
        const t = Math.min(1, Math.max(0, (now - start) / durationMs));
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(value * eased);
        if (t < 1) raf = requestAnimationFrame(tick);
        else setDisplay(value);
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started) {
          started = true;
          run();
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, durationMs, delayMs]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {String(Math.round(display)).padStart(pad, "0")}
    </span>
  );
}
