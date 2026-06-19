import { SiteNav, NAV_SCROLL_SENTINEL_ID } from "@/components/marketing/site-nav";
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
          "relative min-h-screen bg-canvas font-ds-display text-ink",
        )}
      >
        <div
          id={NAV_SCROLL_SENTINEL_ID}
          className="pointer-events-none absolute top-0 left-0 h-px w-full"
          aria-hidden
        />
        <SiteNav />
        {children}
        <SiteFooter />
      </div>
    </SmoothScroll>
  );
}