import { z } from "zod";

import { evaluateHardRestrictions } from "../compatibility";
import type { FoodProfile, LocationContext, MenuExtraction } from "../schemas";

export const MAX_RESEARCH_DISHES = 3;
export const MAX_SEARCHES_PER_DISH = 2;

const querySchema = z.string().trim().min(1).max(300);

export const researchProposalSchema = z.object({
  dishId: z.string().trim().min(1),
  shouldResearch: z.boolean(),
  reason: z.string().trim().min(1),
  queries: z.array(querySchema).max(MAX_SEARCHES_PER_DISH),
});

export const researchPlannerOutputSchema = z.object({
  decisions: z.array(researchProposalSchema),
});

export const researchPlanItemSchema = z.object({
  dishId: z.string().trim().min(1),
  reason: z.string().trim().min(1),
  queries: z.array(querySchema).min(1).max(MAX_SEARCHES_PER_DISH),
});

export const researchPlanSchema = z.object({
  items: z.array(researchPlanItemSchema).max(MAX_RESEARCH_DISHES),
  skippedDishIds: z.array(z.string().trim().min(1)),
});

export interface ResearchCandidate {
  dishId: string;
  originalName: string;
  translatedName: string | null;
  listedIngredients: string[];
  hardRestrictions: string[];
  materialReasons: string[];
  locationLabel: string | null;
}

export interface ResearchPlannerModel {
  decide(candidates: ResearchCandidate[]): Promise<unknown>;
}

export type ResearchPlan = z.infer<typeof researchPlanSchema>;

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function identifyResearchCandidates(
  menu: MenuExtraction,
  profiles: FoodProfile[],
  location: LocationContext | null = null,
): ResearchCandidate[] {
  const locationLabel = formatLocationLabel(location);
  return menu.dishes.flatMap((dish) => {
    const evaluations = profiles.map((profile) => ({
      profile,
      evaluation: evaluateHardRestrictions(profile, dish),
    }));
    const materialEvaluations = evaluations.filter(({ evaluation }) =>
      ["needs_confirmation", "insufficient_information"].includes(
        evaluation.status,
      ),
    );

    if (materialEvaluations.length === 0) {
      return [];
    }

    return [
      {
        dishId: dish.id,
        originalName: dish.originalName,
        translatedName: dish.translatedName,
        listedIngredients: dish.listedIngredients,
        hardRestrictions: unique(
          materialEvaluations.flatMap(({ profile }) => [
            ...profile.dietaryRequirements,
            ...profile.allergies.map((allergy) => `${allergy} allergy`),
          ]),
        ),
        materialReasons: unique(
          materialEvaluations.flatMap(({ evaluation }) => [
            ...evaluation.reasons,
            ...evaluation.uncertainties,
          ]),
        ),
        locationLabel,
      },
    ];
  });
}

export function formatLocationLabel(
  location: LocationContext | null | undefined,
): string | null {
  if (!location) return null;
  const parts = unique(
    [location.city, location.region, location.country].filter(
      (part): part is string => Boolean(part),
    ),
  );
  return parts.length > 0 ? parts.join(", ") : null;
}

function localizeQuery(query: string, locationLabel: string | null): string {
  if (!locationLabel) return query.trim();
  if (query.toLowerCase().includes(locationLabel.toLowerCase())) {
    return query.trim();
  }
  const suffix = ` in ${locationLabel}`;
  return `${query.trim().slice(0, 300 - suffix.length)}${suffix}`;
}

function fallbackQueries(candidate: ResearchCandidate): string[] {
  const dishName = candidate.translatedName ?? candidate.originalName;
  const restrictions = candidate.hardRestrictions.slice(0, 3).join(" ");

  return unique([
    `${dishName} common ingredients preparation ${restrictions}`.trim(),
    `${dishName} allergens dietary ingredients`.trim(),
  ])
    .map((query) => localizeQuery(query, candidate.locationLabel))
    .slice(0, MAX_SEARCHES_PER_DISH);
}

function fallbackPlan(candidates: ResearchCandidate[]): ResearchPlan {
  const selected = candidates.slice(0, MAX_RESEARCH_DISHES);

  return researchPlanSchema.parse({
    items: selected.map((candidate) => ({
      dishId: candidate.dishId,
      reason: "Material hard-restriction information is missing.",
      queries: fallbackQueries(candidate),
    })),
    skippedDishIds: candidates
      .slice(MAX_RESEARCH_DISHES)
      .map(({ dishId }) => dishId),
  });
}

export async function createResearchPlan(
  menu: MenuExtraction,
  profiles: FoodProfile[],
  model: ResearchPlannerModel,
  location: LocationContext | null = null,
): Promise<ResearchPlan> {
  const candidates = identifyResearchCandidates(menu, profiles, location);

  if (candidates.length === 0) {
    return { items: [], skippedDishIds: menu.dishes.map(({ id }) => id) };
  }

  let rawOutput: unknown;

  try {
    rawOutput = await model.decide(candidates);
  } catch {
    return fallbackPlan(candidates);
  }

  const parsed = researchPlannerOutputSchema.safeParse(rawOutput);
  if (!parsed.success) {
    return fallbackPlan(candidates);
  }

  const candidatesById = new Map(
    candidates.map((candidate) => [candidate.dishId, candidate]),
  );
  const selectedIds = new Set<string>();
  const items = parsed.data.decisions.flatMap((decision) => {
    const candidate = candidatesById.get(decision.dishId);
    if (
      !candidate ||
      !decision.shouldResearch ||
      selectedIds.has(decision.dishId) ||
      selectedIds.size >= MAX_RESEARCH_DISHES
    ) {
      return [];
    }

    const queries = unique(
      decision.queries.map((query) =>
        localizeQuery(query, candidate.locationLabel),
      ),
    )
      .filter(Boolean)
      .slice(0, MAX_SEARCHES_PER_DISH);
    selectedIds.add(decision.dishId);

    return [
      {
        dishId: decision.dishId,
        reason: decision.reason,
        queries: queries.length > 0 ? queries : fallbackQueries(candidate),
      },
    ];
  });

  return researchPlanSchema.parse({
    items,
    skippedDishIds: menu.dishes
      .map(({ id }) => id)
      .filter((dishId) => !selectedIds.has(dishId)),
  });
}
