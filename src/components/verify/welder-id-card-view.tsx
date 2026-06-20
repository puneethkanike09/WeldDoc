import type { Organization, Welder } from "@/types/db";

export interface WelderIdCardViewProps {
  org: Pick<Organization, "name" | "location_code">;
  welder: Pick<
    Welder,
    "full_name" | "uid" | "welder_id" | "employer" | "branch_location"
  >;
  photoUrl: string | null;
  logoUrl: string | null;
  processes: string[];
  status: string;
  expiry: string | null;
}

function statusBadge(status: string): { bg: string; fg: string; label: string } {
  switch (status) {
    case "Active":
      return { bg: "bg-[#dcefe0]", fg: "text-[#214224]", label: "QUALIFIED" };
    case "Expiring":
      return { bg: "bg-[#fef3c7]", fg: "text-[#8a6a00]", label: "EXPIRING" };
    case "Expired":
      return { bg: "bg-[#fde8e4]", fg: "text-ember", label: "EXPIRED" };
    case "Pending":
      return { bg: "bg-[#e8eef8]", fg: "text-sapphire", label: "PENDING" };
    default:
      return {
        bg: "bg-frost",
        fg: "text-graphite",
        label: status.toUpperCase(),
      };
  }
}

function CardFace({
  org,
  welder,
  photoUrl,
  logoUrl,
  processes,
  status,
  expiry,
  side,
}: WelderIdCardViewProps & { side: "front" | "back" }) {
  const welderNo = welder.welder_id ?? welder.uid;
  const site = welder.branch_location ?? org.location_code ?? "—";
  const badge = statusBadge(status);
  const processLine = processes.length ? processes.join(", ") : "—";

  if (side === "back") {
    return (
      <div className="flex aspect-[85.6/54] w-full flex-col overflow-hidden rounded-xl border-2 border-charcoal bg-white shadow-[var(--shadow-card)]">
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-5 text-center">
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-onyx">
            Welder qualification
          </p>
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-graphite">
            This card certifies welder qualification per EN ISO 9606-1:2017.
          </p>
          <p className="mt-3 text-[13px] text-charcoal">
            Processes: {processLine}
          </p>
          <p className="mt-1 text-[13px] text-charcoal">
            Valid until {expiry ?? "—"}
          </p>
        </div>
        <div className="border-t border-silver bg-onyx px-4 py-2.5 text-center text-[11px] text-steel">
          Property of {org.name} · {site} · Not transferable
        </div>
      </div>
    );
  }

  return (
    <div className="flex aspect-[85.6/54] w-full flex-col overflow-hidden rounded-xl border-2 border-charcoal bg-white shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between bg-onyx px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 pr-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="h-4 max-w-[72px] object-contain object-left"
            />
          ) : null}
          <span className="truncate font-display text-sm font-semibold text-white">
            {org.name}
          </span>
        </div>
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-silver">
          Welder ID
        </span>
      </div>

      <div className="flex flex-1 gap-3 px-4 py-3">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={welder.full_name}
            className="h-[72px] w-[58px] shrink-0 border border-silver object-cover"
          />
        ) : (
          <span className="grid h-[72px] w-[58px] shrink-0 place-items-center border border-silver bg-frost font-display text-xl font-semibold text-steel">
            {welder.full_name.slice(0, 1).toUpperCase()}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-semibold text-onyx">
            {welder.full_name}
          </p>
          <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1.5">
            <div>
              <p className="text-[9px] uppercase tracking-wide text-steel">
                Welder no.
              </p>
              <p className="text-xs font-semibold text-onyx">{welderNo}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wide text-steel">
                UID
              </p>
              <p className="truncate text-xs text-onyx">{welder.uid}</p>
            </div>
          </div>
          <div className="mt-1.5">
            <p className="text-[9px] uppercase tracking-wide text-steel">
              Processes
            </p>
            <p className="truncate text-xs text-onyx">{processLine}</p>
          </div>
          <div className="mt-1">
            <p className="text-[9px] uppercase tracking-wide text-steel">
              Standard
            </p>
            <p className="text-xs text-onyx">EN ISO 9606-1:2017</p>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.bg} ${badge.fg}`}
            >
              {badge.label}
            </span>
            <span className="text-[11px] text-graphite">
              Valid {expiry ?? "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-silver bg-frost px-4 py-2 text-[11px]">
        <span className="truncate text-graphite">
          {welder.employer ?? org.name}
        </span>
        <span className="shrink-0 text-steel">{site} · WeldDoc</span>
      </div>
    </div>
  );
}

export function WelderIdCardView(props: WelderIdCardViewProps) {
  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <CardFace {...props} side="front" />
      <CardFace {...props} side="back" />
    </div>
  );
}
