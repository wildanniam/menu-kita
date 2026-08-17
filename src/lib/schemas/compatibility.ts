import { z } from "zod";

export const dietaryStatusSchema = z.enum([
  "conflict",
  "needs_confirmation",
  "compatible",
  "insufficient_information",
]);

export const memberDishCompatibilitySchema = z.object({
  profileId: z.string().trim().min(1),
  dishId: z.string().trim().min(1),
  status: dietaryStatusSchema,
  preferenceScore: z.number().int().min(0).max(100),
  summary: z.string().trim().min(1),
  reasons: z.array(z.string().trim().min(1)).default([]),
  triggeredRestrictions: z.array(z.string().trim().min(1)).default([]),
  evidenceIds: z.array(z.string().trim().min(1)).default([]),
  uncertainties: z.array(z.string().trim().min(1)).default([]),
});

export const groupDishRecommendationSchema = z.object({
  dishId: z.string().trim().min(1),
  memberIds: z.array(z.string().trim().min(1)).min(1),
  reason: z.string().trim().min(1),
  requiresConfirmation: z.boolean(),
  questionIds: z.array(z.string().trim().min(1)).default([]),
});

export const memberRecommendationSchema = z.object({
  profileId: z.string().trim().min(1),
  dishId: z.string().trim().min(1).nullable(),
  reason: z.string().trim().min(1),
});

export const recommendationResultSchema = z.object({
  bestForEveryone: groupDishRecommendationSchema.nullable(),
  perMember: z.array(memberRecommendationSchema).min(1),
  noSharedDishReason: z.string().trim().min(1).nullable().default(null),
});

export type DietaryStatus = z.infer<typeof dietaryStatusSchema>;
export type MemberDishCompatibility = z.infer<
  typeof memberDishCompatibilitySchema
>;
export type GroupDishRecommendation = z.infer<
  typeof groupDishRecommendationSchema
>;
export type MemberRecommendation = z.infer<typeof memberRecommendationSchema>;
export type RecommendationResult = z.infer<
  typeof recommendationResultSchema
>;
