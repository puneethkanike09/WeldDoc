import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { COLORS } from "./styles";
import type { Organization, Welder } from "@/types/db";

export interface IdCardData {
  org: Organization;
  welder: Welder;
  qrDataUrl: string;
  photoUrl: string | null;
  processes: string[];
  status: string;
  expiry: string | null;
}

const CARD: [number, number] = [340, 214];

export function IdCardDocument({ data }: { data: IdCardData }) {
  const { org, welder, qrDataUrl, photoUrl, processes, status, expiry } = data;

  return (
    <Document title={`Welder ID ${welder.uid}`}>
      <Page size={CARD} style={{ padding: 0, fontFamily: "Helvetica" }}>
        {/* Header band */}
        <View
          style={{
            backgroundColor: COLORS.onyx,
            paddingHorizontal: 14,
            paddingVertical: 9,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: COLORS.white,
              fontFamily: "Helvetica-Bold",
              fontSize: 11,
            }}
          >
            {org.name}
          </Text>
          <Text
            style={{
              color: "#f48789",
              fontSize: 7,
              fontFamily: "Helvetica-Bold",
              letterSpacing: 1,
            }}
          >
            WELDER ID
          </Text>
        </View>

        {/* Body */}
        <View style={{ flexDirection: "row", padding: 14, flex: 1 }}>
          {photoUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image
              src={photoUrl}
              style={{
                width: 70,
                height: 88,
                borderRadius: 5,
                objectFit: "cover",
                marginRight: 12,
              }}
            />
          ) : (
            <View
              style={{
                width: 70,
                height: 88,
                borderRadius: 5,
                backgroundColor: COLORS.frost,
                marginRight: 12,
              }}
            />
          )}

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "Helvetica-Bold",
                fontSize: 13,
                color: COLORS.onyx,
              }}
            >
              {welder.full_name}
            </Text>
            <Text style={{ fontSize: 8, color: COLORS.graphite, marginTop: 2 }}>
              {welder.uid}
              {welder.welder_id ? ` · ${welder.welder_id}` : ""}
            </Text>
            <Text style={{ fontSize: 7, color: COLORS.steel, marginTop: 6 }}>
              PROCESSES
            </Text>
            <Text style={{ fontSize: 8.5, color: COLORS.onyx }}>
              {processes.length ? processes.join(", ") : "—"}
            </Text>
            <Text style={{ fontSize: 7, color: COLORS.steel, marginTop: 6 }}>
              STANDARD
            </Text>
            <Text style={{ fontSize: 8.5, color: COLORS.onyx }}>
              EN ISO 9606-1:2017
            </Text>
            <View style={{ flexDirection: "row", marginTop: 6 }}>
              <View style={{ marginRight: 14 }}>
                <Text style={{ fontSize: 7, color: COLORS.steel }}>STATUS</Text>
                <Text
                  style={{
                    fontSize: 9,
                    fontFamily: "Helvetica-Bold",
                    color: status === "Active" ? COLORS.active : COLORS.ember,
                  }}
                >
                  {status}
                </Text>
              </View>
              <View>
                <Text style={{ fontSize: 7, color: COLORS.steel }}>VALID</Text>
                <Text style={{ fontSize: 9, color: COLORS.onyx }}>
                  {expiry ?? "—"}
                </Text>
              </View>
            </View>
          </View>

          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image
            src={qrDataUrl}
            style={{ width: 64, height: 64, alignSelf: "flex-end" }}
          />
        </View>
      </Page>
    </Document>
  );
}
