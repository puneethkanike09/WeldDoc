"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { DsButtonLink } from "@/components/marketing/ds-button";
import { cn } from "@/lib/utils";

const links = [
  { href: "#features", label: "Features" },
  { href: "#workflow", label: "How it works" },
  { href: "#compare", label: "Compare" },
];

export const NAV_SCROLL_SENTINEL_ID = "nav-scroll-sentinel";

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById(NAV_SCROLL_SENTINEL_ID);
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0, rootMargin: "0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          "border-b transition-[background-color,backdrop-filter,border-color,box-shadow] duration-300 ease-out",
          scrolled
            ? "border-black/6 bg-white/55 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-2xl backdrop-saturate-150"
            : "border-transparent bg-transparent backdrop-blur-none",
        )}
      >
        <div className="mx-auto grid h-16 max-w-[1280px] grid-cols-[1fr_auto_1fr] items-center px-6">
          <Link
            href="/"
            aria-label="WeldDoc home"
            className="col-start-1 justify-self-start"
          >
            <Logo />
          </Link>

          <nav className="col-start-2 hidden items-center gap-8 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-body text-ink hover:opacity-70"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="col-start-3 flex items-center justify-self-end gap-5">
            <Link
              href="/login"
              className="hidden text-body text-ink sm:inline-flex"
            >
              Sign in
            </Link>
            <DsButtonLink href="/login" className="hidden md:inline-flex">
              Get started
            </DsButtonLink>
          </div>
        </div>
      </div>
    </header>
  );
}
