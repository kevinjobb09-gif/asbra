import { z } from "zod";
import { countries, type CountryCode } from "@/config";

export const QUESTION_STATUSES = ["draft", "reviewed"] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export const statusLabels: Record<QuestionStatus, string> = {
  draft: "Utkast",
  reviewed: "Granskad",
};

/** En fråga som den lagras i databasen. */
export type Question = {
  id: string;
  country: CountryCode;
  chapter: number;
  section: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  source_reference: string;
  difficulty: number;
  status: QuestionStatus;
  review_note: string | null;
  is_sample: boolean;
  is_free: boolean;
  created_at: string;
  updated_at: string;
};

/** Källhänvisningar som börjar så här är platshållare och får inte publiceras. */
export const PLACEHOLDER_SOURCE_PREFIX = "EXEMPEL";

/**
 * Regler för en fråga. Används både på adminsidan och i utkastskriptet,
 * så att en felaktig fråga aldrig kan sparas.
 */
export const questionInputSchema = z
  .object({
    country: z.enum(Object.keys(countries) as [CountryCode, ...CountryCode[]]),
    chapter: z.coerce.number().int().min(1),
    section: z.string().trim().max(200).default(""),
    question: z.string().trim().min(5, "Frågan är för kort.").max(500),
    options: z
      .array(z.string().trim().min(1, "Alla fyra svarsalternativ måste fyllas i.").max(300))
      .length(4, "Det måste finnas exakt fyra svarsalternativ."),
    correct_index: z.coerce.number().int().min(0).max(3),
    explanation: z.string().trim().min(20, "Förklaringen är för kort.").max(2000),
    source_reference: z.string().trim().min(3, "Källhänvisning saknas.").max(300),
    difficulty: z.coerce.number().int().min(1).max(3).default(2),
    status: z.enum(QUESTION_STATUSES),
    /** Gratisfrågor visas i gratisläget och kan delas. */
    is_free: z.boolean().default(false),
    review_note: z
      .string()
      .trim()
      .max(1000)
      .nullish()
      .transform((v) => v || null),
  })
  .superRefine((q, ctx) => {
    const country = countries[q.country];
    if (!country.chapters.some((c) => c.number === q.chapter)) {
      ctx.addIssue({ code: "custom", path: ["chapter"], message: "Kapitlet finns inte." });
    }
    const normalized = q.options.map((o) => o.toLowerCase());
    if (new Set(normalized).size !== normalized.length) {
      ctx.addIssue({ code: "custom", path: ["options"], message: "Två svarsalternativ är likadana." });
    }
    if (q.status === "reviewed" && q.source_reference.toUpperCase().startsWith(PLACEHOLDER_SOURCE_PREFIX)) {
      ctx.addIssue({
        code: "custom",
        path: ["source_reference"],
        message: "Skriv in den riktiga källhänvisningen innan frågan markeras som granskad.",
      });
    }
  });

export type QuestionInput = z.infer<typeof questionInputSchema>;

/** Gör om formulärdata från adminsidan till ett objekt som kan kontrolleras. */
export function questionInputFromFormData(formData: FormData, status: QuestionStatus) {
  return {
    country: formData.get("country"),
    chapter: formData.get("chapter"),
    section: formData.get("section") ?? "",
    question: formData.get("question"),
    options: [0, 1, 2, 3].map((i) => formData.get(`option${i}`) ?? ""),
    correct_index: formData.get("correct_index"),
    explanation: formData.get("explanation"),
    source_reference: formData.get("source_reference"),
    difficulty: formData.get("difficulty") ?? 2,
    status,
    is_free: formData.get("is_free") === "on",
    review_note: formData.get("review_note"),
  };
}
