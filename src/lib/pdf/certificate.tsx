import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { COLORS } from "./styles";
import {
  buildDesignation,
  buildCertRows,
  type CertRow,
} from "@/lib/iso9606/certificate-model";
import type {
  NdtDtRecord,
  Organization,
  QualificationRecord,
  RangeOfApproval,
  Signatory,
  Welder,
} from "@/types/db";

export interface SignatoryWithUrls extends Signatory {
  signaturePublicUrl: string | null;
  stampPublicUrl: string | null;
}

export interface CertificateData {
  org: Organization;
  welder: Welder;
  wpq: QualificationRecord;
  range: RangeOfApproval | null;
  ndt: NdtDtRecord[];
  signatories: SignatoryWithUrls[];
  qrDataUrl: string;
  photoUrl: string | null;
  certNo: string;
}

function fmt(d: string | null): string {
  if (!d) return "";
  const date = new Date(d);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

const HAIR = 0.6;
const bd = { borderColor: COLORS.charcoal, borderWidth: HAIR };

function InfoRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", borderTopWidth: HAIR, borderColor: COLORS.charcoal }}>
      <View style={{ width: 130, padding: 3, borderRightWidth: HAIR, borderColor: COLORS.charcoal }}>
        <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 7.5 }}>
          {label}
        </Text>
      </View>
      <View style={{ flex: 1, padding: 3 }}>
        <Text
          style={{
            fontSize: bold ? 9.5 : 8,
            fontFamily: bold ? "Helvetica-Bold" : "Helvetica",
            color: COLORS.onyx,
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function TripleRow({ row }: { row: CertRow }) {
  return (
    <View style={{ flexDirection: "row", borderTopWidth: HAIR, borderColor: COLORS.charcoal }}>
      <View style={{ flex: 1.5, padding: 2.5, borderRightWidth: HAIR, borderColor: COLORS.charcoal }}>
        <Text style={{ fontSize: 7.5, color: COLORS.charcoal }}>{row.label}</Text>
      </View>
      <View style={{ flex: 1, padding: 2.5, borderRightWidth: HAIR, borderColor: COLORS.charcoal }}>
        <Text style={{ fontSize: 7.5, color: COLORS.onyx }}>{row.test}</Text>
      </View>
      <View style={{ flex: 1.6, padding: 2.5 }}>
        <Text style={{ fontSize: 7.5, color: COLORS.onyx }}>{row.range}</Text>
      </View>
    </View>
  );
}

const TEST_TYPES: { label: string; match: (m: string) => boolean }[] = [
  { label: "Visual testing", match: (m) => m.startsWith("Visual") },
  { label: "Ultrasonic / RT testing", match: (m) => m === "RT/UT" },
  { label: "PT - After back grind", match: () => false },
  { label: "Fracture test", match: (m) => m === "Fracture Test" },
  { label: "Bend test", match: (m) => m === "Bend test" },
  { label: "Notch tensile test", match: (m) => m === "Notch tensile test" },
  { label: "Macroscopic examination", match: (m) => m === "Macroscopic examination" },
];

function EmptyTable({ title }: { title: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 6.8, color: COLORS.charcoal, marginBottom: 2 }}>
        {title}
      </Text>
      <View style={bd}>
        <View style={{ flexDirection: "row", backgroundColor: COLORS.frost }}>
          {["Date", "Signature", "Position or title"].map((h, i) => (
            <View
              key={h}
              style={{
                flex: i === 2 ? 1.3 : 1,
                padding: 2,
                borderRightWidth: i < 2 ? HAIR : 0,
                borderColor: COLORS.charcoal,
              }}
            >
              <Text style={{ fontSize: 6.5, fontFamily: "Helvetica-Bold" }}>{h}</Text>
            </View>
          ))}
        </View>
        {[0, 1, 2].map((r) => (
          <View
            key={r}
            style={{ flexDirection: "row", borderTopWidth: HAIR, borderColor: COLORS.charcoal, height: 14 }}
          >
            <View style={{ flex: 1, borderRightWidth: HAIR, borderColor: COLORS.charcoal }} />
            <View style={{ flex: 1, borderRightWidth: HAIR, borderColor: COLORS.charcoal }} />
            <View style={{ flex: 1.3 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

export function CertificateDocument({ data }: { data: CertificateData }) {
  const { org, welder, wpq, range, ndt, signatories, qrDataUrl, photoUrl, certNo } =
    data;

  const designation = buildDesignation(wpq, range);
  const rows = buildCertRows(wpq, range);
  const examiner =
    signatories.find((s) => s.role === "examining_body") ?? signatories[0] ?? null;

  return (
    <Document title={`WPQ Certificate ${welder.uid}`} author={org.name}>
      <Page size="A4" style={{ padding: 22, fontSize: 8, fontFamily: "Helvetica", color: COLORS.charcoal }}>
        {/* Brand */}
        <View style={{ alignItems: "center", marginBottom: 4 }}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 13, color: COLORS.onyx }}>
            {org.name}
          </Text>
          <Text style={{ fontSize: 8, color: COLORS.graphite }}>Manufacturing Plant</Text>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, color: COLORS.onyx }}>
            Welder&apos;s Qualification Test Certificate
          </Text>
        </View>
        <Text style={{ fontSize: 8, textAlign: "right", marginBottom: 2 }}>
          Certificate No.: {certNo}
        </Text>

        {/* Header info + photo */}
        <View style={[bd, { flexDirection: "row" }]}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row" }}>
              <View style={{ width: 130, padding: 3, borderRightWidth: HAIR, borderColor: COLORS.charcoal }}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 7.5 }}>
                  Designation(s):
                </Text>
              </View>
              <View style={{ flex: 1, padding: 3 }}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9.5, color: COLORS.onyx }}>
                  {designation}
                </Text>
              </View>
            </View>
            <InfoRow label="WPS Reference:" value={wpq.wps_reference ?? "—"} />
            <InfoRow label="Welder Name:" value={welder.full_name} />
            <InfoRow label="Identification:" value={welder.welder_id ?? welder.uid} />
            <InfoRow label="Method of Identification:" value={welder.id_method ?? "—"} />
            <InfoRow
              label="Date and Place of Birth:"
              value={`${fmt(welder.date_of_birth)}${welder.place_of_birth ? ` & ${welder.place_of_birth}` : ""}`}
            />
            <InfoRow label="Employer:" value={welder.employer ?? "—"} />
            <InfoRow label="Code/Testing Standard:" value="EN ISO 9606-1: 2017" />
          </View>
          <View style={{ width: 96, borderLeftWidth: HAIR, borderColor: COLORS.charcoal, alignItems: "center", justifyContent: "center", padding: 4 }}>
            {photoUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={photoUrl} style={{ width: 80, height: 92, objectFit: "cover" }} />
            ) : (
              <View style={{ width: 80, height: 92, backgroundColor: COLORS.frost }} />
            )}
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={qrDataUrl} style={{ width: 44, height: 44, marginTop: 4 }} />
          </View>
        </View>

        <Text style={{ fontSize: 7.5, marginTop: 4, marginBottom: 2 }}>
          Job Knowledge: {wpq.job_knowledge}
        </Text>

        {/* Two-column test piece / range */}
        <View style={bd}>
          <View style={{ flexDirection: "row", backgroundColor: COLORS.frost }}>
            <View style={{ flex: 1.5, padding: 2.5, borderRightWidth: HAIR, borderColor: COLORS.charcoal }} />
            <View style={{ flex: 1, padding: 2.5, borderRightWidth: HAIR, borderColor: COLORS.charcoal }}>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8, textAlign: "center" }}>
                Test Piece
              </Text>
            </View>
            <View style={{ flex: 1.6, padding: 2.5 }}>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8, textAlign: "center" }}>
                Range Qualification
              </Text>
            </View>
          </View>
          {rows.map((r) => (
            <TripleRow key={r.label} row={r} />
          ))}
        </View>

        <Text style={{ fontSize: 7, marginTop: 3, marginBottom: 3 }}>
          Supplementary fillet weld test (completed in conjunction with a butt
          weld qualification):{" "}
          {wpq.supplementary_fillet ? "acceptable" : "not acceptable / NA"}
        </Text>

        {/* Bottom: type of test + examiner block */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {/* Type of test table */}
          <View style={[bd, { width: "50%" }]}>
            <View style={{ flexDirection: "row", backgroundColor: COLORS.frost }}>
              <View style={{ flex: 1.4, padding: 2.5, borderRightWidth: HAIR, borderColor: COLORS.charcoal }}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 6.8 }}>Type of test</Text>
              </View>
              <View style={{ flex: 1.2, padding: 2.5, borderRightWidth: HAIR, borderColor: COLORS.charcoal }}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 6.8 }}>Performed and accepted</Text>
              </View>
              <View style={{ flex: 0.7, padding: 2.5 }}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 6.8 }}>Not tested</Text>
              </View>
            </View>
            {TEST_TYPES.map((tt) => {
              const rec = ndt.find((n) => tt.match(n.test_method));
              const done = rec && rec.result === "Pass";
              return (
                <View key={tt.label} style={{ flexDirection: "row", borderTopWidth: HAIR, borderColor: COLORS.charcoal }}>
                  <View style={{ flex: 1.4, padding: 2.5, borderRightWidth: HAIR, borderColor: COLORS.charcoal }}>
                    <Text style={{ fontSize: 6.8 }}>{tt.label}</Text>
                  </View>
                  <View style={{ flex: 1.2, padding: 2.5, borderRightWidth: HAIR, borderColor: COLORS.charcoal }}>
                    <Text style={{ fontSize: 6.8, color: COLORS.active }}>
                      {done ? rec?.conducted_by || "Accepted" : ""}
                    </Text>
                  </View>
                  <View style={{ flex: 0.7, padding: 2.5 }}>
                    <Text style={{ fontSize: 6.8, color: COLORS.steel }}>
                      {!rec ? "NA" : ""}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Examiner / validity block */}
          <View style={{ width: "50%" }}>
            <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", marginBottom: 2 }}>
              Name and Signature:
            </Text>
            <View style={{ flexDirection: "row", alignItems: "flex-end", height: 40, gap: 6 }}>
              <Text style={{ fontSize: 7.5 }}>{examiner?.name ?? ""}</Text>
              {examiner?.signaturePublicUrl ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image src={examiner.signaturePublicUrl} style={{ height: 30, width: 60, objectFit: "contain" }} />
              ) : null}
              {examiner?.stampPublicUrl ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image src={examiner.stampPublicUrl} style={{ height: 36, width: 36, objectFit: "contain" }} />
              ) : null}
            </View>
            <Text style={{ fontSize: 7.5, marginTop: 3 }}>
              Date of Welding: {fmt(wpq.date_of_welding)}
            </Text>
            <Text style={{ fontSize: 7.5 }}>
              Location: {welder.branch_location || org.location_code || "—"}
            </Text>
            <Text style={{ fontSize: 7.5 }}>
              Examining Body: {examiner?.organisation ?? "—"}
            </Text>
            <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: COLORS.ember }}>
              Validity of Approval until: {fmt(wpq.expiry_date)}
            </Text>
            <Text style={{ fontSize: 6.8, marginTop: 3, color: COLORS.graphite }}>
              Prolongation of approval by the welding coordinator for the
              following 6 months (according to 9.2)
            </Text>
          </View>
        </View>

        {/* Revalidation + prolongation tables */}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
          <EmptyTable title={`Revalidation by examiner / examining body for the following 2 years (refer to ${wpq.revalidation_method})`} />
          <EmptyTable title="Prolongation by welding coordinator every 6 months (9.2)" />
        </View>

        <Text
          style={{ position: "absolute", bottom: 14, left: 22, right: 22, fontSize: 6.5, color: COLORS.steel, textAlign: "center" }}
          fixed
        >
          Generated by WeldDoc · Scan the QR code to verify live status · Valid until {fmt(wpq.expiry_date)}
        </Text>
      </Page>
    </Document>
  );
}
