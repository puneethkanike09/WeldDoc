import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SmoothScroll } from "@/components/marketing/smooth-scroll";
import { spaceGrotesk } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SmoothScroll>
      <div
        className={cn(
          spaceGrotesk.className,
          "min-h-screen bg-canvas font-ds-display text-ink",
        )}
      >
        <SiteNav />
        {children}
        <SiteFooter />
      </div>
    </SmoothScroll>
  );
}