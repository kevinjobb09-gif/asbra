/**
 * DATABASTESTER – kontrollerar säkerhetsreglerna (RLS) i din riktiga Supabase.
 * Hoppas över automatiskt om Supabase-nycklarna saknas i .env.local.
 *
 * Testerna använder den PUBLIKA nyckeln, alltså samma behörighet som en
 * besökare har. De skapar ett tillfälligt utkast med den hemliga nyckeln och
 * tar bort det efteråt.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const configured = Boolean(url && publicKey && secretKey);

describe.skipIf(!configured)("databasens säkerhetsregler", () => {
  const visitor = configured ? createClient(url!, publicKey!, { auth: { persistSession: false } }) : null!;
  const admin = configured ? createClient(url!, secretKey!, { auth: { persistSession: false } }) : null!;
  let draftId: string;

  beforeAll(async () => {
    const { data, error } = await admin
      .from("questions")
      .insert({
        country: "se",
        chapter: 1,
        question: "TESTUTKAST – ska aldrig synas",
        options: ["a", "b", "c", "d"],
        correct_index: 0,
        explanation: "Tillfällig fråga som skapas av testerna.",
        source_reference: "test",
        status: "draft",
      })
      .select("id")
      .single();
    if (error) throw error;
    draftId = data.id;
  });

  afterAll(async () => {
    if (draftId) await admin.from("questions").delete().eq("id", draftId);
  });

  it("besökare ser bara granskade frågor", async () => {
    const { data, error } = await visitor.from("questions").select("id, status");
    expect(error).toBeNull();
    expect(data!.every((q) => q.status === "reviewed")).toBe(true);
  });

  it("besökare kan inte hämta ett utkast ens med dess id", async () => {
    const { data } = await visitor.from("questions").select("id").eq("id", draftId);
    expect(data).toEqual([]);
  });

  it("besökare kan inte skapa, ändra eller ta bort frågor", async () => {
    const insert = await visitor.from("questions").insert({
      country: "se", chapter: 1, question: "Hack?", options: ["a", "b", "c", "d"],
      correct_index: 0, explanation: "Ska stoppas av RLS.", source_reference: "x", status: "reviewed",
    });
    expect(insert.error).not.toBeNull();

    await visitor.from("questions").update({ status: "reviewed" }).eq("id", draftId);
    await visitor.from("questions").delete().eq("id", draftId);
    const { data } = await admin.from("questions").select("status").eq("id", draftId).single();
    expect(data?.status).toBe("draft");
  });

  it("besökare kan inte läsa felrapporter", async () => {
    const { data } = await visitor.from("question_reports").select("id");
    expect(data).toEqual([]);
  });
});
