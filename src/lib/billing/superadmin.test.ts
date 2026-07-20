import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isSuperAdmin } from "./superadmin";

let saved: string | undefined;

beforeEach(() => {
  saved = process.env.SUPERADMIN_EMAILS;
  process.env.SUPERADMIN_EMAILS = "boss@welddoc.in, Admin@Welddoc.in";
});
afterEach(() => {
  if (saved === undefined) delete process.env.SUPERADMIN_EMAILS;
  else process.env.SUPERADMIN_EMAILS = saved;
});

describe("isSuperAdmin", () => {
  it("matches a listed email", () => {
    expect(isSuperAdmin("boss@welddoc.in")).toBe(true);
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(isSuperAdmin("  ADMIN@welddoc.in ")).toBe(true);
  });

  it("rejects unlisted emails", () => {
    expect(isSuperAdmin("random@example.com")).toBe(false);
  });

  it("rejects null/empty", () => {
    expect(isSuperAdmin(null)).toBe(false);
    expect(isSuperAdmin("")).toBe(false);
    expect(isSuperAdmin(undefined)).toBe(false);
  });

  it("returns false when env is unset", () => {
    delete process.env.SUPERADMIN_EMAILS;
    expect(isSuperAdmin("boss@welddoc.in")).toBe(false);
  });
});
