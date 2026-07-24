"use client";

import { useEffect, useId, useState } from "react";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import type { GeoFaq } from "@/lib/seo/geo-content";

function FaqAccordionItem({
  question,
  answer,
  defaultOpen = false,
}: GeoFaq & { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [reducedMotion, setReducedMotion] = useState(false);
  const panelId = useId();
  const buttonId = useId();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="py-1">
      <button
        id={buttonId}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-body font-medium text-ink">{question}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate transition-transform duration-300 ease-out ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={1.75}
          aria-hidden
        />
      </button>
      <motion.div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        initial={false}
        animate={{
          height: open ? "auto" : 0,
        }}
        transition={{
          duration: reducedMotion ? 0 : 0.28,
          ease: [0.4, 0, 0.2, 1],
        }}
        className="overflow-hidden"
      >
        <p className="text-body max-w-[640px] pb-6 text-slate">{answer}</p>
      </motion.div>
    </div>
  );
}

export function FaqAccordion({
  items,
  defaultOpenIndex = 0,
}: {
  items: GeoFaq[];
  defaultOpenIndex?: number;
}) {
  return (
    <div className="divide-y divide-hairline border-y border-hairline">
      {items.map((item, index) => (
        <FaqAccordionItem
          key={item.question}
          question={item.question}
          answer={item.answer}
          defaultOpen={index === defaultOpenIndex}
        />
      ))}
    </div>
  );
}
