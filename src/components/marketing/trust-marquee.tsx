"use client";

import { Fragment, useSyncExternalStore } from "react";
import ScrollVelocity from "@/components/marketing/scroll-velocity";

const industries = [
  "Pressure Vessels",
  "Pipelines",
  "Structural Steel",
  "Shipbuilding",
  "Offshore Fabrication",
  "Power Plants",
];

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServer() {
  return false;
}

function MarqueeItems() {
  return (
    <span className="inline-flex items-center gap-8">
      {industries.map((name) => (
        <span key={name} className="inline-flex items-center gap-8">
          <span>{name}</span>
          <span
            className="h-1 w-1 shrink-0 rounded-full bg-ink/15"
            aria-hidden
          />
        </span>
      ))}
    </span>
  );
}

export function TrustMarquee() {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionServer,
  );

  if (reducedMotion) {
    return (
      <div
        className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6"
        aria-label="Industries served"
      >
        {industries.map((name) => (
          <Fragment key={name}>
            <span className="whitespace-nowrap text-[16px] text-ink/40">
              {name}
            </span>
            <span
              className="hidden h-1 w-1 shrink-0 rounded-full bg-ink/15 last:hidden sm:inline"
              aria-hidden
            />
          </Fragment>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-10">
      <ScrollVelocity
        texts={[<MarqueeItems key="industries" />]}
        velocity={45}
        numCopies={8}
        damping={55}
        stiffness={380}
        velocityMapping={{ input: [0, 1200], output: [0, 4] }}
        className="shrink-0 text-[16px] text-ink/40"
        parallaxClassName="trust-marquee__parallax"
        scrollerClassName="trust-marquee__scroller"
      />
    </div>
  );
}
