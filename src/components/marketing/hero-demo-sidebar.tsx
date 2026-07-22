"use client";

import { LayoutDashboard, Table2, Users } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { DEMO_ORG, type DemoNav } from "@/components/marketing/hero-demo-data";

const NAV_ITEMS: {
  key: DemoNav;
  label: string;
  icon: typeof Users;
  targetId: string;
}[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, targetId: "nav-dashboard" },
  { key: "welders", label: "Welder qualification", icon: Users, targetId: "nav-welders" },
  { key: "masterlist", label: "Welder master list", icon: Table2, targetId: "nav-masterlist" },
];

export function HeroDemoSidebar({
  active,
  highlight,
}: {
  active: DemoNav | null;
  highlight: string | null;
}) {
  return (
    <aside className="hidden w-52 shrink-0 flex-col border-r border-silver bg-panel md:flex lg:w-56">
      <div className="px-4 py-4">
        <Logo onDark />
      </div>
      <div className="mx-3 mb-2 rounded-[10px] bg-frost px-3 py-2">
        <p className="truncate font-display text-[12px] font-semibold text-onyx">{DEMO_ORG}</p>
      </div>
      <nav className="space-y-0.5 px-2 pb-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === active;
          const isHighlighted = item.targetId === highlight;
          return (
            <div
              key={item.key}
              data-demo-target={item.targetId}
              className={cn(
                "flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13px] font-medium transition-all",
                isActive ? "bg-inverse-bg text-inverse-fg" : "text-charcoal",
                isHighlighted && "ring-2 ring-ember/70 ring-offset-2 ring-offset-panel",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              <span className="truncate">{item.label}</span>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
