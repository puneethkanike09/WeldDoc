import { View, Text, Image } from "@react-pdf/renderer";
import { COLORS } from "./styles";
import {
  parseCertificateBranding,
  type CertificateBranding,
  type CertificateBrandingAlign,
} from "@/lib/certificate/branding";

function imageAlignSelf(align: CertificateBrandingAlign) {
  if (align === "left") return "flex-start" as const;
  if (align === "right") return "flex-end" as const;
  return "center" as const;
}

function textAlign(align: CertificateBrandingAlign) {
  return align as "left" | "center" | "right";
}

export function CertificateBrandingHeader({
  branding,
  orgName,
  locationText,
  logoUrl,
}: {
  branding: CertificateBranding | unknown;
  orgName: string;
  locationText: string;
  logoUrl: string | null;
}) {
  const config = parseCertificateBranding(branding);
  const showLogo = config.logo.enabled && Boolean(logoUrl);
  const showName = config.name.enabled && Boolean(orgName.trim());
  const showLocation = config.location.enabled && Boolean(locationText.trim());

  if (!showLogo && !showName && !showLocation) return null;

  return (
    <View style={{ marginBottom: 5, width: "100%" }}>
      {showLogo ? (
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image
          src={logoUrl!}
          style={{
            height: 28,
            objectFit: "contain",
            alignSelf: imageAlignSelf(config.logo.align),
            marginBottom: 4,
          }}
        />
      ) : null}
      {showName ? (
        <Text
          style={{
            fontFamily: "Helvetica-Bold",
            fontSize: 13,
            color: COLORS.onyx,
            width: "100%",
            textAlign: textAlign(config.name.align),
          }}
        >
          {orgName}
        </Text>
      ) : null}
      {showLocation ? (
        <Text
          style={{
            fontSize: 8,
            color: COLORS.graphite,
            width: "100%",
            textAlign: textAlign(config.location.align),
          }}
        >
          {locationText}
        </Text>
      ) : null}
    </View>
  );
}
