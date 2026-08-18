import { z } from "zod";

import {
  memberDishCompatibilitySchema,
  type Dish,
  type FoodProfile,
  type MemberDishCompatibility,
} from "../schemas";
import { evaluateHardRestrictions, normalizeFoodText } from "./restrictions";

const preferenceReasonSchema = z.object({
  text: z.string().trim().min(1).max(400),
  basisIds: z.array(z.string().trim().min(1)).min(1),
});

export const preferenceModelOutputSchema = z.object({
  score: z.number().int().min(0).max(100),
  summary: z.string().trim().min(1).max(500),
  reasons: z.array(preferenceReasonSchema).min(1).max(5),
});

const batchPreferenceEntrySchema = preferenceModelOutputSchema.extend({
  profileId: z.string().trim().min(1),
  dishId: z.string().trim().min(1),
});

export const batchPreferenceModelOutputSchema = z.object({
  evaluations: z.array(batchPreferenceEntrySchema),
});

export interface PreferenceModelInput {
  profile: {
    spiceTolerance: FoodProfile["spiceTolerance"];
    likes: string[];
    dislikes: string[];
  };
  dish: {
    id: string;
    originalName: string;
    translatedName: string | null;
    menuDescription: string | null;
    listedIngredients: string[];
    evidence: Array<{ id: string; claim: string; type: string }>;
  };
  allowedBasisIds: string[];
}

export interface PreferenceEvaluationModel {
  evaluate(input: PreferenceModelInput): Promise<unknown>;
}

export interface BatchPreferenceEvaluationModel {
  evaluateBatch(input: {
    profiles: Array<{
      id: string;
      spiceTolerance: FoodProfile["spiceTolerance"];
      likes: string[];
      dislikes: string[];
    }>;
    dishes: PreferenceModelInput["dish"][];
    allowedBasisIdsByDish: Record<string, string[]>;
  }): Promise<unknown>;
}

export interface PreferenceEvaluation {
  score: number;
  summary: string;
  reasons: string[];
  evidenceIds: string[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function dishText(dish: Dish): string {
  return normalizeFoodText(
    [
      dish.originalName,
      dish.translatedName,
      dish.menuDescription,
      ...dish.listedIngredients,
      ...dish.evidence.map(({ claim }) => claim),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function matchingPreferences(values: string[], text: string): string[] {
  return values.filter((value) => {
    const normalized = normalizeFoodText(value);
    if (!normalized) return false;
    const terms = normalized.split(" ").filter((term) => term.length >= 4);
    return terms.some((term) => ` ${text} `.includes(` ${term} `));
  });
}

export function fallbackPreferenceEvaluation(
  profile: FoodProfile,
  dish: Dish,
): PreferenceEvaluation {
  const text = dishText(dish);
  const likes = matchingPreferences(profile.likes, text);
  const dislikes = matchingPreferences(profile.dislikes, text);
  let score = 70 + Math.min(likes.length, 2) * 10 - Math.min(dislikes.length, 2) * 15;
  const mentionsSpicy = /\b(?:chili|chilli|hot|pedas|spicy)\b/.test(text);
  const mentionsExtremeSpice = /\b(?:extremely|extra|very) (?:hot|spicy)\b/.test(
    text,
  );

  if (profile.spiceTolerance === "mild" && mentionsSpicy) score -= 20;
  if (profile.spiceTolerance === "medium" && mentionsExtremeSpice) score -= 15;
  if (profile.spiceTolerance === "spicy" && mentionsSpicy) score += 10;

  const reasons = [
    ...(likes.length > 0
      ? [`Menu wording overlaps with likes: ${likes.join(", ")}.`]
      : []),
    ...(dislikes.length > 0
      ? [`Menu wording overlaps with dislikes: ${dislikes.join(", ")}.`]
      : []),
    ...(mentionsSpicy
      ? [`The menu wording suggests spice relative to a ${profile.spiceTolerance} tolerance.`]
      : []),
  ];

  return {
    score: clamp(score, 0, 100),
    summary: "Preference fit is estimated only from the available menu wording.",
    reasons:
      reasons.length > 0
        ? reasons
        : ["No strong like, dislike, or spice signal appears in the menu wording."],
    evidenceIds: dish.evidence.map(({ id }) => id),
  };
}

export async function evaluatePreferences(
  profile: FoodProfile,
  dish: Dish,
  model: PreferenceEvaluationModel,
): Promise<PreferenceEvaluation> {
  const allowedBasisIds = ["menu", ...dish.evidence.map(({ id }) => id)];
  let rawOutput: unknown;

  try {
    rawOutput = await model.evaluate({
      profile: {
        spiceTolerance: profile.spiceTolerance,
        likes: profile.likes,
        dislikes: profile.dislikes,
      },
      dish: {
        id: dish.id,
        originalName: dish.originalName,
        translatedName: dish.translatedName,
        menuDescription: dish.menuDescription,
        listedIngredients: dish.listedIngredients,
        evidence: dish.evidence.map(({ id, claim, type }) => ({ id, claim, type })),
      },
      allowedBasisIds,
    });
  } catch {
    return fallbackPreferenceEvaluation(profile, dish);
  }

  const parsed = preferenceModelOutputSchema.safeParse(rawOutput);
  if (!parsed.success) return fallbackPreferenceEvaluation(profile, dish);

  const allowed = new Set(allowedBasisIds);
  if (
    parsed.data.reasons.some(({ basisIds }) =>
      basisIds.some((basisId) => !allowed.has(basisId)),
    )
  ) {
    return fallbackPreferenceEvaluation(profile, dish);
  }

  return {
    score: parsed.data.score,
    summary: parsed.data.summary,
    reasons: parsed.data.reasons.map(({ text }) => text),
    evidenceIds: [
      ...new Set(
        parsed.data.reasons
          .flatMap(({ basisIds }) => basisIds)
          .filter((basisId) => basisId !== "menu"),
      ),
    ],
  };
}

export async function evaluateMemberDishCompatibility(
  profile: FoodProfile,
  dish: Dish,
  model: PreferenceEvaluationModel,
): Promise<MemberDishCompatibility> {
  const restrictions = evaluateHardRestrictions(profile, dish);
  const preferences = await evaluatePreferences(profile, dish, model);

  return combineCompatibility(profile, dish, restrictions, preferences);
}

function combineCompatibility(
  profile: FoodProfile,
  dish: Dish,
  restrictions: ReturnType<typeof evaluateHardRestrictions>,
  preferences: PreferenceEvaluation,
): MemberDishCompatibility {

  return memberDishCompatibilitySchema.parse({
    profileId: profile.id,
    dishId: dish.id,
    status: restrictions.status,
    preferenceScore: preferences.score,
    summary: `${restrictions.summary} ${preferences.summary}`,
    reasons: [...restrictions.reasons, ...preferences.reasons],
    triggeredRestrictions: restrictions.triggeredRestrictions,
    evidenceIds: [
      ...new Set([...restrictions.evidenceIds, ...preferences.evidenceIds]),
    ],
    uncertainties: restrictions.uncertainties,
  });
}

function preferenceFromBatchEntry(
  entry: z.infer<typeof batchPreferenceEntrySchema>,
  allowedBasisIds: string[],
): PreferenceEvaluation | undefined {
  const allowed = new Set(allowedBasisIds);
  if (
    entry.reasons.some(({ basisIds }) =>
      basisIds.some((basisId) => !allowed.has(basisId)),
    )
  ) {
    return undefined;
  }

  return {
    score: entry.score,
    summary: entry.summary,
    reasons: entry.reasons.map(({ text }) => text),
    evidenceIds: [
      ...new Set(
        entry.reasons
          .flatMap(({ basisIds }) => basisIds)
          .filter((basisId) => basisId !== "menu"),
      ),
    ],
  };
}

export async function evaluateGroupCompatibility(
  profiles: FoodProfile[],
  dishes: Dish[],
  model: BatchPreferenceEvaluationModel,
): Promise<MemberDishCompatibility[]> {
  const allowedBasisIdsByDish = Object.fromEntries(
    dishes.map((dish) => [
      dish.id,
      ["menu", ...dish.evidence.map(({ id }) => id)],
    ]),
  );
  const dishInputs: PreferenceModelInput["dish"][] = dishes.map((dish) => ({
    id: dish.id,
    originalName: dish.originalName,
    translatedName: dish.translatedName,
    menuDescription: dish.menuDescription,
    listedIngredients: dish.listedIngredients,
    evidence: dish.evidence.map(({ id, claim, type }) => ({ id, claim, type })),
  }));
  let parsedOutput: z.infer<typeof batchPreferenceModelOutputSchema> | undefined;

  try {
    const rawOutput = await model.evaluateBatch({
      profiles: profiles.map((profile) => ({
        id: profile.id,
        spiceTolerance: profile.spiceTolerance,
        likes: profile.likes,
        dislikes: profile.dislikes,
      })),
      dishes: dishInputs,
      allowedBasisIdsByDish,
    });
    const parsed = batchPreferenceModelOutputSchema.safeParse(rawOutput);
    if (parsed.success) parsedOutput = parsed.data;
  } catch {
    parsedOutput = undefined;
  }

  const knownProfileIds = new Set(profiles.map(({ id }) => id));
  const knownDishIds = new Set(dishes.map(({ id }) => id));
  const batchEvaluations = new Map<string, PreferenceEvaluation>();

  for (const entry of parsedOutput?.evaluations ?? []) {
    if (
      !knownProfileIds.has(entry.profileId) ||
      !knownDishIds.has(entry.dishId)
    ) {
      continue;
    }
    const key = `${entry.profileId}\u0000${entry.dishId}`;
    if (batchEvaluations.has(key)) continue;
    const evaluation = preferenceFromBatchEntry(
      entry,
      allowedBasisIdsByDish[entry.dishId],
    );
    if (evaluation) batchEvaluations.set(key, evaluation);
  }

  return profiles.flatMap((profile) =>
    dishes.map((dish) => {
      const key = `${profile.id}\u0000${dish.id}`;
      const preferences =
        batchEvaluations.get(key) ?? fallbackPreferenceEvaluation(profile, dish);
      const restrictions = evaluateHardRestrictions(profile, dish);
      return combineCompatibility(profile, dish, restrictions, preferences);
    }),
  );
}
