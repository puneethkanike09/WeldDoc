"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { SignOutButton } from "@/components/app/sign-out-button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileStack,
  Table2,
  Settings,
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/welders", label: "Welders", icon: Users },
  { href: "/reports", label: "Test reports", icon: FileStack },
  { href: "/masterlist", label: "Master list", icon: Table2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  orgName,
  userName,
}: {
  orgName: string;
  userName: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-silver bg-white">
      <div className="px-5 py-5">
        <Link href="/dashboard" aria-label="WeldDoc">
          <Logo />
        </Link>
      </div>

      <div className="mx-4 mb-2 rounded-[10px] bg-frost px-3 py-2.5">
        <p className="truncate font-display text-[13px] font-semibold text-onyx">
          {orgName}
        </p>
        <p className="truncate text-xs text-steel">EN ISO 9606-1</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-3">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14.5px] font-medium transition-colors",
                active
                  ? "bg-onyx text-white"
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
