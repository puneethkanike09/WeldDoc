import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { COLORS } from "./styles";
import type { Organization, Welder } from "@/types/db";

export interface IdCardData {
  org: Organization;
  welder: Welder;
  photoUrl: string | null;
  logoUrl: string | null;
  processes: string[];
  status: string;
  expiry: string | null;
}

/** ISO/IEC 7810 ID-1 — standard credit-card / badge size (85.6 × 54 mm). */
const CARD: [number, number] = [243, 153];

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
    default:
      return { bg: COLORS.frost, fg: COLORS.graphite, label: status.toUpperCase() };
  }
}

function Field({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View style={{ marginBottom: 3 }}>
      <Text
        style={{
          fontSize: 5,
          color: COLORS.steel,
          letterSpacing: 0.6,
          marginBottom: 0.5,
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

export function IdCardDocument({ data }: { data: IdCardData }) {
  const { org, welder, photoUrl, logoUrl, processes, status, expiry } = data;

  const badge = statusStyle(status);
  const welderNo = welder.welder_id ?? welder.uid;
  const site = welder.branch_location ?? org.location_code ?? "—";
  const processLine = processes.length ? processes.join(", ") : "—";

  return (
    <Document title={`Welder ID ${welder.uid}`}>
      <Page size={CARD} style={{ padding: 0, fontFamily: "Helvetica" }}>
        <View
          style={{
            flex: 1,
            borderWidth: 1.2,
            borderColor: COLORS.charcoal,
            backgroundColor: COLORS.white,
          }}
        >
          {/* Header */}
          <View
            style={{
              backgroundColor: COLORS.onyx,
              paddingHorizontal: 8,
              paddingTop: 6,
              paddingBottom: 5,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flex: 1,
                  paddingRight: 6,
                }}
              >
                {logoUrl ? (
                  // eslint-disable-next-line jsx-a11y/alt-text
                  <Image
                    src={logoUrl}
                    style={{
                      width: 36,
                      height: 14,
                      objectFit: "contain",
                      marginRight: 6,
                    }}
                  />
                ) : null}
                <Text
                  style={{
                    color: COLORS.white,
                    fontFamily: "Helvetica-Bold",
                    fontSize: 7.5,
                    flex: 1,
                  }}
                >
                  {org.name}
                </Text>
              </View>
              <Text
                style={{
                  color: COLORS.silver,
                  fontSize: 5.5,
                  fontFamily: "Helvetica-Bold",
                  letterSpacing: 0.8,
                }}
              >
                WELDER ID
              </Text>
            </View>
          </View>

          {/* Body */}
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              paddingHorizontal: 8,
              paddingTop: 6,
              paddingBottom: 4,
            }}
          >
            {/* Photo */}
            <View style={{ marginRight: 7 }}>
              {photoUrl ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image
                  src={photoUrl}
                  style={{
                    width: 46,
                    height: 58,
                    objectFit: "cover",
                    borderWidth: 0.75,
                    borderColor: COLORS.silver,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 46,
                    height: 58,
                    backgroundColor: COLORS.frost,
                    borderWidth: 0.75,
                    borderColor: COLORS.silver,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: COLORS.steel,
                      fontFamily: "Helvetica-Bold",
                    }}
                  >
                    {welder.full_name.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            {/* Details */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "Helvetica-Bold",
                  fontSize: 9.5,
                  color: COLORS.onyx,
                  marginBottom: 3,
                }}
              >
                {welder.full_name}
              </Text>

              <View style={{ flexDirection: "row", marginBottom: 3, gap: 10 }}>
                <Field label="WELDER NO." value={welderNo} bold />
                <Field label="UID" value={welder.uid} />
              </View>

              <Field label="PROCESSES" value={processLine} />
              <Field label="STANDARD" value="EN ISO 9606-1:2017" />

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 2,
                  gap: 6,
                }}
              >
                <View
                  style={{
                    backgroundColor: badge.bg,
                    paddingHorizontal: 5,
                    paddingVertical: 2,
                    borderRadius: 3,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 5.5,
                      fontFamily: "Helvetica-Bold",
                      color: badge.fg,
                      letterSpacing: 0.4,
                    }}
                  >
                    {badge.label}
                  </Text>
                </View>
                <Text style={{ fontSize: 6, color: COLORS.graphite }}>
                  Valid {expiry ?? "—"}
                </Text>
              </View>
            </View>
          </View>

          {/* Footer strip */}
          <View
            style={{
              borderTopWidth: 0.75,
              borderTopColor: COLORS.silver,
              backgroundColor: COLORS.frost,
              paddingHorizontal: 8,
              paddingVertical: 3,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 5, color: COLORS.graphite }}>
              {welder.employer ?? org.name}
            </Text>
            <Text style={{ fontSize: 5, color: COLORS.steel }}>
              {site} · WeldDoc
            </Text>
          </View>
        </View>
      </Page>

      {/* Back */}
      <Page size={CARD} style={{ padding: 0, fontFamily: "Helvetica" }}>
        <View
          style={{
            flex: 1,
            borderWidth: 1.2,
            borderColor: COLORS.charcoal,
            backgroundColor: COLORS.white,
          }}
        >
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 12,
            }}
          >
            <Text
              style={{
                fontFamily: "Helvetica-Bold",
                fontSize: 7,
                color: COLORS.onyx,
                letterSpacing: 0.5,
                marginBottom: 4,
              }}
            >
              WELDER QUALIFICATION
            </Text>
            <Text
              style={{
                fontSize: 5.5,
                color: COLORS.graphite,
                textAlign: "center",
                lineHeight: 1.4,
                marginBottom: 6,
              }}
            >
              This card certifies welder qualification per EN ISO 9606-1:2017.
            </Text>
            <Text
              style={{
                fontSize: 5.5,
                color: COLORS.graphite,
                textAlign: "center",
                lineHeight: 1.4,
              }}
            >
              Processes: {processLine}
              {"\n"}
              Valid until {expiry ?? "—"}
            </Text>
          </View>

          <View
            style={{
              borderTopWidth: 0.75,
              borderTopColor: COLORS.silver,
              backgroundColor: COLORS.onyx,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <Text
              style={{
                fontSize: 5,
                color: COLORS.steel,
                textAlign: "center",
              }}
            >
              Property of {org.name} · {site} · Not transferable
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
