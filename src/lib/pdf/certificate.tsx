import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { COLORS } from "./styles";
import {
  buildDesignation,
  buildCertRows,
  type CertRow,
} from "@/lib/iso9606/certificate-model";
import { ANNEX_A_TEST_TYPES } from "@/lib/iso9606/constants";
import {
  annexTestResult,
  continuityRows,
  examinerRevalidationRows,
  initialValidUntil,
  materialOneText,
  materialTwoText,
  revalidationNote,
  revalidationTitle,
  testingStandardLabel,
  type CertTableRow,
} from "@/lib/iso9606/certificate-annex";
import { hasAnySupplementaryFillet } from "@/lib/iso9606/supplementary-fillet";
import { CertificateBrandingHeader } from "@/lib/pdf/certificate-branding-header";
import {
  CertificateHeaderFieldRow,
  CompoundCertificateFrame,
} from "@/lib/pdf/certificate-layout";
import type {
  NdtDtRecord,
  Organization,
  QualificationRecord,
  RangeOfApproval,
  ValidationRecord,
  Welder,
} from "@/types/db";

export interface CertificateData {
  org: Organization;
  welder: Welder;
  wpq: QualificationRecord;
  range: RangeOfApproval | null;
  ndt: NdtDtRecord[];
  validations: ValidationRecord[];
  photoUrl: string | null;
  logoUrl: string | null;
  certNo: string;
}

function fmt(d: string | null): string {
  if (!d) return "";
  const date = new Date(d.includes("T") ? d : `${d}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

const HAIR = 0.75;
/** Keep annex prolongation rows compact so the full certificate fits one A4 page. */
const ANNEX_ROW_MIN_HEIGHT = 10;
const TABLE_CELL_PAD_V = 1.75;
const TABLE_CELL_PAD_H = 2.5;

function TripleRow({ row }: { row: CertRow }) {
  return (
    <View
      style={{
        flexDirection: "row",
        borderTopWidth: HAIR,
        borderColor: COLORS.charcoal,
      }}
    >
      <View
        style={{
          flex: 1.55,
          paddingVertical: TABLE_CELL_PAD_V,
          paddingHorizontal: TABLE_CELL_PAD_H,
          borderRightWidth: HAIR,
          borderColor: COLORS.charcoal,
        }}
      >
        <Text style={{ fontSize: 7.25, color: COLORS.charcoal }}>{row.label}</Text>
      </View>
      <View
        style={{
          flex: 1,
          paddingVertical: TABLE_CELL_PAD_V,
          paddingHorizontal: TABLE_CELL_PAD_H,
          borderRightWidth: HAIR,
          borderColor: COLORS.charcoal,
        }}
      >
        <Text style={{ fontSize: 7.25, color: COLORS.onyx }}>{row.test}</Text>
      </View>
      <View style={{ flex: 1.55, paddingVertical: TABLE_CELL_PAD_V, paddingHorizontal: TABLE_CELL_PAD_H }}>
        <Text style={{ fontSize: 7.25, color: COLORS.onyx }}>{row.range}</Text>
      </View>
    </View>
  );
}

function AnnexTable({
  title,
  rows,
  minRows = 3,
}: {
  title: string;
  rows: CertTableRow[];
  minRows?: number;
}) {
  const padded = [...rows];
  while (padded.length < minRows) {
    padded.push({ date: "", signature: "", position: "" });
  }

  return (
    <View style={{ flex: 1 }} wrap={false}>
      <Text
        style={{
          fontSize: 6.25,
          color: COLORS.charcoal,
          marginBottom: 1,
          lineHeight: 1.15,
        }}
      >
        {title}
      </Text>
      <View style={{ borderWidth: HAIR, borderColor: COLORS.charcoal }}>
        <View style={{ flexDirection: "row", backgroundColor: COLORS.frost }}>
          {["Date", "Signature", "Position or title"].map((h, i) => (
            <View
              key={h}
              style={{
                flex: i === 2 ? 1.35 : 1,
                paddingVertical: 1.5,
                paddingHorizontal: 2,
                borderRightWidth: i < 2 ? HAIR : 0,
                borderColor: COLORS.charcoal,
              }}
            >
              <Text style={{ fontSize: 6.25, fontFamily: "Helvetica-Bold" }}>
                {h}
              </Text>
            </View>
          ))}
        </View>
        {padded.map((r, i) => (
          <View
            key={i}
            wrap={false}
            style={{
              flexDirection: "row",
              borderTopWidth: HAIR,
              borderColor: COLORS.charcoal,
              minHeight: ANNEX_ROW_MIN_HEIGHT,
            }}
          >
            <View
              style={{
                flex: 1,
                paddingVertical: 1.5,
                paddingHorizontal: 2,
                borderRightWidth: HAIR,
                borderColor: COLORS.charcoal,
              }}
            >
              <Text style={{ fontSize: 6.5 }}>{r.date}</Text>
            </View>
            <View
              style={{
                flex: 1,
                paddingVertical: 1.5,
                paddingHorizontal: 2,
                borderRightWidth: HAIR,
                borderColor: COLORS.charcoal,
              }}
            >
              <Text style={{ fontSize: 6.5 }}>{r.signature}</Text>
            </View>
            <View style={{ flex: 1.35, paddingVertical: 1.5, paddingHorizontal: 2 }}>
              <Text style={{ fontSize: 6.5 }}>{r.position}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function CertificateDocument({ data }: { data: CertificateData }) {
  const {
    org,
    welder,
    wpq,
    range,
    ndt,
    validations,
    photoUrl,
    logoUrl,
    certNo,
  } = data;

  const designations = buildDesignation(wpq, range);
  const rows = buildCertRows(wpq, range);
  const continuity = continuityRows(validations);
  const examinerRows = examinerRevalidationRows(validations);
  const issueDate = fmt(wpq.certificate_issued_date ?? wpq.date_of_welding);
  const validUntil = initialValidUntil(wpq);
  const jobOk = wpq.job_knowledge === "Acceptable";
  const filletOk = hasAnySupplementaryFillet(wpq);

  return (
    <Document title={`WPQ Certificate ${welder.welder_id ?? welder.full_name}`} author={org.name}>
      <Page
        size="A4"
        style={{
          paddingTop: 11,
          paddingBottom: 10,
          paddingHorizontal: 11,
          fontSize: 8,
          fontFamily: "Helvetica",
          color: COLORS.charcoal,
        }}
      >
        <CompoundCertificateFrame>
          <CertificateBrandingHeader
            branding={org.certificate_branding}
            orgName={org.name}
            logoUrl={logoUrl}
          />

          <View style={{ alignItems: "center", marginBottom: 4 }}>
            <Text
              style={{
                fontFamily: "Helvetica-Bold",
                fontSize: 10,
                color: COLORS.onyx,
                textDecoration: "underline",
              }}
            >
              Welder&apos;s Certificate
            </Text>
          </View>

          <Text
            style={{
              fontSize: 8,
              textAlign: "right",
              marginBottom: 3,
              fontFamily: "Helvetica-Bold",
            }}
          >
            Certificate No.: {certNo}
          </Text>

          <View style={{ flexDirection: "row", marginBottom: 3 }}>
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  paddingVertical: 2,
                  paddingHorizontal: 2,
                }}
              >
                <View style={{ width: 128 }}>
                  <Text
                    style={{
                      fontFamily: "Helvetica-Bold",
                      fontSize: 7.5,
                    }}
                  >
                    Designation(s):
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  {designations.map((line, i) => (
                    <Text
                      key={i}
                      style={{
                        fontFamily: "Helvetica-Bold",
                        fontSize: 9.5,
                        color: COLORS.onyx,
                        marginBottom: i < designations.length - 1 ? 1 : 0,
                      }}
                    >
                      {line}
                    </Text>
                  ))}
                </View>
              </View>
              <CertificateHeaderFieldRow
                label="WPS Reference:"
                value={wpq.wps_reference ?? "—"}
              />
              <CertificateHeaderFieldRow
                label="Welder Name:"
                value={welder.full_name}
                bold
              />
              <CertificateHeaderFieldRow
                label="Identification:"
                value={welder.welder_id ?? "—"}
              />
              <CertificateHeaderFieldRow
                label="Method of Identification:"
                value={welder.id_method ?? "—"}
              />
              <CertificateHeaderFieldRow
                label="Date and Place of Birth:"
                value={`${fmt(welder.date_of_birth)}${welder.place_of_birth ? ` & ${welder.place_of_birth}` : ""}`}
              />
              <CertificateHeaderFieldRow
                label="Employer:"
                value={welder.employer ?? org.name}
              />
              <CertificateHeaderFieldRow
                label="Code/Testing Standard:"
                value={testingStandardLabel(wpq)}
              />
              <CertificateHeaderFieldRow
                label="Material 1:"
                value={materialOneText(wpq)}
              />
              <CertificateHeaderFieldRow
                label="Material 2:"
                value={materialTwoText(wpq)}
              />
            </View>
            <View
              style={{
                width: 94,
                alignItems: "center",
                justifyContent: "flex-start",
                padding: 4,
                paddingTop: 2,
              }}
            >
              {/* Photo only — QR verification is on the welder ID card */}
              {photoUrl ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image
                  src={photoUrl}
                  style={{ width: 78, height: 90, objectFit: "cover" }}
                />
              ) : (
                <View
                  style={{
                    width: 78,
                    height: 90,
                    backgroundColor: COLORS.frost,
                  }}
                />
              )}
            </View>
          </View>

          <View style={{ flexDirection: "row", marginTop: 3, marginBottom: 2 }}>
            <Text style={{ fontSize: 7.5 }}>Job Knowledge: </Text>
            {jobOk ? (
              <Text
                style={{
                  fontSize: 7.5,
                  fontFamily: "Helvetica-Bold",
                }}
              >
                Acceptable
              </Text>
            ) : null}
            <Text style={{ fontSize: 7.5 }}> / </Text>
            <Text
              style={{
                fontSize: 7.5,
                textDecoration: jobOk ? "line-through" : "none",
                color: jobOk ? COLORS.steel : COLORS.onyx,
              }}
            >
              Not tested
            </Text>
          </View>

          <View style={{ borderWidth: HAIR, borderColor: COLORS.charcoal }}>
            <View
              style={{ flexDirection: "row", backgroundColor: COLORS.frost }}
            >
              <View
                style={{
                  flex: 1.55,
                  paddingVertical: TABLE_CELL_PAD_V,
                  paddingHorizontal: TABLE_CELL_PAD_H,
                  borderRightWidth: HAIR,
                  borderColor: COLORS.charcoal,
                }}
              />
              <View
                style={{
                  flex: 1,
                  paddingVertical: TABLE_CELL_PAD_V,
                  paddingHorizontal: TABLE_CELL_PAD_H,
                  borderRightWidth: HAIR,
                  borderColor: COLORS.charcoal,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Helvetica-Bold",
                    fontSize: 7.5,
                    textAlign: "center",
                  }}
                >
                  Test piece
                </Text>
              </View>
              <View style={{ flex: 1.55, paddingVertical: TABLE_CELL_PAD_V, paddingHorizontal: TABLE_CELL_PAD_H }}>
                <Text
                  style={{
                    fontFamily: "Helvetica-Bold",
                    fontSize: 7.5,
                    textAlign: "center",
                  }}
                >
                  Range of qualification
                </Text>
              </View>
            </View>
            {rows.map((r) => (
              <TripleRow key={r.label} row={r} />
            ))}
          </View>

          <View style={{ flexDirection: "row", marginTop: 2, marginBottom: 2 }}>
            <Text style={{ fontSize: 7 }}>
              Supplementary fillet weld test (completed in conjunction with a
              butt weld qualification):{" "}
            </Text>
            {filletOk ? (
              <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold" }}>
                acceptable
              </Text>
            ) : null}
            <Text style={{ fontSize: 7 }}> / </Text>
            <Text
              style={{
                fontSize: 7,
                textDecoration: filletOk ? "line-through" : "none",
                color: filletOk ? COLORS.steel : COLORS.onyx,
              }}
            >
              not acceptable
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 6 }}>
            <View
              style={{
                borderWidth: HAIR,
                borderColor: COLORS.charcoal,
                width: "50%",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: COLORS.frost,
                }}
              >
                <View
                  style={{
                    flex: 1.45,
                    paddingVertical: 2,
                    paddingHorizontal: 2,
                    borderRightWidth: HAIR,
                    borderColor: COLORS.charcoal,
                  }}
                >
                  <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 6.5 }}>
                    Type of test
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1.15,
                    paddingVertical: 2,
                    paddingHorizontal: 2,
                    borderRightWidth: HAIR,
                    borderColor: COLORS.charcoal,
                  }}
                >
                  <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 6.5 }}>
                    Performed and accepted
                  </Text>
                </View>
                <View style={{ flex: 0.65, paddingVertical: 2, paddingHorizontal: 2 }}>
                  <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 6.5 }}>
                    Not tested
                  </Text>
                </View>
              </View>
              {ANNEX_A_TEST_TYPES.map((tt) => {
                const res = annexTestResult(ndt, tt.methods);
                return (
                  <View
                    key={tt.label}
                    style={{
                      flexDirection: "row",
                      borderTopWidth: HAIR,
                      borderColor: COLORS.charcoal,
                    }}
                  >
                    <View
                      style={{
                        flex: 1.45,
                        paddingVertical: 2,
                        paddingHorizontal: 2,
                        borderRightWidth: HAIR,
                        borderColor: COLORS.charcoal,
                      }}
                    >
                      <Text style={{ fontSize: 6.5 }}>{tt.label}</Text>
                    </View>
                    <View
                      style={{
                        flex: 1.15,
                        paddingVertical: 2,
                        paddingHorizontal: 2,
                        borderRightWidth: HAIR,
                        borderColor: COLORS.charcoal,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 6.5,
                          color: res.notTested ? COLORS.steel : COLORS.active,
                        }}
                      >
                        {res.performed}
                      </Text>
                    </View>
                    <View style={{ flex: 0.65, paddingVertical: 2, paddingHorizontal: 2 }}>
                      <Text
                        style={{
                          fontSize: 6.5,
                          color: COLORS.steel,
                          textDecoration: res.notTested ? "none" : "line-through",
                        }}
                      >
                        {res.notTested ? "NA" : "NA"}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={{ width: "50%" }}>
              <Text
                style={{
                  fontSize: 7,
                  fontFamily: "Helvetica-Bold",
                  marginBottom: 2,
                }}
              >
                Examining body — name and signature
              </Text>
              <View
                style={{
                  minHeight: 24,
                  justifyContent: "flex-end",
                }}
              >
                <Text style={{ fontSize: 7.5 }}>
                  {wpq.examiner_name ?? ""}
                </Text>
                <View
                  style={{
                    marginTop: 10,
                    borderTopWidth: HAIR,
                    borderColor: COLORS.charcoal,
                    paddingTop: 2,
                  }}
                >
                  <Text style={{ fontSize: 6, color: COLORS.steel }}>
                    Signature &amp; stamp
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 7.5, marginTop: 2 }}>
                Date of issue: {issueDate}
              </Text>
              <Text style={{ fontSize: 7.5 }}>
                Date of welding: {fmt(wpq.date_of_welding)}
              </Text>
              <Text style={{ fontSize: 7.5 }}>
                Examining Body: {wpq.examiner_ref ?? "—"}
              </Text>
              <Text
                style={{
                  fontSize: 7.5,
                  fontFamily: "Helvetica-Bold",
                  color: COLORS.ember,
                  marginTop: 2,
                }}
              >
                Validity of approval until: {validUntil || "—"}
              </Text>
              <Text
                style={{ fontSize: 6.5, marginTop: 2, color: COLORS.graphite }}
              >
                {revalidationTitle(wpq.revalidation_method)} ·{" "}
                {revalidationNote(wpq.revalidation_method)}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 5, marginTop: 3 }} wrap={false}>
            {/* Examiner revalidation box is only required for 9.3b — for 9.3a
                and 9.3c revalidation is via the 6-month coordinator prolongation. */}
            {wpq.revalidation_method === "9.3b" ? (
              <AnnexTable
                title={revalidationTitle(wpq.revalidation_method)}
                rows={examinerRows}
                minRows={1}
              />
            ) : null}
            <AnnexTable
              title="Prolongation for approval by the welding coordinator for the following 6 months (according to 9.2)"
              rows={continuity}
              minRows={6}
            />
          </View>
        </CompoundCertificateFrame>

        <Text
          style={{
            position: "absolute",
            bottom: 6,
            left: 11,
            right: 11,
            fontSize: 6,
            color: COLORS.steel,
            textAlign: "center",
          }}
          fixed
        >
          {org.name} · Weld.Doc
        </Text>
      </Page>
    </Document>
  );
}
