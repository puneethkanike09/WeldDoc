"use client";

import { AnimatePresence, motion } from "motion/react";
import { ScanLine } from "lucide-react";
import { DEMO_ORG } from "@/components/marketing/hero-demo-data";
import { QrGlyph } from "@/components/brand/qr-glyph";
import type { IdCardQualRow } from "@/lib/iso9606/id-card-model";
import { WelderIdCardView } from "@/components/verify/welder-id-card-view";

const DEMO_ID_ROWS: IdCardQualRow[] = [
  {
    process: "GMAW(135)",
    positionBw: "PF",
    positionFw: "—",
    thicknessBw: "3–24 mm",
    thicknessFw: "—",
    od: "—",
    jointType: "BW",
    fmGroup: "FM1",
    testDate: "14 Jun 2024",
    validUpto: "14 Jun 2028",
  },
];

const DEMO_ID_CARD = {
  orgName: DEMO_ORG,
  welderName: "J. Morrison",
  welderNo: "W#01",
  photoUrl: null as string | null,
  logoUrl: null as string | null,
  rows: DEMO_ID_ROWS,
  status: "Active",
  expiry: "14 Jun 2028",
  employer: DEMO_ORG,
  site: "Plant A",
};

export function HeroDemoVerifyView({ revealed }: { revealed: boolean }) {
  return (
    <div className="demo-light-surface relative h-full min-h-0 overflow-hidden bg-[#f5f0e8]">
      {/* QR — starts centered, slides to the left when revealed */}
      <motion.div
        className="absolute z-10 flex flex-col items-center"
        initial={false}
        animate={{
          left: revealed ? "2%" : "50%",
          top: "50%",
          x: revealed ? "0%" : "-50%",
          y: "-50%",
          scale: revealed ? 0.75 : 1,
        }}
        transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
      >
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-[#7d8896]">
          Scan QR code
        </p>

        <div
          data-demo-target="verify-qr"
          className="relative overflow-hidden rounded-xl border border-[#e0d8ca] bg-white p-3 shadow-[0_8px_28px_rgb(19_37_55_/_0.1)]"
        >
          <QrGlyph className="h-24 w-24 sm:h-28 sm:w-28" />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-x-2 h-0.5 bg-[#e59527] shadow-[0_0_10px_#e59527]"
            animate={{ top: ["10%", "90%", "10%"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <p className="mt-3 flex items-center gap-2 text-[11px] font-medium text-[#132537]">
          <ScanLine className="h-3.5 w-3.5 text-[#e59527]" strokeWidth={2} />
          {revealed ? "Verified" : "Scanning…"}
        </p>
      </motion.div>

      <AnimatePresence>
        {revealed && (
          <motion.div
            key="verify-id-card"
            className="absolute inset-y-0 right-0 flex w-[78%] min-w-0 flex-col items-center justify-center overflow-hidden px-2 py-2 sm:w-[80%]"
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 28 }}
            transition={{ duration: 0.55, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="demo-id-card-scale-side w-full max-w-[680px]">
              <WelderIdCardView {...DEMO_ID_CARD} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
