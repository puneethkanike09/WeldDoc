import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms that govern your use of WeldDoc for welder and operator qualification management.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      lastUpdated="June 27, 2026"
      active="/terms"
    >
      <p>
        These terms describe the relationship between you and WeldDoc when you
        use the service. By creating an account you agree to them. If you
        don&apos;t, please don&apos;t use the service.
      </p>

      <section>
        <h2>Your account</h2>
        <p>
          You&apos;re responsible for the activity on your account and for
          keeping your sign-in credentials safe. Each account is tied to one
          organisation workspace. Share access only with people you trust to
          manage qualification records on your behalf.
        </p>
      </section>

      <section>
        <h2>Your content</h2>
        <p>
          Everything you put into WeldDoc — welder and operator profiles,
          qualifications, certificates, validation logs, uploaded documents, and
          master lists — belongs to your organisation. You grant us the minimum
          permissions needed to host it, render it back to you, generate
          certificates and exports, and send notifications you configure. We
          don&apos;t claim ownership of your content.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>
          Don&apos;t use WeldDoc to break the law, to infringe someone
          else&apos;s rights, to send spam, or to attempt to disrupt or reverse-
          engineer the service. We may suspend accounts that do.
        </p>
      </section>

      <section>
        <h2>Qualification records</h2>
        <p>
          WeldDoc helps you manage qualification documentation according to
          standards such as EN ISO 9606-1 and EN ISO 14732. You remain
          responsible for the accuracy of the data you enter and for meeting
          your own regulatory and contractual obligations. The service is a tool
          to organise records — not a substitute for qualified welding
          coordination or third-party certification.
        </p>
      </section>

      <section>
        <h2>Service availability</h2>
        <p>
          We work hard to keep the service reliable, but we provide it on an
          &quot;as is&quot; basis without warranties. To the extent permitted by
          law, WeldDoc is not liable for indirect or consequential damages
          arising from your use of the service.
        </p>
      </section>

      <section>
        <h2>Termination</h2>
        <p>
          You can request closure of your account by contacting us. We can
          suspend or close accounts that violate these terms.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          If we make material changes to these terms we&apos;ll notify you by
          email or in the app before they take effect.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions?{" "}
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
