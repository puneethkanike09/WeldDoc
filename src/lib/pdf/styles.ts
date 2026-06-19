import { StyleSheet } from "@react-pdf/renderer";

export const COLORS = {
  onyx: "#161616",
  charcoal: "#2a2a2a",
  graphite: "#4a4a4a",
  steel: "#909090",
  silver: "#e2e2e4",
  ember: "#f90a08",
  frost: "#f4f5f6",
  active: "#214224",
  white: "#ffffff",
};

export const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 36,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: COLORS.charcoal,
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.onyx,
    paddingBottom: 10,
  },
  orgName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 15,
    color: COLORS.onyx,
  },
  docTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: COLORS.onyx,
    textAlign: "right",
  },
  eyebrow: {
    fontSize: 7.5,
    letterSpacing: 1,
    color: COLORS.ember,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: COLORS.graphite,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  row: { flexDirection: "row" },
  cellLabel: { color: COLORS.steel, fontSize: 7.5, marginBottom: 1 },
  cellValue: { color: COLORS.onyx, fontFamily: "Helvetica-Bold", fontSize: 9 },
  card: {
    borderWidth: 1,
    borderColor: COLORS.silver,
    borderRadius: 6,
    padding: 10,
  },
  rangeBox: {
    backgroundColor: COLORS.frost,
    borderRadius: 6,
    padding: 10,
  },
});
