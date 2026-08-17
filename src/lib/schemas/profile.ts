import { z } from "zod";

export const spiceToleranceSchema = z.enum(["mild", "medium", "spicy"]);

export const foodProfileSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  avatarUrl: z.url().optional(),
  isCurrentUser: z.boolean().default(false),
  dietaryRequirements: z.array(z.string().trim().min(1)).default([]),
  allergies: z.array(z.string().trim().min(1)).default([]),
  spiceTolerance: spiceToleranceSchema,
  likes: z.array(z.string().trim().min(1)).default([]),
  dislikes: z.array(z.string().trim().min(1)).default([]),
});

export const groupSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  members: z.array(foodProfileSchema).min(1),
});

export type SpiceTolerance = z.infer<typeof spiceToleranceSchema>;
export type FoodProfile = z.infer<typeof foodProfileSchema>;
export type Group = z.infer<typeof groupSchema>;
