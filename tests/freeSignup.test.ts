import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/csv";
import { needsEmailGate, parseGateForm } from "@/lib/freeSignup";

function form(values: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

const anonymous = { isAnonymous: true, email: null };
const base = { preview: false, isAdmin: false, hasFullAccess: false, user: anonymous, hasCookie: false, hasSignup: false };

describe("e-postrutan före gratisfrågorna", () => {
  it("visas för en ny besökare", () => {
    expect(needsEmailGate(base)).toBe(true);
    expect(needsEmailGate({ ...base, user: null })).toBe(true);
  });

  it("visas inte för den som redan har skrivit sin e-post", () => {
    expect(needsEmailGate({ ...base, hasCookie: true })).toBe(false);
    expect(needsEmailGate({ ...base, hasSignup: true })).toBe(false);
  });

  it("visas aldrig för admin, förhandsvisning, kunder eller inloggade", () => {
    expect(needsEmailGate({ ...base, isAdmin: true })).toBe(false);
    expect(needsEmailGate({ ...base, preview: true })).toBe(false);
    expect(needsEmailGate({ ...base, hasFullAccess: true })).toBe(false);
    expect(needsEmailGate({ ...base, user: { isAnonymous: false, email: "a@b.se" } })).toBe(false);
    expect(needsEmailGate({ ...base, user: { isAnonymous: true, email: "a@b.se" } })).toBe(false);
  });
});

describe("formuläret före gratisfrågorna", () => {
  it("gör om adressen till gemener och tar bort mellanslag", () => {
    expect(parseGateForm(form({ email: "  Kevin@Example.SE " }))).toMatchObject({ email: "kevin@example.se", validEmail: true });
  });

  it("underkänner ogiltiga adresser", () => {
    expect(parseGateForm(form({ email: "inte-en-adress" })).validEmail).toBe(false);
    expect(parseGateForm(form({})).validEmail).toBe(false);
    expect(parseGateForm(form({ email: `${"a".repeat(320)}@b.se` })).validEmail).toBe(false);
  });

  it("samtycket gäller bara om rutan är ikryssad", () => {
    expect(parseGateForm(form({ email: "a@b.se" })).consent).toBe(false);
    expect(parseGateForm(form({ email: "a@b.se", consent_marketing: "on" })).consent).toBe(true);
    expect(parseGateForm(form({ email: "a@b.se", consent_marketing: "yes" })).consent).toBe(false);
  });

  it("känner igen robotar via det dolda fältet", () => {
    expect(parseGateForm(form({ email: "a@b.se", website: "spam" })).isBot).toBe(true);
    expect(parseGateForm(form({ email: "a@b.se", website: "" })).isBot).toBe(false);
  });
});

describe("CSV-export av e-postlistan", () => {
  it("skriver semikolonseparerade rader med BOM", () => {
    const csv = toCsv([
      ["email", "sprak"],
      ["a@b.se", "sv"],
    ]);
    expect(csv).toBe("﻿email;sprak\r\na@b.se;sv\r\n");
  });

  it("citerar celler med semikolon, citattecken och radbrytningar", () => {
    expect(toCsv([['a;b', 'säger "hej"', "rad\nny"]])).toBe('﻿"a;b";"säger ""hej""";"rad\nny"\r\n');
  });

  it("skyddar mot formler i Excel", () => {
    expect(toCsv([["=HYPERLINK(1)", "+1", "-2", "@x"]])).toBe("﻿'=HYPERLINK(1);'+1;'-2;'@x\r\n");
  });

  it("visar tomma värden som tomma celler", () => {
    expect(toCsv([[null, undefined, 0]])).toBe("﻿;;0\r\n");
  });
});
