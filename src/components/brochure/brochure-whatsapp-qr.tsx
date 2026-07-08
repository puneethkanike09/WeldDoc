import { brochureWhatsAppUrl, type BrochureRegionalConfig } from "@/lib/brochure/regions";
import { qrDataUrl } from "@/lib/qr";

export async function BrochureWhatsAppQr({
  whatsapp,
}: {
  whatsapp: BrochureRegionalConfig["whatsapp"];
}) {
  const src = await qrDataUrl(brochureWhatsAppUrl(whatsapp), "black");

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`WhatsApp QR — scan to message +${whatsapp.phone}`}
      className="brochure-hero-inset-img brochure-hero-inset-qr"
      loading="eager"
      decoding="sync"
      draggable={false}
    />
  );
}
