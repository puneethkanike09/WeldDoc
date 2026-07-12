import type { Metadata, Viewport } from "next";
import { inter, spaceGrotesk } from "@/lib/fonts";
import { Toaster } from "@/components/sui/sonner";
import { NavigationRecovery } from "@/components/app/navigation-recovery";
import { rootMetadata } from "@/lib/seo/metadata";
import "./globals.css";

export const metadata: Metadata = rootMetadata();

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#132537" },
    { media: "(prefers-color-scheme: dark)", color: "#132537" },
  ],
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${spaceGrotesk.variable} ${inter.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <NavigationRecovery />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
