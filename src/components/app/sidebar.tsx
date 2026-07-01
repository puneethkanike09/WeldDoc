"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { SignOutButton } from "@/components/app/sign-out-button";
import { useAppTheme } from "@/components/app/app-theme-provider";
import { cn } from "@/lib/utils";
import {
  ACTIVE_STANDARD_SLUG,
  type StandardSlug,
} from "@/lib/standards/catalog";
import {
  readActiveStandardCookie,
  workspacePersonnelHref,
  workspacePersonnelLabel,
  workspaceMasterlistHref,
} from "@/lib/standards/active-standard";
import { SidebarStandardSelect } from "@/components/app/sidebar-standard-select";
import {
  LayoutDashboard,
  Users,
  FileStack,
  Table2,
  Settings,
  X,
  LayoutGrid,
} from "lucide-react";

export function Sidebar({
  orgName,
  userName,
  onNavigate,
}: {
  orgName: string;
  userName: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { resolvedTheme } = useAppTheme();
  const isStandardsHub = pathname === "/standards";
  const [slug, setSlug] = useState<StandardSlug>(ACTIVE_STANDARD_SLUG);

  useEffect(() => {
    setSlug(readActiveStandardCookie() ?? ACTIVE_STANDARD_SLUG);
  }, [pathname]);

  const workspaceNav = useMemo(
    () => [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      {
        href: workspacePersonnelHref(slug),
        label: workspacePersonnelLabel(slug),
        icon: Users,
      },
      {
        href: `${workspacePersonnelHref(slug)}/qualify/group`,
        label: "Group qualify",
        icon: FileStack,
      },
      { href: workspaceMasterlistHref(slug), label: "Master list", icon: Table2 },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
    [slug],
  );

  const nav = isStandardsHub
    ? [{ href: "/standards", label: "Standards", icon: LayoutGrid }]
    : [
      { href: "/standards", label: "Standards", icon: LayoutGrid },
      ...workspaceNav,
    ];

  const activeHref = useMemo(() => {
    const matches = nav.filter(
      (item) =>
        pathname === item.href || pathname.startsWith(`${item.href}/`),
    );
    matches.sort((a, b) => b.href.length - a.href.length);
    return matches[0]?.href ?? null;
  }, [nav, pathname]);

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-silver bg-panel">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/standards" aria-label="WeldDoc" onClick={onNavigate}>
          <Logo onDark={resolvedTheme === "dark"} />
        </Link>
        <button
          type="button"
          aria-label="Close menu"
          onClick={onNavigate}
          className="grid h-8 w-8 place-items-center rounded-sm text-charcoal hover:bg-onyx/5 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mx-4 mb-2 rounded-[10px] bg-frost px-3 py-2.5">
        <p className="truncate font-display text-[13px] font-semibold text-onyx">
          {orgName}
        </p>
        <SidebarStandardSelect
          value={slug}
          className="mt-1 h-8 border-0 bg-transparent px-0 text-xs font-medium text-steel shadow-none hover:text-charcoal focus:border-0 focus:ring-0"
        />
      </div>

      <nav className="sleek-scroll min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {nav.map((item) => {
          const active = item.href === activeHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14.5px] font-medium transition-colors",
                active
                  ? "bg-inverse-bg text-inverse-fg"
                  : "text-charcoal hover:bg-onyx/5",
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-silver p-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-ember/10 font-display text-sm font-semibold text-ember">
            {userName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-medium text-onyx">
              {userName}
            </p>
            <p className="truncate text-xs text-steel">Welding Engineer</p>
          </div>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
