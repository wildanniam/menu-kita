import { z } from "zod";

export const evidenceTypeSchema = z.enum([
  "menu_listed",
  "common_usage",
  "unresolved",
]);

export const evidenceSchema = z.object({
  id: z.string().trim().min(1),
  claim: z.string().trim().min(1),
  type: evidenceTypeSchema,
  sourceTitle: z.string().trim().min(1).nullable().default(null),
  sourceUrl: z.url().nullable().default(null),
  restaurantConfirmed: z.boolean().default(false),
});

export const researchSourceSchema = z.object({
  title: z.string().trim().min(1),
  url: z.url(),
  snippet: z.string().trim().min(1),
  score: z.number().min(0).max(1).optional(),
});

export const dishSchema = z.object({
  id: z.string().trim().min(1),
  originalName: z.string().trim().min(1),
  translatedName: z.string().trim().min(1).nullable().default(null),
  menuDescription: z.string().trim().min(1).nullable().default(null),
  price: z.string().trim().min(1).nullable().default(null),
  listedIngredients: z.array(z.string().trim().min(1)).default([]),
  unreadableFields: z.array(z.string().trim().min(1)).default([]),
  evidence: z.array(evidenceSchema).default([]),
});

export const menuExtractionSchema = z.object({
  languageCode: z.string().trim().min(2),
  languageName: z.string().trim().min(1),
  dishes: z.array(dishSchema).min(1),
});

export type EvidenceType = z.infer<typeof evidenceTypeSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type ResearchSource = z.infer<typeof researchSourceSchema>;
export type Dish = z.infer<typeof dishSchema>;
export type MenuExtraction = z.infer<typeof menuExtractionSchema>;
