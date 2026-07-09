import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { COLORS } from "./styles";
import type { IdCardQualRow } from "@/lib/iso9606/id-card-model";
import type { Organization, Welder } from "@/types/db";

export interface IdCardData {
  org: Organization;
  welder: Welder;
  photoUrl: string | null;
  logoUrl: string | null;
  qrDataUrl: string | null;
  welderName: string;
  welderNo: string;
  rows: IdCardQualRow[];
  status: string;
  expiry: string | null;
  statusNotice?: string | null;
  /** Defaults to "WELDER ID CARD". */
  cardHeading?: string;
  /** Defaults to "WELDER ID". */
  plantIdLabel?: string;
  /** Defaults to `Welder ID {welderNo}`. */
  documentTitle?: string;
  /** Defaults to EN ISO 9606-1:2017. */
  standardLabel?: string;
}

/** Landscape badge — header, body (photo + info), qualification footer. */
const CARD: [number, number] = [340, 232];

const border = { borderWidth: 0.5, borderColor: COLORS.silver };

/** Flex weights for flat qualification table columns. */
const COL = {
  process: 1.15,
  posBw: 0.82,
  posFw: 1.05,
  thkBw: 0.82,
  thkFw: 1.05,
  od: 0.95,
  joint: 0.82,
  fm: 1.34,
} as const;

function statusStyle(status: string): { bg: string; fg: string; label: string } {
  switch (status) {
    case "Active":
      return { bg: "#dcefe0", fg: COLORS.active, label: "QUALIFIED" };
    case "Expiring":
      return { bg: "#fef3c7", fg: "#8a6a00", label: "EXPIRING" };
    case "Expired":
      return { bg: "#fde8e4", fg: COLORS.ember, label: "EXPIRED" };
    case "Pending":
      return { bg: "#e8eef8", fg: COLORS.sapphire, label: "PENDING" };
    case "Inactive":
      return { bg: COLORS.frost, fg: COLORS.graphite, label: "INACTIVE" };
    case "Suspended":
      return { bg: "#fde8e4", fg: COLORS.ember, label: "SUSPENDED" };
    default:
      return { bg: COLORS.frost, fg: COLORS.graphite, label: status.toUpperCase() };
  }
}

const cellPad = { paddingHorizontal: 2, paddingVertical: 2 };
const hdr = {
  fontSize: 4,
  fontFamily: "Helvetica-Bold" as const,
  textAlign: "center" as const,
  color: COLORS.graphite,
  lineHeight: 1.15,
};
/** Welder portrait in body (pt). */
const PHOTO: [number, number] = [56, 72];
const cell = {
  fontSize: 4,
  textAlign: "center" as const,
  color: COLORS.charcoal,
  lineHeight: 1.15,
};

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
    <View style={{ marginBottom: 4 }}>
      <Text
        style={{
          fontSize: 4.5,
          color: COLORS.steel,
          letterSpacing: 0.5,
          marginBottom: 1,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 7,
          color: COLORS.onyx,
          fontFamily: bold ? "Helvetica-Bold" : "Helvetica",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function TableCell({
  flex,
  children,
  header,
  bg,
  bold,
  last,
}: {
  flex: number;
  children: string;
  header?: boolean;
  bg: string;
  bold?: boolean;
  last?: boolean;
}) {
  return (
    <View
      style={{
        flex,
        minWidth: 0,
        ...cellPad,
        ...border,
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: last ? 0 : border.borderWidth,
        backgroundColor: bg,
        justifyContent: "center",
      }}
    >
      <Text
        style={
          header
            ? hdr
            : { ...cell, fontFamily: bold ? "Helvetica-Bold" : "Helvetica" }
        }
        wrap
      >
        {children}
      </Text>
    </View>
  );
}

function TableHeader() {
  const bg = COLORS.frost;
  return (
    <View style={{ flexDirection: "row", backgroundColor: bg, ...border, borderTopWidth: 0 }}>
      <TableCell flex={COL.process} header bg={bg}>
        Process
      </TableCell>
      <TableCell flex={COL.posBw} header bg={bg}>
        {"Pos\nBW"}
      </TableCell>
      <TableCell flex={COL.posFw} header bg={bg}>
        {"Pos\nFW"}
      </TableCell>
      <TableCell flex={COL.thkBw} header bg={bg}>
        {"Thk\nBW"}
      </TableCell>
      <TableCell flex={COL.thkFw} header bg={bg}>
        {"Thk\nFW"}
      </TableCell>
      <TableCell flex={COL.od} header bg={bg}>
        OD
      </TableCell>
      <TableCell flex={COL.joint} header bg={bg}>
        Joint
      </TableCell>
      <TableCell flex={COL.fm} header bg={bg} last>
        FM GROUP
      </TableCell>
    </View>
  );
}

function TableRow({ row, alt }: { row: IdCardQualRow; alt: boolean }) {
  const bg = alt ? COLORS.frost : COLORS.white;
  return (
    <View style={{ flexDirection: "row", ...border, borderTopWidth: 0, backgroundColor: bg }}>
      <TableCell flex={COL.process} bg={bg} bold>
        {row.process}
      </TableCell>
      <TableCell flex={COL.posBw} bg={bg}>
        {row.positionBw}
      </TableCell>
      <TableCell flex={COL.posFw} bg={bg}>
        {row.positionFw}
      </TableCell>
      <TableCell flex={COL.thkBw} bg={bg}>
        {row.thicknessBw}
      </TableCell>
      <TableCell flex={COL.thkFw} bg={bg}>
        {row.thicknessFw}
      </TableCell>
      <TableCell flex={COL.od} bg={bg}>
        {row.od}
      </TableCell>
      <TableCell flex={COL.joint} bg={bg}>
        {row.jointType}
      </TableCell>
      <TableCell flex={COL.fm} bg={bg} last>
        {row.fmGroup}
      </TableCell>
    </View>
  );
}

export function IdCardDocument({ data }: { data: IdCardData }) {
  const {
    org,
    welder,
    photoUrl,
    logoUrl,
    qrDataUrl,
    welderName,
    welderNo,
    rows,
    status,
    expiry,
    statusNotice = null,
    cardHeading = "WELDER ID CARD",
    plantIdLabel = "WELDER ID",
    documentTitle,
    standardLabel = "EN ISO 9606-1:2017",
  } = data;

  const badge = statusStyle(status);
  const site = welder.branch_location ?? org.location_code ?? "—";
  const title = documentTitle ?? `Welder ID ${welderNo}`;

  return (
    <Document title={title}>
      <Page size={CARD} style={{ padding: 4, fontFamily: "Helvetica", backgroundColor: COLORS.frost }}>
        <View
          style={{
            flex: 1,
            borderWidth: 1.2,
            borderColor: COLORS.charcoal,
            backgroundColor: COLORS.white,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          {/* Header — logo + company name (centered) */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: COLORS.emberSoft,
              paddingHorizontal: 10,
              paddingVertical: 8,
              minHeight: 32,
              gap: 8,
            }}
          >
            {logoUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image
                src={logoUrl}
                style={{ width: 70, height: 21, objectFit: "contain" }}
              />
            ) : null}
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: COLORS.onyx }}>
              {org.name}
            </Text>
          </View>

          {/* Body — photo left, personal info right */}
          <View
            style={{
              flexDirection: "row",
              borderBottomWidth: 0.75,
              borderBottomColor: COLORS.silver,
              backgroundColor: COLORS.white,
              paddingHorizontal: 10,
              paddingVertical: 8,
            }}
          >
            <View style={{ marginRight: 10 }}>
              {photoUrl ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image
                  src={photoUrl}
                  style={{
                    width: PHOTO[0],
                    height: PHOTO[1],
                    objectFit: "cover",
                    borderRadius: 2,
                    borderWidth: 1,
                    borderColor: COLORS.silver,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: PHOTO[0],
                    height: PHOTO[1],
                    backgroundColor: COLORS.frost,
                    borderRadius: 2,
                    borderWidth: 1,
                    borderColor: COLORS.silver,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 18, fontFamily: "Helvetica-Bold", color: COLORS.steel }}>
                    {welderName.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
              {qrDataUrl ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image
                  src={qrDataUrl}
                  style={{
                    width: 40,
                    height: 40,
                    marginTop: 4,
                    alignSelf: "center",
                  }}
                />
              ) : null}
            </View>

            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text
                style={{
                  fontSize: 5,
                  fontFamily: "Helvetica-Bold",
                  color: COLORS.steel,
                  letterSpacing: 0.8,
                  marginBottom: 4,
                }}
              >
                {cardHeading}
              </Text>
              <PersonalField label="NAME" value={welderName} bold />
              <View style={{ flexDirection: "row", gap: 14 }}>
                <View style={{ flex: 1 }}>
                  <PersonalField label={plantIdLabel} value={welderNo} bold />
                </View>
              </View>
              {(welder.employer || site !== "—") && (
                <View style={{ flexDirection: "row", gap: 14, marginTop: 1 }}>
                  {welder.employer ? (
                    <View style={{ flex: 1 }}>
                      <PersonalField label="EMPLOYER" value={welder.employer} />
                    </View>
                  ) : null}
                  {site !== "—" ? (
                    <View style={{ flex: 1 }}>
                      <PersonalField label="BRANCH" value={site} />
                    </View>
                  ) : null}
                </View>
              )}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 4,
                  gap: 6,
                }}
              >
                <View
                  style={{
                    backgroundColor: badge.bg,
                    paddingHorizontal: 5,
                    paddingVertical: 2,
                    borderRadius: 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 5,
                      fontFamily: "Helvetica-Bold",
                      color: badge.fg,
                      letterSpacing: 0.4,
                    }}
                  >
                    {badge.label}
                  </Text>
                </View>
                <Text style={{ fontSize: 5.5, color: COLORS.graphite }}>
                  {statusNotice ?? `Valid ${expiry ?? "—"}`}
                </Text>
              </View>
            </View>
          </View>

          {/* Footer — qualifications or registry notice */}
          <View style={{ backgroundColor: COLORS.frost }}>
            {statusNotice ? (
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 16,
                  alignItems: "center",
                  backgroundColor: "#fde8e4",
                }}
              >
                <Text
                  style={{
                    fontSize: 7,
                    fontFamily: "Helvetica-Bold",
                    color: COLORS.ember,
                    letterSpacing: 0.5,
                    marginBottom: 4,
                  }}
                >
                  {status === "Suspended" ? "SUSPENDED" : "INACTIVE"}
                </Text>
                <Text
                  style={{
                    fontSize: 6,
                    color: COLORS.charcoal,
                    textAlign: "center",
                    lineHeight: 1.35,
                  }}
                >
                  {statusNotice}
                </Text>
              </View>
            ) : (
              <>
            <View
              style={{
                backgroundColor: COLORS.charcoal,
                paddingVertical: 2,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 5,
                  fontFamily: "Helvetica-Bold",
                  color: COLORS.white,
                  letterSpacing: 0.5,
                }}
              >
                {standardLabel}
              </Text>
            </View>
            <TableHeader />
            {rows.map((row, i) => (
              <TableRow key={i} row={row} alt={i % 2 === 1} />
            ))}
              </>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}
