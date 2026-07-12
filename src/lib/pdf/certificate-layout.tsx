import { View, Text } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { COLORS } from "./styles";

/** Blue compound frame used on welder / operator certificates. */
export const CERT_BORDER = COLORS.border;

export function CompoundCertificateFrame({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <View
      style={{
        flex: 1,
        borderWidth: 2.5,
        borderColor: CERT_BORDER,
        padding: 4,
      }}
    >
      <View
        style={{
          flex: 1,
          borderWidth: 1,
          borderColor: CERT_BORDER,
          padding: 10,
        }}
      >
        {children}
      </View>
    </View>
  );
}

/** Borderless label/value row for the welder certificate identity block. */
export function CertificateHeaderFieldRow({
  label,
  value,
  bold,
  labelWidth = 128,
}: {
  label: string;
  value: string;
  bold?: boolean;
  labelWidth?: number;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        paddingVertical: 2,
        paddingHorizontal: 2,
      }}
    >
      <View style={{ width: labelWidth }}>
        <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 7.5 }}>
          {label}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
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
