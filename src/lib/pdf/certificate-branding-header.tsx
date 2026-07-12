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
  logoUrl,
}: {
  branding: CertificateBranding | unknown;
  orgName: string;
  logoUrl: string | null;
}) {
  const config = parseCertificateBranding(branding);
  const showLogo = config.logo.enabled && Boolean(logoUrl);
  const showName = config.name.enabled && Boolean(orgName.trim());

  if (!showLogo && !showName) return null;

  return (
    <View style={{ marginBottom: 5, width: "100%" }}>
      {showLogo ? (
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image
          src={logoUrl!}
          style={{
            height: config.logo.sizePx,
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
            fontSize: config.name.sizePx,
            color: COLORS.onyx,
            width: "100%",
            textAlign: textAlign(config.name.align),
          }}
        >
          {orgName}
        </Text>
      ) : null}
    </View>
  );
}
