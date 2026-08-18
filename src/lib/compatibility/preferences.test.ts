import { describe, expect, it, vi } from "vitest";

import { demoCurrentUser, presetGroupMembers } from "../data";
import { demoAnalysisResult } from "../fixtures";
import {
  evaluateMemberDishCompatibility,
  evaluatePreferences,
  fallbackPreferenceEvaluation,
  type PreferenceEvaluationModel,
} from "./preferences";

const rendang = demoAnalysisResult.menu.dishes.find(
  ({ id }) => id === "rendang-sapi",
)!;
const vegetableRice = demoAnalysisResult.menu.dishes.find(
  ({ id }) => id === "nasi-sayur-kukus",
)!;
const harsh = presetGroupMembers.find(({ id }) => id === "harsh")!;

describe("separate preference evaluation", () => {
  it("never allows a high preference score to override a hard conflict", async () => {
    const model: PreferenceEvaluationModel = {
      evaluate: vi.fn().mockResolvedValue({
        score: 100,
        summary: "The savory profile strongly matches the member's likes.",
        reasons: [{ text: "Savory preparation.", basisIds: ["menu"] }],
      }),
    };

    const result = await evaluateMemberDishCompatibility(harsh, rendang, model);

    expect(result.preferenceScore).toBe(100);
    expect(result.status).toBe("conflict");
    expect(result.triggeredRestrictions).toContain("no beef");
  });

  it("accepts only explanations tied to menu or known evidence ids", async () => {
    const model: PreferenceEvaluationModel = {
      evaluate: vi.fn().mockResolvedValue({
        score: 95,
        summary: "Unsupported model statement.",
        reasons: [
          { text: "Invented preparation detail.", basisIds: ["invented-source"] },
        ],
      }),
    };

    const result = await evaluatePreferences(harsh, vegetableRice, model);

    expect(result.score).not.toBe(95);
    expect(result.summary).toContain("available menu wording");
  });

  it("uses deterministic preference fallback when the model is unavailable", async () => {
    const spicyDish = {
      ...vegetableRice,
      menuDescription: "Extra spicy grilled chicken with hot chili sauce.",
      listedIngredients: ["chicken", "chili"],
    };
    const model: PreferenceEvaluationModel = {
      evaluate: vi.fn().mockRejectedValue(new Error("model unavailable")),
    };

    const fallback = fallbackPreferenceEvaluation(demoCurrentUser, spicyDish);
    const result = await evaluatePreferences(demoCurrentUser, spicyDish, model);

    expect(result).toEqual(fallback);
    expect(result.score).toBeLessThan(90);
  });

  it("preserves valid evidence ids used by the preference explanation", async () => {
    const model: PreferenceEvaluationModel = {
      evaluate: vi.fn().mockResolvedValue({
        score: 82,
        summary: "The visible ingredients suggest a savory dish.",
        reasons: [
          {
            text: "Rice and vegetables support the preference estimate.",
            basisIds: ["menu-veg-rice"],
          },
        ],
      }),
    };

    const result = await evaluatePreferences(harsh, vegetableRice, model);

    expect(result.evidenceIds).toEqual(["menu-veg-rice"]);
  });
});
