import { describe, expect, it, vi } from "vitest";
import { checkEmail } from "@/lib/auth/check-email";

describe("checkEmail", () => {
  it("rejects invalid email", async () => {
    const result = await checkEmail(
      { email: "nope" },
      { emailExists: async () => false },
    );
    expect(result).toMatchObject({ success: false, code: "VALIDATION_ERROR" });
  });

  it("returns exists true/false", async () => {
    const emailExists = vi.fn(async () => true);
    const result = await checkEmail({ email: "A@Ex.COM" }, { emailExists });
    expect(result).toEqual({ success: true, data: { exists: true } });
    expect(emailExists).toHaveBeenCalledWith("a@ex.com");
  });
});
