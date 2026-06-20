import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { COLORS } from "./styles";
import { formatPedDate, type PedMasterRow } from "@/lib/masterlist-ped";

const HAIR = 0.5;
const FONT = 6;
const FONT_H = 5.5;

const W = {
  sl: 20,
  name: 72,
  site: 18,
  welderNo: 34,
  process: 26,
  joint: 28,
  posBw: 48,
  posFw: 48,
  fm: 32,
  dia: 38,
  bwThk: 38,
  fwThk: 38,
  testDate: 44,
  valid: 44,
} as const;

export function PedMasterListDocument({
  rows,
  orgName,
  logoUrl,
  asOnDate,
}: {
  rows: PedMasterRow[];
  orgName: string;
  logoUrl?: string | null;
  asOnDate?: string;
}) {
  const dated = formatPedDate(asOnDate ?? new Date().toISOString().slice(0, 10));
  const title =
    "List Of Qualified Welders for PED 2014/68/EU, Annex I sec 3.1.2. as per ISO 9606-1 and Welding Operators as per ISO 14732";

  return (
    <Document
      title="List of Qualified Welders — PED"
      author={orgName}
    >
      <Page
        size="A4"
        orientation="landscape"
        style={{ padding: 16, fontFamily: "Helvetica", fontSize: FONT }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 6 }}>
          {logoUrl ? (
            <Image
              src={logoUrl}
              style={{ width: 72, height: 28, objectFit: "contain", marginRight: 8 }}
            />
          ) : (
            <Text
              style={{
                fontFamily: "Helvetica-Bold",
                fontSize: 11,
                color: COLORS.onyx,
                width: 80,
              }}
            >
              {orgName}
            </Text>
          )}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "Helvetica-Bold",
                fontSize: 7.5,
                textAlign: "center",
                color: COLORS.onyx,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                fontFamily: "Helvetica-Bold",
                fontSize: 7.5,
                textAlign: "center",
                marginTop: 2,
                color: COLORS.onyx,
              }}
            >
              as on Dated : {dated}
            </Text>
          </View>
        </View>

        <View style={{ borderWidth: HAIR, borderColor: COLORS.onyx }}>
          <View style={{ flexDirection: "row", backgroundColor: COLORS.frost }}>
            <HeaderCell w={W.sl} rowSpan={2}>
              SL.{"\n"}NO.
            </HeaderCell>
            <HeaderCell w={W.name} rowSpan={2}>
              WELDER{"\n"}NAME
            </HeaderCell>
            <HeaderCell w={W.site} rowSpan={2}>
              SITE
            </HeaderCell>
            <HeaderCell w={W.welderNo} rowSpan={2}>
              WELDER{"\n"}NO
            </HeaderCell>
            <HeaderCell w={W.process} rowSpan={2}>
              PROCESS
            </HeaderCell>
            <HeaderCell w={W.joint} rowSpan={2}>
              JOINT{"\n"}TYPE
            </HeaderCell>
            <HeaderCell w={W.posBw + W.posFw} colSpan={2}>
              POSITION QUALIFIED
            </HeaderCell>
            <HeaderCell w={W.fm} rowSpan={2}>
              FM{"\n"}GROUP
            </HeaderCell>
            <HeaderCell w={W.dia + W.bwThk + W.fwThk} colSpan={3}>
              QUALIFIED RANGE
            </HeaderCell>
            <HeaderCell w={W.testDate} rowSpan={2}>
              TEST{"\n"}DATE
            </HeaderCell>
            <HeaderCell w={W.valid} rowSpan={2} last>
              VALID{"\n"}UP TO
            </HeaderCell>
          </View>

          <View style={{ flexDirection: "row", backgroundColor: COLORS.frost }}>
            <Spacer w={W.sl + W.name + W.site + W.welderNo + W.process + W.joint} />
            <HeaderCell w={W.posBw}>BW</HeaderCell>
            <HeaderCell w={W.posFw}>FW</HeaderCell>
            <Spacer w={W.fm} />
            <HeaderCell w={W.dia}>Dia.</HeaderCell>
            <HeaderCell w={W.bwThk}>(BW) Thk</HeaderCell>
            <HeaderCell w={W.fwThk} last>
              (FW) Thk
            </HeaderCell>
            <Spacer w={W.testDate + W.valid} />
          </View>

          {rows.map((r, i) => (
            <View key={i} style={{ flexDirection: "row" }} wrap={false}>
              <DataCell w={W.sl}>{String(r.slNo)}</DataCell>
              <DataCell w={W.name}>{r.welderName}</DataCell>
              <DataCell w={W.site}>{r.site}</DataCell>
              <DataCell w={W.welderNo}>{r.welderNo}</DataCell>
              <DataCell w={W.process}>{r.process}</DataCell>
              <DataCell w={W.joint}>{r.jointType}</DataCell>
              <DataCell w={W.posBw}>{r.positionBw}</DataCell>
              <DataCell w={W.posFw}>{r.positionFw}</DataCell>
              <DataCell w={W.fm}>{r.fmGroup}</DataCell>
              <DataCell w={W.dia}>{r.diameter}</DataCell>
              <DataCell w={W.bwThk}>{r.bwThickness}</DataCell>
              <DataCell w={W.fwThk}>{r.fwThickness}</DataCell>
              <DataCell w={W.testDate}>{r.testDate}</DataCell>
              <DataCell w={W.valid} last>
                {r.validUntil}
              </DataCell>
            </View>
          ))}
        </View>

        <Text style={{ marginTop: 6, fontSize: 6, color: COLORS.steel }}>
          {rows.length} qualification record(s) · Generated by WeldDoc
        </Text>
      </Page>
    </Document>
  );
}

function Spacer({ w }: { w: number }) {
  return <View style={{ width: w }} />;
}

function HeaderCell({
  w,
  children,
  last,
  rowSpan,
  colSpan,
}: {
  w: number;
  children: React.ReactNode;
  last?: boolean;
  rowSpan?: number;
  colSpan?: number;
}) {
  return (
    <View
      style={{
        width: w,
        minHeight: rowSpan ? 28 : 14,
        padding: 2,
        borderRightWidth: last ? 0 : HAIR,
        borderBottomWidth: HAIR,
        borderColor: COLORS.onyx,
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontSize: FONT_H,
          fontFamily: "Helvetica-Bold",
          textAlign: "center",
          color: COLORS.onyx,
        }}
      >
        {children}
      </Text>
    </View>
  );
}

function DataCell({
  w,
  children,
  last,
}: {
  w: number;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <View
      style={{
        width: w,
        padding: 2,
        minHeight: 16,
        borderRightWidth: last ? 0 : HAIR,
        borderBottomWidth: HAIR,
        borderColor: COLORS.onyx,
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: FONT, textAlign: "center", color: COLORS.onyx }}>
        {children}
      </Text>
    </View>
  );
}
