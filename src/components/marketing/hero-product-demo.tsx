"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  DEMO_NAV_FOR_VIEW,
  DEMO_PATHS,
  DEMO_TIMELINE,
  type DemoView,
  type TimelineEvent,
} from "@/components/marketing/hero-demo-data";
import { HeroDemoMain } from "@/components/marketing/hero-demo-views";
import { HeroDemoSidebar } from "@/components/marketing/hero-demo-sidebar";
import "./hero-demo-theme.css";

type Point = { x: number; y: number };

/** SVG pointer tip in DemoCursor viewBox units */
const CURSOR_TIP = { x: 2, y: 2 };

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function waitForLayout(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (signal.aborted) {
          reject(new DOMException("Aborted", "AbortError"));
          return;
        }
        resolve();
      });
    });
  });
}

function getTargetPoint(stage: HTMLElement, targetId: string): Point | null {
  const el = stage.querySelector(`[data-demo-target="${targetId}"]`);
  if (!el) return null;

  const stageRect = stage.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 - stageRect.left,
    y: rect.top + rect.height / 2 - stageRect.top,
  };
}

function animateCursorMove(
  from: Point,
  to: Point,
  duration: number,
  onFrame: (point: Point) => void,
  signal: AbortSignal,
) {
  return new Promise<void>((resolve, reject) => {
    const start = performance.now();
    const control: Point = {
      x: (from.x + to.x) / 2 + (to.y - from.y) * 0.15,
      y: (from.y + to.y) / 2 - (to.x - from.x) * 0.12,
    };

    const frame = (now: number) => {
      if (signal.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }

      const raw = Math.min(1, (now - start) / duration);
      const t = 1 - Math.pow(1 - raw, 3);
      const x = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * control.x + t * t * to.x;
      const y = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * control.y + t * t * to.y;
      onFrame({ x, y });

      if (raw < 1) requestAnimationFrame(frame);
      else resolve();
    };

    requestAnimationFrame(frame);
  });
}

function DemoCursor({ x, y, clicking }: { x: number; y: number; clicking: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-30"
      style={{
        left: 0,
        top: 0,
        transform: `translate(${x - CURSOR_TIP.x}px, ${y - CURSOR_TIP.y}px)`,
      }}
    >
      <motion.div
        animate={{ scale: clicking ? 0.88 : 1 }}
        transition={{ duration: 0.1, ease: "easeOut" }}
        style={{ transformOrigin: `${CURSOR_TIP.x}px ${CURSOR_TIP.y}px` }}
      >
        <svg width="20" height="24" viewBox="0 0 20 24" className="drop-shadow-md">
          <path
            d="M2 2L2 17L7 13L10 21L13 20L10 12L17 12L2 2Z"
            fill="#f7f9fb"
            stroke="#0e1720"
            strokeWidth="1.25"
          />
        </svg>
      </motion.div>
    </div>
  );
}

function ClickRipple({ x, y, token }: { x: number; y: number; token: number }) {
  return (
    <span
      key={token}
      aria-hidden
      className="pointer-events-none absolute z-20"
      style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
    >
      <motion.span
        className="block h-7 w-7 rounded-full border-2 border-ember bg-ember/15"
        initial={{ opacity: 0.85, scale: 0.4 }}
        animate={{ opacity: 0, scale: 1.6 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      />
    </span>
  );
}

async function runTimeline(
  signal: AbortSignal,
  stageRef: React.RefObject<HTMLDivElement | null>,
  handlers: {
    onWait: (ms: number) => Promise<void>;
    onMoveToTarget: (target: string, duration: number) => Promise<void>;
    onClick: () => void;
    onView: (view: DemoView) => Promise<void>;
    onQualifyStep: (step: number) => void;
    onHighlight: (target: string | null) => void;
    onUrl: (path: string) => void;
    onVerifyReveal: () => void;
  },
) {
  for (;;) {
    for (const event of DEMO_TIMELINE) {
      if (signal.aborted) return;
      await handleEvent(event, stageRef, handlers, signal);
    }
  }
}

async function handleEvent(
  event: TimelineEvent,
  stageRef: React.RefObject<HTMLDivElement | null>,
  handlers: {
    onWait: (ms: number) => Promise<void>;
    onMoveToTarget: (target: string, duration: number) => Promise<void>;
    onClick: () => void;
    onView: (view: DemoView) => Promise<void>;
    onQualifyStep: (step: number) => void;
    onHighlight: (target: string | null) => void;
    onUrl: (path: string) => void;
    onVerifyReveal: () => void;
  },
  signal: AbortSignal,
) {
  switch (event.type) {
    case "wait":
      await handlers.onWait(event.ms);
      break;
    case "move":
      await waitForLayout(signal);
      await handlers.onMoveToTarget(event.target, event.ms ?? 850);
      break;
    case "click":
      await waitForLayout(signal);
      await handlers.onWait(70);
      handlers.onClick();
      await handlers.onWait(160);
      break;
    case "view":
      await handlers.onView(event.view);
      await waitForLayout(signal);
      break;
    case "qualifyStep":
      handlers.onQualifyStep(event.step);
      await waitForLayout(signal);
      break;
    case "highlight":
      handlers.onHighlight(event.target);
      break;
    case "url":
      handlers.onUrl(event.path);
      break;
    case "verifyReveal":
      handlers.onVerifyReveal();
      await waitForLayout(signal);
      break;
  }
}

export function HeroProductDemo() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<DemoView>("dashboard");
  const [qualifyStep, setQualifyStep] = useState(1);
  const [url, setUrl] = useState(DEMO_PATHS.dashboard);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [contentOpacity, setContentOpacity] = useState(1);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [demoEnabled, setDemoEnabled] = useState(false);
  const [cursor, setCursor] = useState<Point>({ x: 320, y: 180 });
  const [clicking, setClicking] = useState(false);
  const [clickToken, setClickToken] = useState(0);
  const [clickAt, setClickAt] = useState<Point>({ x: 320, y: 180 });
  const [verifyRevealed, setVerifyRevealed] = useState(false);

  const cursorRef = useRef(cursor);
  const pausedRef = useRef(paused);
  const lastTargetRef = useRef<string | null>(null);

  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setDemoEnabled(mq.matches);
    const onChange = () => setDemoEnabled(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion || !demoEnabled) return;

    const controller = new AbortController();

    const snapToTarget = (target: string) => {
      const stage = stageRef.current;
      if (!stage) return null;
      return getTargetPoint(stage, target);
    };

    const waitWhilePaused = async (ms: number) => {
      const end = performance.now() + ms;
      while (performance.now() < end) {
        if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
        if (pausedRef.current) {
          await sleep(100, controller.signal);
          continue;
        }
        await sleep(Math.min(100, end - performance.now()), controller.signal);
      }
    };

    runTimeline(controller.signal, stageRef, {
      onWait: waitWhilePaused,
      onMoveToTarget: async (target, duration) => {
        await waitForLayout(controller.signal);
        const point = snapToTarget(target);
        if (!point) return;

        lastTargetRef.current = target;
        const from = cursorRef.current;
        await animateCursorMove(from, point, duration, setCursor, controller.signal);
        cursorRef.current = point;
      },
      onClick: () => {
        const target = lastTargetRef.current;
        const point = target ? snapToTarget(target) : null;
        const at = point ?? cursorRef.current;
        cursorRef.current = at;
        setCursor(at);
        setClickAt(at);
        setClicking(true);
        setClickToken((value) => value + 1);
        window.setTimeout(() => setClicking(false), 120);
      },
      onView: async (nextView) => {
        setContentOpacity(0);
        await waitWhilePaused(180);
        setView(nextView);
        setQualifyStep(1);
        if (nextView === "verify") setVerifyRevealed(false);
        await waitWhilePaused(40);
        setContentOpacity(1);
        await waitWhilePaused(220);
      },
      onQualifyStep: setQualifyStep,
      onHighlight: setHighlight,
      onUrl: setUrl,
      onVerifyReveal: () => setVerifyRevealed(true),
    }).catch(() => {
      /* aborted */
    });

    return () => controller.abort();
  }, [reducedMotion, demoEnabled]);

  if (!demoEnabled) return null;

  const activeNav = DEMO_NAV_FOR_VIEW[view];
  const showSidebar = activeNav !== null;

  return (
    <div
      className="relative mx-auto mt-20 max-w-[920px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={stageRef}
        data-hero-demo
        className="relative overflow-hidden rounded-md border border-silver shadow-(--shadow-lift)"
      >
        <div className="demo-chrome flex items-center gap-3 border-b border-silver px-4 py-2">
          <div className="flex gap-1.5" aria-hidden>
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: "var(--demo-chrome-dot-red)" }}
            />
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: "var(--demo-chrome-dot-yellow)" }}
            />
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: "var(--demo-chrome-dot-green)" }}
            />
          </div>
          <div className="min-w-0 flex-1 rounded-[10px] border border-silver bg-frost px-3 py-1.5">
            <p className="truncate text-center font-mono text-[11px] text-charcoal">{url}</p>
          </div>
        </div>

        <div className="relative flex h-[min(58vh,440px)] min-h-[300px] overflow-hidden">
          {showSidebar && (
            <HeroDemoSidebar active={activeNav} highlight={highlight} />
          )}

          <div className="relative min-w-0 flex-1 overflow-hidden bg-parchment">
            <motion.div
              animate={{ opacity: contentOpacity }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="h-full overflow-hidden"
            >
              <HeroDemoMain
                view={view}
                qualifyStep={qualifyStep}
                highlight={highlight}
                verifyRevealed={verifyRevealed}
              />
            </motion.div>
          </div>
        </div>

        {!reducedMotion && (
          <div className="pointer-events-none absolute inset-0 z-20">
            <ClickRipple x={clickAt.x} y={clickAt.y} token={clickToken} />
            <DemoCursor x={cursor.x} y={cursor.y} clicking={clicking} />
          </div>
        )}
      </div>
    </div>
  );
}
