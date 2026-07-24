"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { DsButtonLink } from "@/components/marketing/ds-button";
import {
  isLegalPath,
  LegalNavLinks,
} from "@/components/marketing/legal-nav-links";
import { cn } from "@/lib/utils";

const landingLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#workflow", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export const NAV_SCROLL_SENTINEL_ID = "nav-scroll-sentinel";

export function SiteNav({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const pathname = usePathname();
  const isLegal = isLegalPath(pathname);
  const [scrolled, setScrolled] = useState(isLegal);

  useEffect(() => {
    if (isLegal) {
      setScrolled(true);
      return;
    }

    const sentinel = document.getElementById(NAV_SCROLL_SENTINEL_ID);
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0, rootMargin: "0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isLegal]);

  const showSolidHeader = isLegal || scrolled;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          "border-b transition-[background-color,backdrop-filter,border-color,box-shadow] duration-300 ease-out",
          showSolidHeader
            ? "border-black/6 bg-white/55 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-2xl backdrop-saturate-150"
            : "border-transparent bg-transparent backdrop-blur-none",
        )}
      >
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-6 px-6">
          <div className="flex min-w-0 shrink-0 items-center gap-4">
            <Link href="/" aria-label="Weld.Doc home">
              <Logo />
            </Link>
            {isLegal ? (
              <Link
                href="/"
                className="hidden text-caption text-muted-slate hover:text-ink sm:inline-flex"
              >
                ← Back to home
              </Link>
            ) : null}
          </div>

          <nav className="hidden min-w-0 items-center gap-5 whitespace-nowrap lg:flex xl:gap-8">
            {isLegal ? (
              <LegalNavLinks active={pathname} />
            ) : (
              landingLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-body text-ink hover:opacity-70"
                >
                  {l.label}
                </Link>
              ))
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-4 sm:gap-5">
            {isLoggedIn ? (
              <DsButtonLink href="/dashboard" className="inline-flex">
                Dashboard
              </DsButtonLink>
            ) : (
              <>
                <Link
                  href="/login"
                  className="whitespace-nowrap text-body text-ink hover:opacity-70"
                >
                  Sign in
                </Link>
                <DsButtonLink href="/login" className="inline-flex">
                  Get started
                </DsButtonLink>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
