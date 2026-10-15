/**
 * DATABASTESTER – kontrollerar säkerhetsreglerna (RLS) i din riktiga Supabase.
 * Hoppas över automatiskt om Supabase-nycklarna saknas i .env.local.
 *
 * Testerna skapar tillfälliga frågor i det påhittade landet "zz", så att de
 * aldrig visas på sajten, och tar bort dem efteråt.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const configured = Boolean(url && publicKey && secretKey);

const TEST_COUNTRY = "zz";

describe.skipIf(!configured)("databasens säkerhetsregler", () => {
  const visitor = configured ? createClient(url!, publicKey!, { auth: { persistSession: false } }) : null!;
  const admin = configured ? createClient(url!, secretKey!, { auth: { persistSession: false } }) : null!;
  const ids = { draft: "", paid: "", free: "" };
  const createdUsers: string[] = [];
  // Tre användare återanvänds (Supabase tillåter bara 30 nya anonyma användare per timme):
  // plain = ingen tillgång, paid = giltig tillgång, expired = utgången tillgång.
  let plain: { client: SupabaseClient; userId: string };
  let paid: { client: SupabaseClient; userId: string };
  let expired: { client: SupabaseClient; userId: string };

  async function anonymousUser(): Promise<{ client: SupabaseClient; userId: string }> {
    const client = createClient(url!, publicKey!, { auth: { persistSession: false } });
    const { data, error } = await client.auth.signInAnonymously();
    if (error) throw error;
    createdUsers.push(data.user!.id);
    return { client, userId: data.user!.id };
  }

  beforeAll(async () => {
    const base = {
      country: TEST_COUNTRY,
      chapter: 1,
      options: ["a", "b", "c", "d"],
      correct_index: 0,
      explanation: "Tillfällig fråga som skapas av testerna.",
      source_reference: "test",
    };
    const { data, error } = await admin
      .from("questions")
      .insert([
        { ...base, question: "TEST utkast", status: "draft", is_free: true },
        { ...base, question: "TEST granskad betald", status: "reviewed", is_free: false },
        { ...base, question: "TEST granskad gratis", status: "reviewed", is_free: true },
      ])
      .select("id, question");
    if (error) throw error;
    ids.draft = data.find((q) => q.question === "TEST utkast")!.id;
    ids.paid = data.find((q) => q.question === "TEST granskad betald")!.id;
    ids.free = data.find((q) => q.question === "TEST granskad gratis")!.id;

    [plain, paid, expired] = await Promise.all([anonymousUser(), anonymousUser(), anonymousUser()]);
    const grants = await admin.from("access_grants").insert([
      {
        user_id: paid.userId,
        source: "admin",
        starts_at: new Date(Date.now() - 60_000).toISOString(),
        expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
      },
      {
        user_id: expired.userId,
        source: "admin",
        starts_at: new Date(Date.now() - 120_000).toISOString(),
        expires_at: new Date(Date.now() - 60_000).toISOString(),
      },
    ]);
    if (grants.error) throw grants.error;
  });

  afterAll(async () => {
    await admin.from("questions").delete().eq("country", TEST_COUNTRY);
    for (const id of createdUsers) await admin.auth.admin.deleteUser(id);
  });

  it("besökare ser bara granskade frågor", async () => {
    const { data, error } = await visitor.from("questions").select("id, status");
    expect(error).toBeNull();
    expect(data!.every((q) => q.status === "reviewed")).toBe(true);
  });

  it("utkast syns aldrig, inte ens om de är markerade som gratis", async () => {
    const { data } = await visitor.from("questions").select("id").eq("id", ids.draft);
    expect(data).toEqual([]);
  });

  it("granskade gratisfrågor syns för alla", async () => {
    const { data } = await visitor.from("questions").select("id").eq("id", ids.free);
    expect(data).toHaveLength(1);
  });

  it("övriga granskade frågor syns inte utan köp", async () => {
    const { data } = await visitor.from("questions").select("id").eq("id", ids.paid);
    expect(data).toEqual([]);
    const res = await plain.client.from("questions").select("id").eq("id", ids.paid);
    expect(res.data).toEqual([]);
  });

  it("med giltig tillgång syns alla granskade frågor, men inga utkast", async () => {
    const { data } = await paid.client.from("questions").select("id").in("id", [ids.paid, ids.free, ids.draft]);
    expect(data!.map((q) => q.id).sort()).toEqual([ids.paid, ids.free].sort());
  });

  it("utgången tillgång ger inte tillgång", async () => {
    const { data } = await expired.client.from("questions").select("id").eq("id", ids.paid);
    expect(data).toEqual([]);
  });

  it("användare kan inte ge sig själva tillgång", async () => {
    const res = await plain.client.from("access_grants").insert({
      user_id: plain.userId,
      source: "purchase",
      expires_at: new Date(Date.now() + 1e10).toISOString(),
    });
    expect(res.error).not.toBeNull();
  });

  it("besökare kan inte skapa, ändra eller ta bort frågor", async () => {
    const insert = await visitor.from("questions").insert({
      country: TEST_COUNTRY, chapter: 1, question: "Hack?", options: ["a", "b", "c", "d"],
      correct_index: 0, explanation: "Ska stoppas av RLS.", source_reference: "x", status: "reviewed",
    });
    expect(insert.error).not.toBeNull();

    await visitor.from("questions").update({ status: "reviewed" }).eq("id", ids.draft);
    await visitor.from("questions").delete().eq("id", ids.draft);
    const { data } = await admin.from("questions").select("status").eq("id", ids.draft).single();
    expect(data?.status).toBe("draft");
  });

  it("svar kan bara sparas på frågor man har tillgång till", async () => {
    const answer = (questionId: string) =>
      plain.client.from("answers").insert({ question_id: questionId, selected_index: 0, is_correct: true, mode: "free" });
    expect((await answer(ids.free)).error).toBeNull();
    expect((await answer(ids.paid)).error).not.toBeNull();
    expect((await answer(ids.draft)).error).not.toBeNull();
  });

  it("man kan inte spara svar i någon annans namn", async () => {
    const res = await plain.client.from("answers").insert({
      user_id: "00000000-0000-0000-0000-000000000000",
      question_id: ids.free,
      selected_index: 0,
      is_correct: true,
      mode: "free",
    });
    expect(res.error).not.toBeNull();
  });

  it("man ser bara sina egna svar", async () => {
    await plain.client.from("answers").insert({ question_id: ids.free, selected_index: 1, is_correct: false, mode: "free" });
    const { data } = await expired.client.from("answers").select("id");
    expect(data).toEqual([]);
  });

  it("felrapporter går inte att skicka på utkast och kan inte läsas av besökare", async () => {
    const report = await plain.client.from("question_reports").insert({ question_id: ids.draft, user_id: plain.userId, message: "test" });
    expect(report.error).not.toBeNull();
    const { data } = await visitor.from("question_reports").select("id");
    expect(data).toEqual([]);
  });
});
