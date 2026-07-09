import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LegalNavLinks } from "@/components/marketing/legal-nav-links";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link href="/" aria-label="Weld.Doc home">
          <Logo />
        </Link>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <LegalNavLinks className="mt-8 justify-center sm:justify-start" />
      </div>

      {/* Editorial right panel */}
      <div className="relative hidden overflow-hidden bg-onyx lg:block">
        <div className="grain absolute inset-0 opacity-40" />
        <div className="relative flex h-full flex-col p-12">
          <div className="flex flex-1 flex-col justify-center">
            <blockquote className="font-display text-[30px] font-semibold leading-[1.2] tracking-tight text-white">
              “Every welder, every qualification, every expiry — in one place
              an auditor can verify with a single scan.”
            </blockquote>
            <p className="mt-6 text-[15px] text-steel">
              Weld.Doc — welder qualification document management.
            </p>
          </div>
          <div className="flex shrink-0 gap-6 text-steel">
            <span className="text-sm">Registry</span>
            <span className="text-sm">Certificates</span>
            <span className="text-sm">QR verify</span>
            <span className="text-sm">Expiry alerts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
