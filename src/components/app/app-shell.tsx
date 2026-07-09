"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Sidebar } from "@/components/app/sidebar";
import { useAppTheme } from "@/components/app/app-theme-provider";
import { cn } from "@/lib/utils";

export function AppShell({
  orgName,
  userName,
  children,
}: {
  orgName: string;
  userName: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { resolvedTheme } = useAppTheme();

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <div
      className={cn(
        "app-shell flex h-full overflow-hidden bg-parchment",
        resolvedTheme === "dark" && "dark",
      )}
      suppressHydrationWarning
    >

      {/* Backdrop (mobile only) */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-onyx/40 backdrop-blur-[2px] lg:hidden"
          aria-hidden
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar: off-canvas drawer on mobile, sticky column on desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <Sidebar
          orgName={orgName}
          userName={userName}
          onNavigate={() => setOpen(false)}
        />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="z-30 flex h-14 shrink-0 items-center gap-3 border-b border-silver bg-panel px-4 lg:hidden">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-[10px] text-charcoal hover:bg-onyx/5"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/dashboard" aria-label="Weld.Doc home">
            <Logo onDark={resolvedTheme === "dark"} />
          </Link>
        </header>

        <main className="sleek-scroll min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
