import type { Metadata } from "next";
import { spaceGrotesk } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import "./brochure.css";

export const metadata: Metadata = {
  title: "Brochure",
  description: "Weld.Doc product brochure — qualification management for fabrication shops.",
  robots: { index: false, follow: false },
};

export default function BrochureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={cn(spaceGrotesk.className, "brochure-layout")}>{children}</div>
  );
}
