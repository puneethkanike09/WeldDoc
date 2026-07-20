import { SiteNav, NAV_SCROLL_SENTINEL_ID } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SmoothScroll } from "@/components/marketing/smooth-scroll";
import { inter } from "@/lib/fonts";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <SmoothScroll>
      <div
        data-marketing-site
        className={cn(
          inter.className,
          "relative min-h-screen bg-canvas font-sans text-ink",
        )}
        suppressHydrationWarning
      >
        <div
          id={NAV_SCROLL_SENTINEL_ID}
          className="pointer-events-none absolute top-0 left-0 h-px w-full"
          aria-hidden
        />
        <SiteNav isLoggedIn={Boolean(user)} />
        {children}
        <SiteFooter />
      </div>
    </SmoothScroll>
  );
}