/** Dark product mock panel — structural placeholder per app.e agent-console-card */
export function QualificationConsole() {
  return (
    <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-primary/95 p-4 text-white backdrop-blur-sm sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-[320px] sm:p-5">
      <p className="font-mono text-micro uppercase tracking-[0.28px] text-white/60">
        Live status
      </p>
      <p className="text-feature-heading mt-2 font-normal tracking-normal text-white">
        D. Pradhan
      </p>
      <p className="text-caption mt-1 text-white/70">WLD-2026-047 · GMAW 135</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-sm bg-active/30 px-2 py-1 text-micro text-[#b8e6bc]">
          Qualified
        </span>
        <span className="rounded-sm border border-white/20 px-2 py-1 text-micro text-white/80">
          PF · BW
        </span>
        <span className="rounded-sm border border-white/20 px-2 py-1 text-micro text-white/80">
          3–24 mm
        </span>
      </div>
      <div className="mt-4 border-t border-white/15 pt-3">
        <p className="text-micro text-white/50">Valid until</p>
        <p className="text-caption text-white/90">14 Jun 2028</p>
      </div>
    </div>
  );
}
