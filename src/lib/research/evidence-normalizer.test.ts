import { describe, expect, it, vi } from "vitest";

import { dishSchema } from "../schemas";
import {
  normalizeResearchEvidence,
  type EvidenceNormalizationModel,
} from "./evidence-normalizer";

const curry = dishSchema.parse({
  id: "kari-sayur",
  originalName: "Kari Sayur",
  translatedName: "Vegetable Curry",
  listedIngredients: ["vegetables", "coconut milk"],
  evidence: [
    {
      id: "menu-curry",
      claim: "The menu lists vegetables and coconut milk.",
      type: "menu_listed",
      sourceTitle: "Uploaded menu",
    },
  ],
});

const successfulResearch = {
  status: "success" as const,
  dishId: "kari-sayur",
  query: "kari sayur ingredients",
  sources: [
    {
      title: "Culinary reference",
      url: "https://example.com/curry",
      snippet: "Fish sauce or shrimp paste may be used in some versions.",
      score: 0.9,
    },
  ],
};

describe("research evidence normalization", () => {
  it("preserves menu evidence and exact Tavily source provenance", async () => {
    const model: EvidenceNormalizationModel = {
      normalize: vi.fn().mockResolvedValue({
        sources: [
          {
            sourceUrl: "https://example.com/curry",
            relevant: true,
            claims: ["Some versions commonly use fish sauce or shrimp paste."],
          },
        ],
      }),
    };

    const result = await normalizeResearchEvidence(
      curry,
      successfulResearch,
      model,
    );

    expect(result.evidence[0].type).toBe("menu_listed");
    expect(result.evidence[1]).toMatchObject({
      type: "common_usage",
      sourceTitle: "Culinary reference",
      sourceUrl: "https://example.com/curry",
      restaurantConfirmed: false,
    });
  });

  it("rejects model-invented source URLs", async () => {
    const model: EvidenceNormalizationModel = {
      normalize: vi.fn().mockResolvedValue({
        sources: [
          {
            sourceUrl: "https://invented.example/recipe",
            relevant: true,
            claims: ["An unsupported claim."],
          },
        ],
      }),
    };

    const result = await normalizeResearchEvidence(
      curry,
      successfulResearch,
      model,
    );

    expect(result.evidence.at(-1)).toMatchObject({
      type: "unresolved",
      sourceUrl: null,
    });
  });

  it("degrades failed research and failed normalization to unresolved evidence", async () => {
    const model: EvidenceNormalizationModel = {
      normalize: vi.fn().mockRejectedValue(new Error("model unavailable")),
    };
    const unavailable = {
      status: "unavailable" as const,
      dishId: "kari-sayur",
      query: "kari sayur ingredients",
      sources: [] as [],
      reason: "provider_error" as const,
    };

    const providerFailure = await normalizeResearchEvidence(
      curry,
      unavailable,
      model,
    );
    const modelFailure = await normalizeResearchEvidence(
      curry,
      successfulResearch,
      model,
    );

    expect(providerFailure.evidence.at(-1)?.type).toBe("unresolved");
    expect(modelFailure.evidence.at(-1)?.type).toBe("unresolved");
    expect(model.normalize).toHaveBeenCalledOnce();
  });
});
