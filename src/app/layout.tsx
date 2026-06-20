import type { Metadata } from "next";
import { inter, spaceGrotesk } from "@/lib/fonts";
import { Toaster } from "@/components/sui/sonner";
import { NavigationRecovery } from "@/components/app/navigation-recovery";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "WeldDoc — Welder Qualification, Done Right",
    template: "%s · WeldDoc",
  },
  description:
    "WeldDoc digitises the complete EN ISO 9606-1 welder qualification lifecycle — registry, certificates, ID cards, QR verification, expiry alerts and master lists.",
  metadataBase: new URL("https://welddoc.in"),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <NavigationRecovery />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
