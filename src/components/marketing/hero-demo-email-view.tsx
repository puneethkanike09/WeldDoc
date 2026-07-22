"use client";

import { Mail } from "lucide-react";
import { DEMO_ORG } from "@/components/marketing/hero-demo-data";
import { cn } from "@/lib/utils";

export const EMAIL_SUBJECT = `Weld.Doc — qualification status for ${DEMO_ORG}`;
const CHECKED_ON = "21/07/2026";

type DigestSection = {
  title: string;
  empty?: boolean;
  items?: string[];
};

const DIGEST_SECTIONS: DigestSection[] = [
  {
    title: "ALREADY EXPIRED",
    items: [
      "W#12 · SMAW (111) · Certificate expiry · Expired 15/06/2026 (36d ago)",
    ],
  },
  {
    title: "EXPIRES TODAY",
    items: ["W#02 · SMAW (111) · Continuity check · Due 21/07/2026"],
  },
  {
    title: "EXPIRING WITHIN 30 DAYS",
    items: [
      "W#02 · SMAW (111) · Continuity · Due 03/09/2026 (44d)",
      "W#01 · GMAW (135) · Certificate · Due 14/06/2028 (692d)",
    ],
  },
  {
    title: "EXPIRING WITHIN 7 DAYS",
    empty: true,
  },
];

function WeldDocEmailBody({ compact }: { compact?: boolean }) {
  return (
    <div className={cn("demo-email-canvas rounded-[10px]", compact ? "p-2" : "p-3")}>
      <div className="overflow-hidden rounded-[12px] border border-[#e0d8ca] bg-white">
        <div className="bg-[#132537] px-4 py-3">
          <span className="font-display text-[14px] font-bold tracking-tight">
            <span className="text-white">Weld</span>
            <span className="text-[#e59527]">.</span>
            <span className="text-white">Doc</span>
          </span>
        </div>
        <div className={cn("space-y-2.5", compact ? "p-3" : "p-4")}>
          <p className="text-[11px] text-[#3c4a57]">Hi,</p>
          <h2 className="font-display text-[14px] font-semibold text-[#132537]">
            Welder certificate expiry status
          </h2>
          <p className="text-[11px] text-[#3c4a57]">{DEMO_ORG}</p>

          {DIGEST_SECTIONS.map((section) => (
            <div
              key={section.title}
              data-demo-target={
                section.title === "EXPIRING WITHIN 30 DAYS" ? "email-section-expiring" : undefined
              }
              className="space-y-1"
            >
              <p className="text-[11px] font-bold text-[#132537]">
                {section.title}
                {!section.empty && section.items ? ` (${section.items.length})` : ""}
              </p>
              {section.empty ? (
                <p className="text-[10px] leading-snug text-[#3c4a57]">
                  ✅ No certificates or continuity checks expiring within 7 days
                </p>
              ) : (
                <ul className="list-disc space-y-0.5 pl-3.5">
                  {section.items?.map((line) => (
                    <li key={line} className="text-[10px] leading-snug text-[#3c4a57]">
                      {line}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <hr className="border-[#e0d8ca]" />
          <p className="text-[10px] text-[#7d8896]">Checked on: {CHECKED_ON}</p>
          <p className="text-[10px] text-[#7d8896]">
            This alert was sent automatically from Weld.Doc.
          </p>
        </div>
      </div>
    </div>
  );
}

export function HeroDemoEmailInboxView({ highlight }: { highlight: string | null }) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#0a1219]">
      <div className="flex shrink-0 items-center gap-2 border-b border-silver px-4 py-2.5">
        <Mail className="h-4 w-4 text-steel" strokeWidth={1.75} />
        <p className="text-[13px] font-medium text-charcoal">Inbox</p>
        <span className="ml-1 rounded-full bg-ember px-1.5 py-0.5 text-[10px] font-semibold text-[#132537]">
          1 new
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <button
          type="button"
          tabIndex={-1}
          data-demo-target="email-inbox-item"
          className={cn(
            "w-full border-b border-silver/70 bg-frost px-4 py-3.5 text-left",
            highlight === "email-inbox-item" && "ring-2 ring-ember/70 ring-inset",
          )}
        >
          <p className="truncate text-[11px] font-medium text-charcoal">Weld.Doc</p>
          <p className="mt-0.5 truncate text-[12px] font-semibold text-onyx">{EMAIL_SUBJECT}</p>
          <p className="mt-1 truncate text-[10px] text-steel">
            Welder certificate expiry status — {DEMO_ORG}
          </p>
        </button>
        <div className="border-b border-silver/40 px-4 py-3 opacity-40">
          <p className="text-[11px] text-steel">Google Workspace</p>
          <p className="mt-0.5 text-[11px] text-charcoal">Your weekly summary</p>
        </div>
      </div>
    </div>
  );
}

export function HeroDemoEmailMessageView() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#0a1219]">
      <div className="shrink-0 border-b border-silver bg-panel px-4 py-2.5">
        <p className="text-[10px] text-steel">
          From <span className="text-charcoal">Weld.Doc &lt;hello@welddoc.in&gt;</span>
        </p>
        <p className="mt-0.5 text-[10px] text-steel">
          To <span className="text-charcoal">sarah@apexfab.com</span>
        </p>
        <p className="mt-1.5 text-[12px] font-semibold leading-snug text-onyx">{EMAIL_SUBJECT}</p>
      </div>
      <div className="demo-light-surface min-h-0 flex-1 overflow-hidden p-2">
        <WeldDocEmailBody compact />
      </div>
    </div>
  );
}
