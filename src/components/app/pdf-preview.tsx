"use client";

import { useRef } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { ArrowLeft, Download, Printer } from "lucide-react";

export function PdfPreview({
  src,
  backHref,
  downloadHref,
  title,
}: {
  src: string;
  backHref: string;
  downloadHref: string;
  title: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <ButtonLink href={backHref} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" /> Back to profile
        </ButtonLink>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => iframeRef.current?.contentWindow?.print()}
          >
            <Printer className="h-4 w-4" /> Print
          </Button>
          <ButtonLink href={downloadHref} variant="primary" size="sm">
            <Download className="h-4 w-4" /> Download PDF
          </ButtonLink>
        </div>
      </div>

      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        className="min-h-[520px] w-full flex-1 rounded-[12px] border border-silver bg-white shadow-[var(--shadow-subtle)]"
      />
    </div>
  );
}
