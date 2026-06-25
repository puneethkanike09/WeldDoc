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
const BORDER = COLORS.border;

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
    <View
      style={{
        flexDirection: "row",
        borderTopWidth: HAIR,
        borderColor: COLORS.charcoal,
      }}
    >
      <View
        style={{
          width: 128,
          paddingVertical: 3,
          paddingHorizontal: 4,
          borderRightWidth: HAIR,
          borderColor: COLORS.charcoal,
        }}
      >
        <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 7.5 }}>
          {label}
        </Text>
      </View>
      <View style={{ flex: 1, paddingVertical: 3, paddingHorizontal: 4 }}>
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
          paddingVertical: 2.5,
          paddingHorizontal: 3,
          borderRightWidth: HAIR,
          borderColor: COLORS.charcoal,
        }}
      >
        <Text style={{ fontSize: 7.5, color: COLORS.charcoal }}>{row.label}</Text>
      </View>
      <View
        style={{
          flex: 1,
          paddingVertical: 2.5,
          paddingHorizontal: 3,
          borderRightWidth: HAIR,
          borderColor: COLORS.charcoal,
        }}
      >
        <Text style={{ fontSize: 7.5, color: COLORS.onyx }}>{row.test}</Text>
      </View>
      <View style={{ flex: 1.55, paddingVertical: 2.5, paddingHorizontal: 3 }}>
        <Text style={{ fontSize: 7.5, color: COLORS.onyx }}>{row.range}</Text>
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
    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontSize: 6.5,
          color: COLORS.charcoal,
          marginBottom: 2,
          lineHeight: 1.25,
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
                padding: 2,
                borderRightWidth: i < 2 ? HAIR : 0,
                borderColor: COLORS.charcoal,
              }}
            >
              <Text style={{ fontSize: 6.5, fontFamily: "Helvetica-Bold" }}>
                {h}
              </Text>
            </View>
          ))}
        </View>
        {padded.map((r, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              borderTopWidth: HAIR,
              borderColor: COLORS.charcoal,
              minHeight: 13,
            }}
          >
            <View
              style={{
                flex: 1,
                padding: 2,
                borderRightWidth: HAIR,
                borderColor: COLORS.charcoal,
              }}
            >
              <Text style={{ fontSize: 6.8 }}>{r.date}</Text>
            </View>
            <View
              style={{
                flex: 1,
                padding: 2,
                borderRightWidth: HAIR,
                borderColor: COLORS.charcoal,
              }}
            >
              <Text style={{ fontSize: 6.8 }}>{r.signature}</Text>
            </View>
            <View style={{ flex: 1.35, padding: 2 }}>
              <Text style={{ fontSize: 6.8 }}>{r.position}</Text>
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

  const designation = buildDesignation(wpq, range);
  const rows = buildCertRows(wpq, range);
  const continuity = continuityRows(validations);
  const examinerRows = examinerRevalidationRows(validations);
  const issueDate = fmt(wpq.certificate_issued_date ?? wpq.date_of_welding);
  const validUntil = initialValidUntil(wpq);
  const jobOk = wpq.job_knowledge === "Acceptable";
  const filletOk = wpq.supplementary_fillet;

  return (
    <Document title={`WPQ Certificate ${welder.uid}`} author={org.name}>
      <Page
        size="A4"
        style={{
          padding: 14,
          fontSize: 8,
          fontFamily: "Helvetica",
          color: COLORS.charcoal,
        }}
      >
        <View
          style={{
            flex: 1,
            borderWidth: 1.2,
            borderColor: BORDER,
            padding: 10,
          }}
        >
          <Text
            style={{
              fontSize: 6.5,
              textAlign: "center",
              color: COLORS.steel,
              marginBottom: 3,
            }}
          >
            EN ISO 9606-1:2017 — Annex A (informative) · Welder&apos;s
            qualification test certificate
          </Text>

          {logoUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image
              src={logoUrl}
              style={{
                height: 28,
                objectFit: "contain",
                alignSelf: "center",
                marginBottom: 4,
              }}
            />
          ) : null}

          <View style={{ alignItems: "center", marginBottom: 5 }}>
            <Text
              style={{
                fontFamily: "Helvetica-Bold",
                fontSize: 13,
                color: COLORS.onyx,
              }}
            >
              {org.name}
            </Text>
            <Text style={{ fontSize: 8, color: COLORS.graphite }}>
              {welder.branch_location || org.location_code || "Manufacturing Plant"}
            </Text>
            <Text
              style={{
                fontFamily: "Helvetica-Bold",
                fontSize: 10,
                color: COLORS.onyx,
                marginTop: 3,
                textDecoration: "underline",
              }}
            >
              Welder&apos;s Qualification Test Certificate
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

          <View
            style={{
              borderWidth: HAIR,
              borderColor: COLORS.charcoal,
              flexDirection: "row",
            }}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row" }}>
                <View
                  style={{
                    width: 128,
                    paddingVertical: 3,
                    paddingHorizontal: 4,
                    borderRightWidth: HAIR,
                    borderColor: COLORS.charcoal,
                  }}
                >
                  <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 7.5 }}>
                    Designation(s):
                  </Text>
                </View>
                <View style={{ flex: 1, paddingVertical: 3, paddingHorizontal: 4 }}>
                  <Text
                    style={{
                      fontFamily: "Helvetica-Bold",
                      fontSize: 9.5,
                      color: COLORS.onyx,
                    }}
                  >
                    {designation}
                  </Text>
                </View>
              </View>
              <InfoRow label="WPS Reference:" value={wpq.wps_reference ?? "—"} />
              <InfoRow label="Welder Name:" value={welder.full_name} bold />
              <InfoRow
                label="Identification:"
                value={welder.welder_id ?? welder.uid}
              />
              <InfoRow
                label="Method of Identification:"
                value={welder.id_method ?? "—"}
              />
              <InfoRow
                label="Date and Place of Birth:"
                value={`${fmt(welder.date_of_birth)}${welder.place_of_birth ? ` & ${welder.place_of_birth}` : ""}`}
              />
              <InfoRow label="Employer:" value={welder.employer ?? org.name} />
              <InfoRow
                label="Code/Testing Standard:"
                value={testingStandardLabel(wpq)}
              />
              <InfoRow label="Material 1:" value={materialOneText(wpq)} />
              <InfoRow label="Material 2:" value={materialTwoText(wpq)} />
            </View>
            <View
              style={{
                width: 94,
                borderLeftWidth: HAIR,
                borderColor: COLORS.charcoal,
                alignItems: "center",
                justifyContent: "center",
                padding: 4,
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

          <View style={{ flexDirection: "row", marginTop: 4, marginBottom: 3 }}>
            <Text style={{ fontSize: 7.5 }}>Job Knowledge: </Text>
            {jobOk ? (
              <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold" }}>
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
                  paddingVertical: 2.5,
                  paddingHorizontal: 3,
                  borderRightWidth: HAIR,
                  borderColor: COLORS.charcoal,
                }}
              />
              <View
                style={{
                  flex: 1,
                  paddingVertical: 2.5,
                  paddingHorizontal: 3,
                  borderRightWidth: HAIR,
                  borderColor: COLORS.charcoal,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Helvetica-Bold",
                    fontSize: 8,
                    textAlign: "center",
                  }}
                >
                  Test piece
                </Text>
              </View>
              <View style={{ flex: 1.55, paddingVertical: 2.5, paddingHorizontal: 3 }}>
                <Text
                  style={{
                    fontFamily: "Helvetica-Bold",
                    fontSize: 8,
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

          <View style={{ flexDirection: "row", marginTop: 3, marginBottom: 3 }}>
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
                    padding: 2.5,
                    borderRightWidth: HAIR,
                    borderColor: COLORS.charcoal,
                  }}
                >
                  <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 6.8 }}>
                    Type of test
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1.15,
                    padding: 2.5,
                    borderRightWidth: HAIR,
                    borderColor: COLORS.charcoal,
                  }}
                >
                  <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 6.8 }}>
                    Performed and accepted
                  </Text>
                </View>
                <View style={{ flex: 0.65, padding: 2.5 }}>
                  <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 6.8 }}>
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
                        padding: 2.5,
                        borderRightWidth: HAIR,
                        borderColor: COLORS.charcoal,
                      }}
                    >
                      <Text style={{ fontSize: 6.8 }}>{tt.label}</Text>
                    </View>
                    <View
                      style={{
                        flex: 1.15,
                        padding: 2.5,
                        borderRightWidth: HAIR,
                        borderColor: COLORS.charcoal,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 6.8,
                          color: res.notTested ? COLORS.steel : COLORS.active,
                        }}
                      >
                        {res.performed}
                      </Text>
                    </View>
                    <View style={{ flex: 0.65, padding: 2.5 }}>
                      <Text
                        style={{
                          fontSize: 6.8,
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
                  minHeight: 34,
                  justifyContent: "flex-end",
                }}
              >
                <Text style={{ fontSize: 7.5 }}>
                  {wpq.examiner_name ?? ""}
                </Text>
                <View
                  style={{
                    marginTop: 14,
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
                Location: {welder.branch_location || org.location_code || "—"}
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

          <View style={{ flexDirection: "row", gap: 6, marginTop: 5 }}>
            <AnnexTable
              title={revalidationTitle(wpq.revalidation_method)}
              rows={examinerRows}
              minRows={3}
            />
            <AnnexTable
              title="Prolongation for approval by the welding coordinator for the following 6 months (according to 9.2)"
              rows={continuity}
              minRows={6}
            />
          </View>
        </View>

        <Text
          style={{
            position: "absolute",
            bottom: 8,
            left: 14,
            right: 14,
            fontSize: 6,
            color: COLORS.steel,
            textAlign: "center",
          }}
          fixed
        >
          {org.name} · WeldDoc
        </Text>
      </Page>
    </Document>
  );
}
