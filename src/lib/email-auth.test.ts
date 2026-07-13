import { describe, expect, it } from "vitest";
import {
  passwordResetEmailHtml,
  verificationEmailHtml,
} from "@/lib/email";

describe("auth email templates", () => {
  it("verification email includes CTA and fallback URL", () => {
    const html = verificationEmailHtml({
      fullName: "Alex",
      actionLink: "https://example.com/verify?token=abc",
    });
    expect(html).toContain("https://example.com/verify?token=abc");
    expect(html).toContain("Verify Email");
    expect(html).toContain("Alex");
    expect(html).toContain("hello@welddoc.in");
    expect(html).toContain("24 hours");
  });

  it("password reset email includes CTA and fallback URL", () => {
    const html = passwordResetEmailHtml({
      actionLink: "https://example.com/reset?token=xyz",
    });
    expect(html).toContain("https://example.com/reset?token=xyz");
    expect(html).toContain("Reset Password");
    expect(html).toContain("hello@welddoc.in");
    expect(html).toContain("24 hours");
  });
});
