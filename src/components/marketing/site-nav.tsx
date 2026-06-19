import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { DsButtonLink } from "@/components/marketing/ds-button";

const links = [
  { href: "#features", label: "Features" },
  { href: "#workflow", label: "How it works" },
  { href: "#compare", label: "Compare" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 bg-canvas">
      {/* announcement-bar — desktop/tablet only */}
      <div className="hidden h-9 items-center justify-center bg-cohere-black px-4 text-micro text-white md:flex">
        <span>
          WeldDoc MVP now live for EN ISO 9606-1:2017 —{" "}
          <Link href="#features" className="underline underline-offset-2">
            Learn more
          </Link>
        </span>
      </div>

      {/* global nav — logo left, menu center (desktop), actions right */}
      <div className="border-b border-hairline">
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
