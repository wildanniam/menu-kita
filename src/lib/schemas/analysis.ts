import { z } from "zod";

import {
  memberDishCompatibilitySchema,
  recommendationResultSchema,
} from "./compatibility";
import { menuExtractionSchema } from "./menu";

export const analysisStageSchema = z.enum([
  "reading_menu",
  "checking_evidence",
  "researching_dishes",
  "matching_profiles",
  "preparing_recommendations",
  "complete",
  "failed",
]);

export const restaurantQuestionSchema = z.object({
  id: z.string().trim().min(1),
  dishId: z.string().trim().min(1),
  memberIds: z.array(z.string().trim().min(1)).min(1),
  english: z.string().trim().min(1),
  localized: z.string().trim().min(1).nullable(),
  languageCode: z.string().trim().min(2),
  languageName: z.string().trim().min(1),
});

export const analysisResultSchema = z.object({
  menu: menuExtractionSchema,
  compatibility: z.array(memberDishCompatibilitySchema),
  recommendations: recommendationResultSchema,
  restaurantQuestions: z.array(restaurantQuestionSchema).default([]),
});

export const analysisStageEventSchema = z.object({
  type: z.literal("stage"),
  stage: analysisStageSchema,
  message: z.string().trim().min(1),
});

export const analysisResultEventSchema = z.object({
  type: z.literal("result"),
  data: analysisResultSchema,
});

export const analysisErrorEventSchema = z.object({
  type: z.literal("error"),
  code: z.string().trim().min(1),
  message: z.string().trim().min(1),
  retryable: z.boolean(),
});

export const analysisStreamEventSchema = z.discriminatedUnion("type", [
  analysisStageEventSchema,
  analysisResultEventSchema,
  analysisErrorEventSchema,
]);

export type AnalysisStage = z.infer<typeof analysisStageSchema>;
export type RestaurantQuestion = z.infer<typeof restaurantQuestionSchema>;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type AnalysisStageEvent = z.infer<typeof analysisStageEventSchema>;
export type AnalysisResultEvent = z.infer<typeof analysisResultEventSchema>;
export type AnalysisErrorEvent = z.infer<typeof analysisErrorEventSchema>;
export type AnalysisStreamEvent = z.infer<typeof analysisStreamEventSchema>;
