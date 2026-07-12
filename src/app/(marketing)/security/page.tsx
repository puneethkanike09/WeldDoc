import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Security",
  description:
    "How Weld.Doc handles authentication, encryption, organisation data isolation, and secure welder qualification records for fabrication teams.",
  path: "/security",
});

export default function SecurityPage() {
  return (
    <LegalPage
      eyebrow="Trust"
      title="Security guidelines"
      lastUpdated="June 27, 2026"
      active="/security"
    >
      <p>
        This page is maintained by the Weld.Doc team to answer common questions
        about how we handle security. It describes current practices, not a
        third-party certification.
      </p>

      <section>
        <h2>Authentication</h2>
        <p>
          Weld.Doc supports email-and-password sign-in. Sessions are managed by
          our authentication provider (Supabase Auth) and stored in secure,
          HTTP-only browser cookies. We recommend using a unique, strong
          password and signing out on shared devices.
        </p>
      </section>

      <section>
        <h2>Encryption in transit</h2>
        <p>
          All traffic between your browser and Weld.Doc is encrypted using TLS.
          Connections between Weld.Doc and the managed database and file storage
          are also encrypted.
        </p>
      </section>

      <section>
        <h2>Per-organisation isolation</h2>
        <p>
          Every row in our database is scoped to a single organisation and
          protected by row-level security policies, so authenticated requests
          from one organisation cannot read or modify data belonging to another.
        </p>
      </section>

      <section>
        <h2>Uploaded files</h2>
        <p>
          Supporting documents, photos, and certificate assets you upload are
          stored in private object storage tied to your organisation. Access
          from the app requires a valid signed-in session; files are not
          publicly listed or browsable.
        </p>
      </section>

      <section>
        <h2>QR verification</h2>
        <p>
          ID cards include a QR code that links to a public verification page.
          That page shows only the fields needed to confirm qualification
          status — not your full internal records or other welders in your
          organisation.
        </p>
      </section>

      <section>
        <h2>Backups</h2>
        <p>
          Our managed database provider takes daily snapshots and retains them
          on a rolling window for disaster recovery.
        </p>
      </section>

      <section>
        <h2>Your responsibilities</h2>
        <ul>
          <li>Keep your password private and unique to Weld.Doc.</li>
          <li>Sign out on shared devices.</li>
          <li>Review the email addresses on your account and alert settings regularly.</li>
          <li>
            Use master list and certificate exports to keep your own copies of
            critical qualification data.
          </li>
          <li>
            Limit who can sign in to your organisation&apos;s workspace.
          </li>
        </ul>
      </section>

      <section>
        <h2>Reporting a vulnerability</h2>
        <p>
          If you believe you&apos;ve found a security issue, please email{" "}
          <a
            href="mailto:security@welddoc.in"
            className="text-ink underline underline-offset-2 hover:opacity-70"
          >
            security@welddoc.in
          </a>{" "}
          with steps to reproduce. Please give us a reasonable window to
          investigate and respond before public disclosure.
        </p>
      </section>

      <p className="text-caption text-muted-slate">
        Note: Weld.Doc is in active development. This page describes current
        security practices and will be updated as the product matures. It is
        not a certification or a legal warranty.
      </p>
    </LegalPage>
  );
}
