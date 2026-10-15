import { describe, expect, it } from "vitest";
import { isAdminEmail } from "@/lib/admin/isAdminEmail";
import { parseEmailList } from "@/lib/env";
import { safeRedirectPath } from "@/lib/safeRedirect";

describe("admin-behörighet", () => {
  const admins = parseEmailList(" Kevinjobb09@gmail.com , annan@example.com ,");

  it("läser listan med admins", () => {
    expect(admins).toEqual(["kevinjobb09@gmail.com", "annan@example.com"]);
  });

  it("släpper in admins oavsett stora/små bokstäver", () => {
    expect(isAdminEmail("KEVINJOBB09@gmail.com", admins)).toBe(true);
  });

  it("stoppar alla andra", () => {
    expect(isAdminEmail("kevinjobb09@gmail.com.evil.com", admins)).toBe(false);
    expect(isAdminEmail("", admins)).toBe(false);
    expect(isAdminEmail(null, admins)).toBe(false);
    expect(isAdminEmail("kevinjobb09@gmail.com", [])).toBe(false);
  });
});

describe("säker vidarebefordran efter inloggning", () => {
  it("tillåter sidor på den egna sajten", () => {
    expect(safeRedirectPath("/admin")).toBe("/admin");
  });

  it("tillåter hela adresser på den egna sajten (från e-postmallen)", () => {
    expect(safeRedirectPath("https://min-sajt.se/konto?x=1", "/", "https://min-sajt.se")).toBe("/konto?x=1");
    expect(safeRedirectPath("https://evil.com/konto", "/", "https://min-sajt.se")).toBe("/");
    expect(safeRedirectPath("https://min-sajt.se.evil.com/", "/", "https://min-sajt.se")).toBe("/");
  });

  it("stoppar länkar till andra sajter", () => {
    expect(safeRedirectPath("https://evil.com")).toBe("/");
    expect(safeRedirectPath("//evil.com")).toBe("/");
    expect(safeRedirectPath("/\\evil.com")).toBe("/");
    expect(safeRedirectPath(null)).toBe("/");
  });
});
