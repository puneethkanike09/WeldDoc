"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type FeatureSlide = {
  title: string;
  body: string;
  image: string;
};

export function FeatureCarousel({ slides }: { slides: FeatureSlide[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    containScroll: "trimSnaps",
    dragFree: false,
  });
  const [selected, setSelected] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const sync = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    sync();
    emblaApi.on("select", sync);
    emblaApi.on("reInit", sync);
    emblaApi.scrollTo(0, true);
    return () => {
      emblaApi.off("select", sync);
      emblaApi.off("reInit", sync);
    };
  }, [emblaApi, sync]);

  return (
    <div>
      <div className="mx-auto flex max-w-[1180px] items-end justify-between gap-6 px-6">
        <div className="max-w-[540px]">
          <h2 className="text-display-lg text-ink">
            Six tools for the ISO 9606-1 lifecycle
          </h2>
          <p className="text-body-ds mt-3 text-ink-muted-80">
            A focused toolkit from registration to on-site verification.
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <NavBtn
            label="Previous"
            disabled={!canPrev}
            onClick={() => emblaApi?.scrollPrev()}
          >
            <ArrowLeft className="h-4 w-4" />
          </NavBtn>
          <NavBtn
            label="Next"
            disabled={!canNext}
            onClick={() => emblaApi?.scrollNext()}
          >
            <ArrowRight className="h-4 w-4" />
          </NavBtn>
        </div>
      </div>

      {/* Viewport aligned to page grid — first card starts flush with content */}
      <div className="mx-auto mt-12 max-w-[1180px] px-6">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-5">
            {slides.map((slide) => (
              <article
                key={slide.title}
                className="min-w-0 flex-[0_0_280px] sm:flex-[0_0_300px] lg:flex-[0_0_320px]"
              >
                <div className="flex h-full flex-col rounded-lg border border-hairline bg-canvas p-5">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                    <Image
                      src={slide.image}
                      alt=""
                      fill
                      sizes="320px"
                      className="object-cover"
                    />
                  </div>
                  <h3 className="text-body-ds mt-5 font-semibold text-ink">
                    {slide.title}
                  </h3>
                  <p className="text-caption-ds mt-1.5 flex-1 text-ink-muted-80">
                    {slide.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <p className="mx-auto mt-6 max-w-[1180px] px-6 text-caption-ds text-ink-muted-48">
        {selected + 1} / {slides.length}
      </p>
    </div>
  );
}

function NavBtn({
  children,
  disabled,
  onClick,
  label,
}: {
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid h-10 w-10 place-items-center rounded-full border border-hairline bg-canvas text-ink",
        "transition-opacity hover:opacity-80 disabled:opacity-30",
      )}
    >
      {children}
    </button>
  );
}
