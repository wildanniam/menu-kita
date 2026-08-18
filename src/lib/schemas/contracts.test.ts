import { describe, expect, it } from "vitest";
import { zodTextFormat } from "openai/helpers/zod";

import {
  analysisStreamEventSchema,
  analysisResultSchema,
  evidenceSchema,
  foodProfileSchema,
  locationContextSchema,
  menuExtractionSchema,
  reverseGeocodeRequestSchema,
  memberDishCompatibilitySchema,
} from ".";
import { buildDemoGroup, demoCurrentUser, presetGroupMembers } from "../data";
import { demoAnalysisResult, demoAnalysisStream } from "../fixtures";
import { evidenceNormalizationOutputSchema } from "../research";

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
    expect(
      evidenceSchema.safeParse({
        id: "evidence-2",
        claim: "Peanut sauce is commonly used.",
        type: "common_usage",
        sourceTitle: "Example source",
        sourceUrl: "ftp://example.com/source",
      }).success,
    ).toBe(false);
  });

  it("generates OpenAI-compatible structured-output schemas without uri format", () => {
    const formats = [
      zodTextFormat(menuExtractionSchema, "menu_extraction"),
      zodTextFormat(evidenceNormalizationOutputSchema, "research_evidence"),
    ];

    expect(JSON.stringify(formats)).not.toContain('"format":"uri"');
    expect(JSON.stringify(formats)).toContain('"pattern":"^https?');
  });

  it("accepts place-only context and rejects empty location data", () => {
    expect(
      locationContextSchema.safeParse({
        source: "browser",
        city: "Jakarta",
        region: "DKI Jakarta",
        country: "Indonesia",
        countryCode: "id",
      }).success,
    ).toBe(true);
    expect(
      locationContextSchema.safeParse({ source: "manual" }).success,
    ).toBe(false);
  });

  it("bounds coordinates only at the reverse-geocode boundary", () => {
    expect(
      reverseGeocodeRequestSchema.safeParse({ latitude: -6.2, longitude: 106.82 })
        .success,
    ).toBe(true);
    expect(
      reverseGeocodeRequestSchema.safeParse({ latitude: -100, longitude: 106.82 })
        .success,
    ).toBe(false);
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

  it("builds the approved five-person demo group", () => {
    const group = buildDemoGroup(demoCurrentUser);

    expect(presetGroupMembers).toHaveLength(4);
    expect(group.members.map(({ name }) => name)).toEqual([
      "Wildan",
      "Madhoolika",
      "Harsh",
      "Moomina",
      "Victor",
    ]);
  });

  it("keeps analysis and streamed UI fixtures contract-valid", () => {
    expect(analysisResultSchema.safeParse(demoAnalysisResult).success).toBe(true);
    expect(analysisStreamEventSchema.array().safeParse(demoAnalysisStream).success).toBe(true);
    expect(demoAnalysisStream.at(-1)?.type).toBe("result");
  });
});
