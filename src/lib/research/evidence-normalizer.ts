import { z } from "zod";

import { dishSchema, evidenceSchema, type Dish, type Evidence } from "../schemas";
import type { DishResearchResult } from "./dish-research";

const normalizedSourceDecisionSchema = z.object({
  sourceUrl: z.url(),
  relevant: z.boolean(),
  claims: z.array(z.string().trim().min(1).max(500)).max(3),
});

export const evidenceNormalizationOutputSchema = z.object({
  sources: z.array(normalizedSourceDecisionSchema),
});

export interface EvidenceNormalizationInput {
  dish: {
    id: string;
    originalName: string;
    translatedName: string | null;
    listedIngredients: string[];
  };
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}

export interface EvidenceNormalizationModel {
  normalize(input: EvidenceNormalizationInput): Promise<unknown>;
}

function unresolvedEvidence(dishId: string, claim: string): Evidence {
  return evidenceSchema.parse({
    id: `unresolved-${dishId}-research`,
    claim,
    type: "unresolved",
    sourceTitle: null,
    sourceUrl: null,
    restaurantConfirmed: false,
  });
}

function appendUniqueEvidence(dish: Dish, evidence: Evidence[]): Dish {
  const seenIds = new Set(dish.evidence.map(({ id }) => id));
  const additions = evidence.filter(({ id }) => {
    if (seenIds.has(id)) return false;
    seenIds.add(id);
    return true;
  });

  return dishSchema.parse({ ...dish, evidence: [...dish.evidence, ...additions] });
}

export async function normalizeResearchEvidence(
  dish: Dish,
  research: DishResearchResult,
  model: EvidenceNormalizationModel,
): Promise<Dish> {
  if (research.status === "unavailable") {
    return appendUniqueEvidence(dish, [
      unresolvedEvidence(
        dish.id,
        "Web research did not return usable evidence; relevant ingredients remain unresolved.",
      ),
    ]);
  }

  let rawOutput: unknown;
  try {
    rawOutput = await model.normalize({
      dish: {
        id: dish.id,
        originalName: dish.originalName,
        translatedName: dish.translatedName,
        listedIngredients: dish.listedIngredients,
      },
      sources: research.sources.map(({ title, url, snippet }) => ({
        title,
        url,
        snippet,
      })),
    });
  } catch {
    return appendUniqueEvidence(dish, [
      unresolvedEvidence(
        dish.id,
        "Research sources could not be normalized; relevant ingredients remain unresolved.",
      ),
    ]);
  }

  const parsed = evidenceNormalizationOutputSchema.safeParse(rawOutput);
  if (!parsed.success) {
    return appendUniqueEvidence(dish, [
      unresolvedEvidence(
        dish.id,
        "Research sources produced invalid evidence; relevant ingredients remain unresolved.",
      ),
    ]);
  }

  const sourceByUrl = new Map(research.sources.map((source) => [source.url, source]));
  const claims = parsed.data.sources.flatMap((decision) => {
    const source = sourceByUrl.get(decision.sourceUrl);
    if (!source || !decision.relevant) return [];

    return decision.claims.map((claim) => ({ source, claim }));
  });
  const seenClaims = new Set<string>();
  const evidence = claims.flatMap(({ source, claim }, index) => {
    const normalizedClaim = claim.trim().toLowerCase();
    if (!normalizedClaim || seenClaims.has(normalizedClaim)) return [];
    seenClaims.add(normalizedClaim);

    return [
      evidenceSchema.parse({
        id: `research-${dish.id}-${index + 1}`,
        claim,
        type: "common_usage",
        sourceTitle: source.title,
        sourceUrl: source.url,
        restaurantConfirmed: false,
      }),
    ];
  });

  if (evidence.length === 0) {
    return appendUniqueEvidence(dish, [
      unresolvedEvidence(
        dish.id,
        "No relevant researched claim could be verified from the returned sources.",
      ),
    ]);
  }

  return appendUniqueEvidence(dish, evidence);
}
