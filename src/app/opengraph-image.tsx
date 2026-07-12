import { ImageResponse } from "next/og";
import { getSiteUrl, SITE_NAME, SITE_TAGLINE } from "@/lib/seo/site";

export const runtime = "nodejs";

export const alt = `${SITE_NAME} — Welder & Operator Qualification Software`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const siteUrl = getSiteUrl();
  let iconSrc: string | null = null;
  try {
    const icon = await fetch(new URL("/brand/icon-light.png", siteUrl));
    if (icon.ok) {
      const buf = await icon.arrayBuffer();
      iconSrc = `data:image/png;base64,${Buffer.from(buf).toString("base64")}`;
    }
  } catch {
    /* fallback to wordmark only */
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#132537",
          padding: "72px 80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {iconSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={iconSrc}
              alt=""
              width={96}
              height={112}
              style={{ objectFit: "contain" }}
            />
          ) : null}
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "#ffffff",
            }}
          >
            Weld<span style={{ color: "#e59527" }}>.</span>Doc
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              color: "#f5f0e8",
              lineHeight: 1.15,
              maxWidth: 900,
            }}
          >
            {SITE_TAGLINE}
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#c8d0da",
              lineHeight: 1.4,
              maxWidth: 920,
            }}
          >
            ISO 9606-1 & ISO 14732 certificates · QR verification · Expiry
            alerts · Master lists
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "#e59527",
            fontWeight: 600,
          }}
        >
          <span>welddoc.in</span>
          <span>Purpose-built for fabrication & QC teams</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
