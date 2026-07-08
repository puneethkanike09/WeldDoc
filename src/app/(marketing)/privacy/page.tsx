import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Weld.Doc collects, uses, and protects your organisation's welder and operator qualification data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      lastUpdated="June 27, 2026"
      active="/privacy"
    >
      <p>
        This page explains, in plain language, what information Weld.Doc handles
        when you use the service and how we look after it.
      </p>

      <section>
        <h2>Information we collect</h2>
        <p>
          When you create an account, we store the email address and password
          you sign up with, plus your name if you provide it during registration.
          Your organisation profile — company name, address, alert recipients,
          and related settings — is stored so the product can work for your
          team.
        </p>
        <p className="mt-4">
          While using Weld.Doc, you create and manage welder and operator records,
          qualifications, certificates, validation logs, uploaded documents, and
          master lists. That content belongs to your organisation; we store it
          so you can access it securely from any signed-in browser session.
        </p>
        <p className="mt-4">
          Public QR verification pages expose only the information needed to
          confirm a qualification — such as name, qualification status, and
          expiry — when someone scans a welder or operator ID card. They do not
          expose your full organisation workspace.
        </p>
      </section>

      <section>
        <h2>How we use it</h2>
        <p>
          We use your information to operate the product: authenticate you,
          render your registry and certificates, run expiry checks, send alert
          emails when configured, and generate exports you request. We do not
          sell your data and we do not use the content of your workspace to
          train third-party AI models.
        </p>
      </section>

      <section>
        <h2>Where it lives</h2>
        <p>
          Your data is stored in our managed backend (Supabase) with per-
          organisation isolation enforced at the database layer through row-
          level security. Connections between your browser and Weld.Doc, and
          between Weld.Doc and our backend, are encrypted in transit using TLS.
        </p>
      </section>

      <section>
        <h2>Email notifications</h2>
        <p>
          If you configure expiry alerts, Weld.Doc sends digest emails to the
          addresses you specify and, where a welder or operator profile includes
          an email, individual reminders about their qualifications. These
          messages are delivered through our email provider (Resend) and contain
          only the information needed for the notification.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>
          You can update organisation settings, welder and operator records, and
          alert preferences from within the app. To export qualification data,
          use the master list and certificate features available in your
          workspace. To close your account or request deletion of organisation
          data, contact us at{" "}
          <a
            href="mailto:hello@welddoc.in"
            className="text-ink underline underline-offset-2 hover:opacity-70"
          >
            hello@welddoc.in
          </a>
          .
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about this policy? Reach us at{" "}
          <a
            href="mailto:hello@welddoc.in"
            className="text-ink underline underline-offset-2 hover:opacity-70"
          >
            hello@welddoc.in
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
