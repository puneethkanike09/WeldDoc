"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Globe, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ISO_9606_1, iso9606PdfHref, tr20172PdfHref, tr20173PdfHref, TR_20172, TR_20173, type Iso9606TableKey } from "@/lib/iso9606/standards-reference";

export interface StandardPdfDrawerPayload {
  src: string;
  title: string;
  description: string;
}

/** Bust cache so the browser PDF viewer re-navigates to the hash target. */
function pdfSrcWithReloadToken(src: string): string {
  const hashIndex = src.indexOf("#");
  const path = hashIndex === -1 ? src : src.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : src.slice(hashIndex);
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}_=${Date.now()}${hash}`;
}

interface StandardPdfDrawerContextValue {
  open: (payload: StandardPdfDrawerPayload) => void;
}

const StandardPdfDrawerContext =
  createContext<StandardPdfDrawerContextValue | null>(null);

export function useStandardPdfDrawer() {
  const ctx = useContext(StandardPdfDrawerContext);
  if (!ctx) {
    throw new Error(
      "StandardPdfDrawer components must be used within StandardPdfDrawerProvider",
    );
  }
  return ctx;
}

/** One global drawer host — iframe stays mounted after first open. */
export function StandardPdfDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [meta, setMeta] = useState<StandardPdfDrawerPayload | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [hostReady, setHostReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const targetSrcRef = useRef<string | null>(null);
  const iframeSrcRef = useRef<string | null>(null);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);

  useEffect(() => {
    iframeSrcRef.current = iframeSrc;
  }, [iframeSrc]);

  useEffect(() => setHostReady(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const resetIframeView = useCallback(() => {
    const target = targetSrcRef.current;
    if (!target) return;
    setPdfLoading(true);
    setIframeSrc(pdfSrcWithReloadToken(target));
  }, []);

  const recoverBlankIframe = useCallback(() => {
    const iframe = iframeRef.current;
    const target = targetSrcRef.current;
    if (!iframe || !target) return;
    if (iframe.src === "about:blank" || iframe.src.endsWith("about:blank")) {
      setPdfLoading(true);
      setIframeSrc(pdfSrcWithReloadToken(target));
    }
  }, []);

  const openDrawer = useCallback((payload: StandardPdfDrawerPayload) => {
    const sameTarget = targetSrcRef.current === payload.src;
    targetSrcRef.current = payload.src;
    setMeta(payload);

    const prev = iframeSrcRef.current;
    if (!prev) {
      setPdfLoading(true);
      setIframeSrc(payload.src);
    } else if (!sameTarget) {
      setPdfLoading(true);
      setIframeSrc(pdfSrcWithReloadToken(payload.src));
    }

    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    recoverBlankIframe();
    const iframe = iframeRef.current;
    if (!iframe) return;
    // Chrome's PDF viewer can fail to paint after the drawer was hidden.
    iframe.style.width = "99.99%";
    requestAnimationFrame(() => {
      iframe.style.width = "100%";
    });
  }, [open, recoverBlankIframe]);

  const handleIframeLoad = useCallback(() => {
    setPdfLoading(false);
    recoverBlankIframe();
  }, [recoverBlankIframe]);

  return (
    <StandardPdfDrawerContext.Provider value={{ open: openDrawer }}>
      {children}
      {hostReady && iframeSrc
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Close reference panel"
                className={cn(
                  "fixed inset-0 z-[100] bg-onyx/40 backdrop-blur-[2px]",
                  !open && "hidden",
                )}
                onClick={close}
              />
              <aside
                role="dialog"
                aria-modal={open}
                aria-hidden={!open}
                aria-label={meta?.title ?? "Standard reference"}
                className={cn(
                  "fixed inset-y-0 right-0 z-[101] flex h-full w-full max-w-2xl flex-col border-l border-silver bg-panel shadow-(--shadow-lift)",
                  !open && "hidden",
                )}
              >
                <div className="flex items-start gap-3 border-b border-silver px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-semibold text-onyx">
                      {meta?.title}
                    </p>
                    <p className="mt-0.5 text-xs text-steel">
                      {meta?.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-steel hover:bg-frost hover:text-onyx"
                      aria-label="Reset PDF view to reference section"
                      onClick={resetIframeView}
                    >
                      <RotateCcw className="size-3.5" aria-hidden />
                      Reset view
                    </button>
                    <button
                      type="button"
                      aria-label="Close reference panel"
                      className="grid h-8 w-8 place-items-center rounded-md text-steel hover:bg-frost hover:text-onyx"
                      onClick={close}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="relative min-h-0 flex-1">
                  {pdfLoading ? (
                    <div className="absolute inset-0 z-10 grid place-items-center bg-white/80 text-xs text-steel">
                      Loading PDF…
                    </div>
                  ) : null}
                  <iframe
                    ref={iframeRef}
                    src={iframeSrc}
                    title={meta?.title ?? "Standard reference PDF"}
                    className="h-full min-h-0 w-full bg-white"
                    onLoad={handleIframeLoad}
                  />
                </div>
              </aside>
            </>,
            document.body,
          )
        : null}
    </StandardPdfDrawerContext.Provider>
  );
}

interface Iso9606PdfDrawerProps {
  page?: number;
  title?: string;
  description?: string;
  className?: string;
}

/** Opens any standard PDF in the side drawer. */
export function StandardPdfGlobe({
  src,
  title,
  description,
  className,
}: {
  src: string;
  title: string;
  description: string;
  className?: string;
}) {
  const { open } = useStandardPdfDrawer();

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-steel transition-colors hover:bg-frost hover:text-onyx focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-onyx/20",
        className,
      )}
      aria-label={`Open ${title} in reference panel`}
      onClick={() => open({ src, title, description })}
    >
      <Globe className="size-4" aria-hidden />
    </button>
  );
}

export function Iso9606PdfDrawer({
  page = ISO_9606_1.tables.revalidation.page,
  title = `${ISO_9606_1.title} — ${ISO_9606_1.tables.revalidation.label}`,
  description = "Reference PDF — open standard at the cited section",
  className,
}: Iso9606PdfDrawerProps) {
  return (
    <StandardPdfGlobe
      src={iso9606PdfHref(page)}
      title={title}
      description={description}
      className={className}
    />
  );
}

/** Globe trigger — opens clause 9.3 revalidation reference. */
export function Iso9606RevalidationPdfDrawer() {
  return <Iso9606PdfDrawer />;
}

/** Globe next to a field label — opens the relevant ISO 9606-1 table. */
export function Iso9606TablePdfGlobe({ table }: { table: Iso9606TableKey }) {
  const ref = ISO_9606_1.tables[table];
  return (
    <Iso9606PdfDrawer
      page={ref.page}
      title={`${ISO_9606_1.shortTitle} — ${ref.label}`}
      description={ref.label}
    />
  );
}

export function Tr20172PdfGlobe({ className }: { className?: string }) {
  return (
    <StandardPdfGlobe
      src={tr20172PdfHref(TR_20172.materialTablePage)}
      title={TR_20172.title}
      description="Material grouping table — ISO/TR 15608"
      className={className}
    />
  );
}

export function Tr20173PdfGlobe({ className }: { className?: string }) {
  return (
    <StandardPdfGlobe
      src={tr20173PdfHref(TR_20173.materialTablePage)}
      title={TR_20173.title}
      description="Material grouping table — ISO/TR 15608"
      className={className}
    />
  );
}
