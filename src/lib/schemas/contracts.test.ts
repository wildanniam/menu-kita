import { describe, expect, it } from "vitest";

import {
  analysisResultSchema,
  evidenceSchema,
  foodProfileSchema,
  memberDishCompatibilitySchema,
} from ".";

describe("MenuKita shared contracts", () => {
  it("parses a normalized food profile", () => {
    const profile = foodProfileSchema.parse({
      id: "wildan",
      name: "Wildan",
      dietaryRequirements: ["halal"],
      allergies: [],
      spiceTolerance: "medium",
      likes: ["savory"],
      dislikes: ["very spicy"],
    });

    expect(profile.isCurrentUser).toBe(false);
  });

  it("rejects preference scores outside the 0-100 range", () => {
    const result = memberDishCompatibilitySchema.safeParse({
      profileId: "wildan",
      dishId: "dish-1",
      status: "compatible",
      preferenceScore: 101,
      summary: "No known conflict found in the available information.",
    });

    expect(result.success).toBe(false);
  });

  it("requires valid source URLs for researched evidence", () => {
    const result = evidenceSchema.safeParse({
      id: "evidence-1",
      claim: "Peanut sauce is commonly used.",
      type: "common_usage",
      sourceTitle: "Example source",
      sourceUrl: "not-a-url",
    });

    expect(result.success).toBe(false);
  });

  it("parses a minimal complete analysis result", () => {
    const result = analysisResultSchema.safeParse({
      menu: {
        languageCode: "id",
        languageName: "Indonesian",
        dishes: [
          {
            id: "gado-gado",
            originalName: "Gado-gado",
            listedIngredients: ["vegetables"],
          },
        ],
      },
      compatibility: [
        {
          profileId: "wildan",
          dishId: "gado-gado",
          status: "needs_confirmation",
          preferenceScore: 80,
          summary: "The sauce ingredients still need confirmation.",
        },
      ],
      recommendations: {
        bestForEveryone: null,
        perMember: [
          {
            profileId: "wildan",
            dishId: "gado-gado",
            reason: "Best available option after confirmation.",
          },
        ],
        noSharedDishReason: "A shared option still needs confirmation.",
      },
      restaurantQuestions: [],
    });

    expect(result.success).toBe(true);
  });
});
