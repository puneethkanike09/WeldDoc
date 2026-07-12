import { Document, Page, View, Text, Image, Svg, Path } from "@react-pdf/renderer";
import { COLORS } from "./styles";
import {
  buildAnnexCVariableRows,
  type OperatorCertificateData,
} from "@/lib/iso14732/certificate-model";
import {
  clause4MethodChecks,
  emptySignatureRows,
  revalidationCellValue,
  technologyKnowledgeLabel,
  testingStandardLabel,
  validityLabel,
  type AnnexCVariableRow,
  type CertTableRow,
} from "@/lib/iso14732/certificate-annex";
import { CertificateBrandingHeader } from "@/lib/pdf/certificate-branding-header";
import { CompoundCertificateFrame, CertificateHeaderFieldRow } from "@/lib/pdf/certificate-layout";

const HAIR = 0.75;
const BORDER = COLORS.charcoal;

function fmt(d: string | null | undefined): string {
  if (!d) return "";
  const date = new Date(d.includes("T") ? d : `${d}T00:00:00`);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function PdfTickBox({
  checked,
  boxSize = 9,
  marginLeft,
  marginRight,
}: {
  checked: boolean;
  boxSize?: number;
  marginLeft?: number;
  marginRight?: number;
}) {
  const markSize = Math.max(6, boxSize - 2);
  return (
    <View
      style={{
        width: boxSize,
        height: boxSize,
        borderWidth: HAIR,
        borderColor: BORDER,
        marginLeft,
        marginRight,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {checked ? (
        <Svg width={markSize} height={markSize} viewBox="0 0 10 10">
          <Path
            d="M1.8 5.2 L4.2 7.6 L8.2 2.4"
            stroke={COLORS.charcoal}
            strokeWidth={1.3}
            fill="none"
          />
        </Svg>
      ) : null}
    </View>
  );
}

function RoleTickBox({ checked }: { checked: boolean }) {
  return (
    <PdfTickBox checked={checked} marginLeft={3} marginRight={5} />
  );
}

function RoleRow() {
  return (
    <View
      style={{
        flexDirection: "row",
        paddingVertical: 2,
        paddingHorizontal: 2,
      }}
    >
      <View style={{ width: 132 }}>
        <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 7.5 }}>
          Role:
        </Text>
      </View>
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 7.5 }}>welding operator</Text>
        <RoleTickBox checked />
        <Text style={{ fontSize: 7.5 }}>and/or weld setter</Text>
        <RoleTickBox checked={false} />
      </View>
    </View>
  );
}

function Checkbox({ checked, label }: { checked: boolean; label: string }) {
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}
    >
      <PdfTickBox checked={checked} boxSize={8} marginRight={4} />
      <Text style={{ fontSize: 7.5 }}>{label}</Text>
    </View>
  );
}

function ValidityFieldRow({
  label,
  value,
  isFirst,
}: {
  label: string;
  value: string;
  isFirst?: boolean;
}) {
  return (
    <View
      style={{
        borderTopWidth: isFirst ? 0 : HAIR,
        borderColor: BORDER,
        paddingVertical: 3,
        paddingHorizontal: 4,
      }}
    >
      <Text style={{ fontSize: 7.5 }}>{label}</Text>
      <Text
        style={{
          fontSize: 7.5,
          color: COLORS.onyx,
          marginTop: 1,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function VariableRow({ row }: { row: AnnexCVariableRow }) {
  if (row.sectionHeader) {
    return (
      <View
        style={{
          borderTopWidth: HAIR,
          borderColor: BORDER,
          backgroundColor: COLORS.frost,
          paddingVertical: 3,
          paddingHorizontal: 4,
        }}
      >
        <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 7.5 }}>
          {row.sectionHeader}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: "row",
        borderTopWidth: HAIR,
        borderColor: BORDER,
      }}
    >
      <View
        style={{
          flex: 1.55,
          paddingVertical: 2.5,
          paddingHorizontal: 3,
          borderRightWidth: HAIR,
          borderColor: BORDER,
        }}
      >
        <Text style={{ fontSize: 7.5, color: COLORS.charcoal }}>
          {row.label}
        </Text>
      </View>
      <View
        style={{
          flex: 1,
          paddingVertical: 2.5,
          paddingHorizontal: 3,
          borderRightWidth: HAIR,
          borderColor: BORDER,
        }}
      >
        <Text style={{ fontSize: 7.5, color: COLORS.onyx }}>{row.test}</Text>
      </View>
      <View
        style={{ flex: 1.55, paddingVertical: 2.5, paddingHorizontal: 3 }}
      >
        <Text style={{ fontSize: 7.5, color: COLORS.onyx }}>{row.range}</Text>
      </View>
    </View>
  );
}

function SignatureTable({
  title,
  rows,
}: {
  title: string;
  rows: CertTableRow[];
}) {
  return (
    <View>
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
      <View style={{ borderWidth: HAIR, borderColor: BORDER }}>
        <View style={{ flexDirection: "row", backgroundColor: COLORS.frost }}>
          {["Date", "Signature", "Position or title"].map((h, i) => (
            <View
              key={h}
              style={{
                flex: i === 2 ? 1.35 : 1,
                padding: 2,
                borderRightWidth: i < 2 ? HAIR : 0,
                borderColor: BORDER,
              }}
            >
              <Text style={{ fontSize: 6.5, fontFamily: "Helvetica-Bold" }}>
                {h}
              </Text>
            </View>
          ))}
        </View>
        {rows.map((r, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              borderTopWidth: HAIR,
              borderColor: BORDER,
              minHeight: 13,
            }}
          >
            <View
              style={{
                flex: 1,
                padding: 2,
                borderRightWidth: HAIR,
                borderColor: BORDER,
              }}
            >
              <Text style={{ fontSize: 6.8 }}>{r.date}</Text>
            </View>
            <View
              style={{
                flex: 1,
                padding: 2,
                borderRightWidth: HAIR,
                borderColor: BORDER,
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

export function OperatorCertificateDocument({
  data,
}: {
  data: OperatorCertificateData;
}) {
  const { org, operator, oq, photoUrl, logoUrl } = data;
  const variableRows = buildAnnexCVariableRows(oq);
  const checks = clause4MethodChecks(oq);
  const techOk = oq.welding_technology_knowledge === "Acceptable";
  const issueDate = fmt(oq.certificate_issued_date ?? oq.date_of_welding);

  return (
    <Document
      title={`Operator Certificate ${operator.operator_id ?? operator.full_name}`}
      author={org.name}
    >
      <Page
        size="A4"
        style={{
          padding: 14,
          fontSize: 8,
          fontFamily: "Helvetica",
          color: COLORS.charcoal,
        }}
      >
        <CompoundCertificateFrame>
          <CertificateBrandingHeader
            branding={org.certificate_branding}
            orgName={org.name}
            logoUrl={logoUrl ?? null}
          />

          <View style={{ alignItems: "center", marginBottom: 5 }}>
            <Text
              style={{
                fontFamily: "Helvetica-Bold",
                fontSize: 10,
                color: COLORS.onyx,
                textDecoration: "underline",
              }}
            >
              Operator&apos;s Certificate
            </Text>
          </View>

          <View style={{ flexDirection: "row", marginBottom: 4 }}>
            <View style={{ flex: 1 }}>
              <CertificateHeaderFieldRow
                label="Manufacturer's pWPS or WPS reference No.:"
                value={oq.wps_reference ?? "—"}
                labelWidth={132}
              />
              <CertificateHeaderFieldRow
                label="Name:"
                value={operator.full_name}
                bold
                labelWidth={132}
              />
              <RoleRow />
              <CertificateHeaderFieldRow
                label="Identification:"
                value={operator.operator_id ?? "—"}
                labelWidth={132}
              />
              <CertificateHeaderFieldRow
                label="Method of identification:"
                value={operator.id_method ?? "—"}
                labelWidth={132}
              />
              <CertificateHeaderFieldRow
                label="Employer:"
                value={operator.employer ?? org.name}
                labelWidth={132}
              />
              <CertificateHeaderFieldRow
                label="Code/testing standard:"
                value={testingStandardLabel()}
                labelWidth={132}
              />
              <CertificateHeaderFieldRow
                label="Functional knowledge test reference:"
                value={oq.functional_knowledge_ref ?? "—"}
                labelWidth={132}
              />
              <CertificateHeaderFieldRow
                label="Welding technology knowledge:"
                value={`${techOk ? "acceptable" : technologyKnowledgeLabel(oq.welding_technology_knowledge)}${!techOk ? " / not tested" : ""} (delete as necessary)`}
                labelWidth={132}
              />
            </View>

            <View
              style={{
                width: 130,
                paddingLeft: 4,
              }}
            >
              <View style={{ paddingVertical: 2, paddingHorizontal: 2, marginBottom: 4 }}>
                <Text
                  style={{
                    fontFamily: "Helvetica-Bold",
                    fontSize: 7.5,
                    marginBottom: 2,
                  }}
                >
                  Examiner or examining body:
                </Text>
                <Text style={{ fontSize: 7.5, color: COLORS.onyx }}>
                  {oq.examiner_name ?? "—"}
                </Text>
              </View>
              <View style={{ paddingVertical: 2, paddingHorizontal: 2, marginBottom: 4 }}>
                <Text
                  style={{
                    fontFamily: "Helvetica-Bold",
                    fontSize: 7.5,
                    marginBottom: 2,
                  }}
                >
                  Reference No.:
                </Text>
                <Text style={{ fontSize: 7.5, color: COLORS.onyx }}>
                  {oq.examiner_ref ?? "—"}
                </Text>
              </View>
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "flex-start",
                  padding: 4,
                  paddingTop: 2,
                }}
              >
                {photoUrl ? (
                  // eslint-disable-next-line jsx-a11y/alt-text
                  <Image
                    src={photoUrl}
                    style={{ width: 92, height: 108, objectFit: "cover" }}
                  />
                ) : (
                  <View
                    style={{
                      width: 92,
                      height: 108,
                      borderWidth: HAIR,
                      borderColor: BORDER,
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 4,
                    }}
                  >
                    <Text style={{ fontSize: 6.5, textAlign: "center" }}>
                      Photograph{"\n"}(if required)
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View
            style={{ borderWidth: HAIR, borderColor: BORDER, marginTop: 5 }}
          >
            <View
              style={{ flexDirection: "row", backgroundColor: COLORS.frost }}
            >
              <View
                style={{
                  flex: 1.55,
                  paddingVertical: 2.5,
                  paddingHorizontal: 3,
                  borderRightWidth: HAIR,
                  borderColor: BORDER,
                }}
              >
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8 }}>
                  Variables
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  paddingVertical: 2.5,
                  paddingHorizontal: 3,
                  borderRightWidth: HAIR,
                  borderColor: BORDER,
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
              <View
                style={{
                  flex: 1.55,
                  paddingVertical: 2.5,
                  paddingHorizontal: 3,
                }}
              >
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
            {variableRows.map((row, i) => (
              <VariableRow
                key={`${row.label ?? row.sectionHeader}-${i}`}
                row={row}
              />
            ))}
          </View>

          <View
            style={{
              flexDirection: "row",
              borderWidth: HAIR,
              borderColor: BORDER,
              marginTop: 5,
            }}
          >
            <View
              style={{
                flex: 1,
                padding: 5,
                borderRightWidth: HAIR,
                borderColor: BORDER,
              }}
            >
              <Text style={{ fontSize: 7.5, marginBottom: 3 }}>
                The qualification is based on{" "}
                <Text style={{ fontFamily: "Helvetica-Bold" }}>Clause 4</Text>:
              </Text>
              <Text
                style={{
                  fontSize: 7.5,
                  fontFamily: "Helvetica-Bold",
                  marginBottom: 2,
                }}
              >
                — 4.2 Fusion welding
              </Text>
              <Checkbox checked={checks.fusion1} label="— Method 1" />
              <Checkbox checked={checks.fusion2} label="— Method 2" />
              <Checkbox checked={checks.fusion3} label="— Method 3" />
              <Checkbox checked={checks.fusion4} label="— Method 4" />
              <Checkbox
                checked={checks.resistance}
                label="— 4.3 Resistance welding"
              />
              <Checkbox
                checked={checks.arcStud}
                label="— 4.4 Arc stud welding"
              />
              <Text style={{ fontSize: 7, marginTop: 5, lineHeight: 1.3 }}>
                Results of the qualification test see document No.{" "}
                {oq.examiner_ref ?? "........"} (Welding procedure
                qualification record or other documents of testing)
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              {(
                [
                  ["Name, date and signature", operator.full_name],
                  ["Examiner or examining body", oq.examiner_name ?? ""],
                  [
                    "Date of welding of test piece",
                    fmt(oq.date_of_welding),
                  ],
                  ["Validity of qualification until", validityLabel(oq)],
                ] as const
              ).map(([label, value], i) => (
                <ValidityFieldRow
                  key={label}
                  label={label}
                  value={value}
                  isFirst={i === 0}
                />
              ))}
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              borderWidth: HAIR,
              borderColor: BORDER,
              marginTop: 5,
            }}
          >
            {(
              [
                ["Requalification 6.3 a)", "6.3a"],
                ["Revalidation 6.3 b)", "6.3b"],
                ["Revalidation 6.3 c)", "6.3c"],
              ] as const
            ).map(([title, method], i) => (
              <View
                key={method}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  borderRightWidth: i < 2 ? HAIR : 0,
                  borderColor: BORDER,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    padding: 3,
                    borderRightWidth: HAIR,
                    borderColor: BORDER,
                  }}
                >
                  <Text
                    style={{ fontSize: 6.5, fontFamily: "Helvetica-Bold" }}
                  >
                    {title}
                  </Text>
                  <Text style={{ fontSize: 7, marginTop: 3 }}>
                    {revalidationCellValue(method, oq)}
                  </Text>
                </View>
                <View style={{ flex: 1, padding: 3 }}>
                  <Text
                    style={{ fontSize: 6.5, fontFamily: "Helvetica-Bold" }}
                  >
                    Valid until
                  </Text>
                  <Text style={{ fontSize: 7, marginTop: 3 }}>
                    {oq.revalidation_method === method
                      ? validityLabel(oq)
                      : ""}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={{ marginTop: 6, gap: 6 }}>
            {/* Examiner revalidation box is only required for 6.3b — for 6.3a
                and 6.3c revalidation is via the 6-month confirmation below. */}
            {oq.revalidation_method === "6.3b" ? (
              <SignatureTable
                title="Revalidation by examiner or examining body for the following 3 years (See 6.3 b)"
                rows={emptySignatureRows(1)}
              />
            ) : null}
            <SignatureTable
              title="Confirmation of the validity by the employer/welding coordinator/examiner or examining body for the following 6 months (See 6.2)"
              rows={emptySignatureRows(5)}
            />
          </View>

          <Text style={{ fontSize: 7, marginTop: 6, textAlign: "right" }}>
            Date of issue: {issueDate}
          </Text>
        </CompoundCertificateFrame>

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
          {org.name} · Weld.Doc
        </Text>
      </Page>
    </Document>
  );
}
