import type { IdCardQualRow } from "@/lib/iso9606/id-card-model";
import type { OperatorIdCardQualRow } from "@/lib/iso14732/id-card-model";

type IdCardViewBase = {
  orgName: string;
  welderName: string;
  welderNo: string;
  photoUrl: string | null;
  logoUrl: string | null;
  status: string;
  expiry: string | null;
  statusNotice?: string | null;
  employer: string | null;
  site: string;
  cardHeading?: string;
  plantIdLabel?: string;
  standardLabel?: string;
};

export type WelderIdCardViewProps = IdCardViewBase &
  (
    | { tableVariant?: "welder"; rows: IdCardQualRow[] }
    | { tableVariant: "operator"; rows: OperatorIdCardQualRow[] }
  );

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
    case "Inactive":
      return { bg: "bg-frost", fg: "text-graphite", label: "INACTIVE" };
    case "Suspended":
      return { bg: "bg-[#fde8e4]", fg: "text-ember", label: "SUSPENDED" };
    default:
      return {
        bg: "bg-frost",
        fg: "text-graphite",
        label: status.toUpperCase(),
      };
  }
}

function PersonalField({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-steel">
        {label}
      </p>
      <p className={`text-sm text-onyx ${bold ? "font-semibold" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function WelderQualTable({ rows }: { rows: IdCardQualRow[] }) {
  return (
    <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
      <table className="w-full min-w-[680px] border-collapse text-center text-xs text-charcoal">
        <thead className="bg-frost text-graphite">
          <tr className="border-b border-silver">
            <th className="border-r border-silver px-2 py-2 font-semibold" rowSpan={2}>
              Process
            </th>
            <th className="border-r border-silver px-2 py-2 font-semibold" colSpan={2}>
              Position
            </th>
            <th className="border-r border-silver px-2 py-2 font-semibold" colSpan={2}>
              Thickness
            </th>
            <th className="border-r border-silver px-2 py-2 font-semibold" rowSpan={2}>
              OD
            </th>
            <th className="border-r border-silver px-2 py-2 font-semibold" rowSpan={2}>
              Joint type
            </th>
            <th className="border-r border-silver px-2 py-2 font-semibold" rowSpan={2}>
              FM GROUP
            </th>
            <th className="border-r border-silver px-2 py-2 font-semibold" rowSpan={2}>
              Test date
            </th>
            <th className="px-2 py-2 font-semibold" rowSpan={2}>
              Valid upto
            </th>
          </tr>
          <tr className="border-b border-silver">
            <th className="border-r border-silver px-2 py-1.5 font-semibold">BW</th>
            <th className="border-r border-silver px-2 py-1.5 font-semibold">FW</th>
            <th className="border-r border-silver px-2 py-1.5 font-semibold">BW</th>
            <th className="border-r border-silver px-2 py-1.5 font-semibold">FW</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={`border-b border-silver last:border-b-0 ${i % 2 === 1 ? "bg-white/80" : "bg-white"}`}
            >
              <td className="whitespace-nowrap border-r border-silver px-2 py-2 font-semibold text-onyx">
                {row.process}
              </td>
              <td className="whitespace-pre-line border-r border-silver px-2 py-2">
                {row.positionBw}
              </td>
              <td className="whitespace-pre-line border-r border-silver px-2 py-2">
                {row.positionFw}
              </td>
              <td className="whitespace-nowrap border-r border-silver px-2 py-2">
                {row.thicknessBw}
              </td>
              <td className="whitespace-nowrap border-r border-silver px-2 py-2">
                {row.thicknessFw}
              </td>
              <td className="whitespace-nowrap border-r border-silver px-2 py-2">
                {row.od}
              </td>
              <td className="whitespace-nowrap border-r border-silver px-2 py-2">
                {row.jointType}
              </td>
              <td className="whitespace-pre-line border-r border-silver px-2 py-2">
                {row.fmGroup}
              </td>
              <td className="whitespace-nowrap border-r border-silver px-2 py-2">
                {row.testDate}
              </td>
              <td className="whitespace-nowrap px-2 py-2">{row.validUpto}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OperatorQualTable({ rows }: { rows: OperatorIdCardQualRow[] }) {
  return (
    <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
      <table className="w-full min-w-[520px] border-collapse text-center text-xs text-charcoal">
        <thead className="bg-frost text-graphite">
          <tr className="border-b border-silver">
            <th className="border-r border-silver px-2 py-2 font-semibold">Process</th>
            <th className="border-r border-silver px-2 py-2 font-semibold">
              Welding equipment type
            </th>
            <th className="border-r border-silver px-2 py-2 font-semibold">Joint type</th>
            <th className="border-r border-silver px-2 py-2 font-semibold">Test date</th>
            <th className="px-2 py-2 font-semibold">Valid upto</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={`border-b border-silver last:border-b-0 ${i % 2 === 1 ? "bg-white/80" : "bg-white"}`}
            >
              <td className="whitespace-nowrap border-r border-silver px-2 py-2 font-semibold text-onyx">
                {row.process}
              </td>
              <td className="whitespace-nowrap border-r border-silver px-2 py-2">
                {row.weldingEquipmentType}
              </td>
              <td className="whitespace-nowrap border-r border-silver px-2 py-2">
                {row.jointType}
              </td>
              <td className="whitespace-nowrap border-r border-silver px-2 py-2">
                {row.testDate}
              </td>
              <td className="whitespace-nowrap px-2 py-2">{row.validUpto}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function WelderIdCardView({
  orgName,
  welderName,
  welderNo,
  photoUrl,
  logoUrl,
  rows,
  status,
  expiry,
  statusNotice = null,
  employer,
  site,
  cardHeading = "Welder ID card",
  plantIdLabel = "Welder ID",
  standardLabel = "EN ISO 9606-1:2017",
  tableVariant = "welder",
}: WelderIdCardViewProps) {
  const badge = statusBadge(status);

  return (
    <div className="overflow-hidden rounded-sm border-2 border-charcoal bg-white shadow-[var(--shadow-card)]">
      {/* Header — logo + company name (centered) */}
      <div className="flex items-center justify-center gap-3 bg-ember-soft px-4 py-3.5">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="h-7 max-w-[140px] object-contain"
          />
        ) : null}
        <span className="font-display text-base font-bold text-onyx">
          {orgName}
        </span>
      </div>

      {/* Body — photo left, personal info right */}
      <div className="flex gap-4 border-b border-silver bg-white px-4 py-4">
        <div className="shrink-0">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={welderName}
              className="h-[84px] w-[66px] rounded-sm border border-silver object-cover"
            />
          ) : (
            <span className="grid h-[84px] w-[66px] place-items-center rounded-sm border border-silver bg-frost font-display text-xl font-semibold text-steel">
              {welderName.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-steel">
            {cardHeading}
          </p>
          <PersonalField label="Name" value={welderName} bold />
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <PersonalField label={plantIdLabel} value={welderNo} bold />
            {employer ? <PersonalField label="Employer" value={employer} /> : null}
            {site !== "—" ? <PersonalField label="Branch" value={site} /> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.bg} ${badge.fg}`}
            >
              {badge.label}
            </span>
            {statusNotice ? (
              <span className="text-xs font-medium text-ember">{statusNotice}</span>
            ) : (
              <span className="text-xs text-graphite">Valid {expiry ?? "—"}</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer — qualifications or registry notice */}
      <div className="bg-frost">
        {statusNotice ? (
          <div className="border-t border-silver bg-[#fde8e4]/40 px-6 py-8 text-center">
            <p className="font-display text-sm font-semibold uppercase tracking-wide text-ember">
              {status === "Suspended" ? "Suspended" : "Inactive"}
            </p>
            <p className="mt-2 text-sm text-charcoal">{statusNotice}</p>
          </div>
        ) : (
          <>
        <div className="bg-charcoal py-1.5 text-center text-[11px] font-semibold tracking-wide text-white">
          {standardLabel}
        </div>
        {tableVariant === "operator" ? (
          <OperatorQualTable rows={rows as OperatorIdCardQualRow[]} />
        ) : (
          <WelderQualTable rows={rows as IdCardQualRow[]} />
        )}
          </>
        )}
      </div>
    </div>
  );
}
