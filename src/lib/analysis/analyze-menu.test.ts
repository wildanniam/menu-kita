import { describe, expect, it, vi } from "vitest";

import { foodProfileSchema, menuExtractionSchema } from "../schemas";
import type { AnalyzeMenuDependencies } from "./analyze-menu";
import { analyzeMenu } from "./analyze-menu";

const profiles = foodProfileSchema.array().parse([
  {
    id: "guest",
    name: "Guest",
    isCurrentUser: true,
    dietaryRequirements: ["vegan"],
    allergies: [],
    spiceTolerance: "medium",
    likes: ["vegetables"],
    dislikes: [],
  },
]);

const uncertainMenu = menuExtractionSchema.parse({
  languageCode: "id",
  languageName: "Indonesian",
  dishes: [
    {
      id: "kari-sayur",
      originalName: "Kari Sayur",
      translatedName: "Vegetable Curry",
      menuDescription: "House curry",
      listedIngredients: [],
      unreadableFields: ["ingredients"],
      evidence: [],
    },
  ],
});

function dependencies(
  overrides: Partial<AnalyzeMenuDependencies> = {},
): AnalyzeMenuDependencies {
  return {
    extractMenu: vi.fn().mockResolvedValue(uncertainMenu),
    researchPlanner: {
      decide: vi.fn().mockResolvedValue({
        decisions: [
          {
            dishId: "kari-sayur",
            shouldResearch: true,
            reason: "Ingredients are missing.",
            queries: ["vegetable curry common ingredients"],
          },
        ],
      }),
    },
    researchProvider: {
      search: vi.fn().mockResolvedValue({
        status: "success",
        dishId: "kari-sayur",
        query: "vegetable curry common ingredients",
        sources: [
          {
            title: "Culinary reference",
            url: "https://example.com/curry",
            snippet: "Some vegetable curries use fish sauce.",
          },
        ],
      }),
    },
    evidenceNormalizer: {
      normalize: vi.fn().mockResolvedValue({
        sources: [
          {
            sourceUrl: "https://example.com/curry",
            relevant: true,
            claims: ["Some vegetable curries use fish sauce."],
          },
        ],
      }),
    },
    preferenceEvaluator: {
      evaluateBatch: vi.fn().mockRejectedValue(new Error("use fallback")),
    },
    questionGenerator: {
      generate: vi.fn().mockResolvedValue({
        questions: [
          {
            dishId: "kari-sayur",
            memberIds: ["guest"],
            english: "Does the curry contain fish sauce or another animal product?",
            localized: "Apakah kari mengandung saus ikan atau produk hewani lain?",
          },
        ],
      }),
    },
    ...overrides,
  };
}

describe("analyzeMenu", () => {
  it("emits truthful stages and returns a contract-valid researched result", async () => {
    const stages: string[] = [];
    const result = await analyzeMenu(
      { imageDataUrl: "data:image/png;base64,abc", profiles },
      dependencies(),
      ({ stage }) => {
        stages.push(stage);
      },
    );

    expect(stages).toEqual([
      "reading_menu",
      "checking_evidence",
      "researching_dishes",
      "matching_profiles",
      "preparing_recommendations",
      "complete",
    ]);
    expect(result.menu.dishes[0].evidence[0]).toMatchObject({
      type: "common_usage",
      sourceUrl: "https://example.com/curry",
      restaurantConfirmed: false,
    });
    expect(result.compatibility).toHaveLength(1);
    expect(result.restaurantQuestions).toHaveLength(1);
    expect(result.recommendations.bestForEveryone?.questionIds).toEqual([
      "question-kari-sayur-1",
    ]);
  });

  it("omits the research stage when no dish needs research", async () => {
    const completeMenu = menuExtractionSchema.parse({
      languageCode: "en",
      languageName: "English",
      dishes: [
        {
          id: "tofu",
          originalName: "Tofu",
          listedIngredients: ["tofu", "vegetables"],
          evidence: [
            {
              id: "menu-tofu",
              claim: "The menu lists tofu and vegetables.",
              type: "menu_listed",
              sourceTitle: "Uploaded menu",
            },
          ],
        },
      ],
    });
    const stages: string[] = [];

    await analyzeMenu(
      { imageDataUrl: "data:image/png;base64,abc", profiles },
      dependencies({ extractMenu: vi.fn().mockResolvedValue(completeMenu) }),
      ({ stage }) => {
        stages.push(stage);
      },
    );

    expect(stages).not.toContain("researching_dishes");
  });

  it("degrades a provider failure to unresolved evidence and still completes", async () => {
    const stages: string[] = [];
    const result = await analyzeMenu(
      { imageDataUrl: "data:image/png;base64,abc", profiles },
      dependencies({
        researchProvider: {
          search: vi.fn().mockResolvedValue({
            status: "unavailable",
            dishId: "kari-sayur",
            query: "vegetable curry common ingredients",
            sources: [],
            reason: "provider_error",
          }),
        },
      }),
      ({ stage }) => {
        stages.push(stage);
      },
    );

    expect(stages.at(-1)).toBe("complete");
    expect(result.menu.dishes[0].unreadableFields).toEqual(["ingredients"]);
    expect(result.menu.dishes[0].evidence).toEqual([
      expect.objectContaining({ type: "unresolved", sourceUrl: null }),
    ]);
  });
});
