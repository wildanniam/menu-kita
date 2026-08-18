import { describe, expect, it, vi } from "vitest";

import { demoGroup } from "../data";
import { demoAnalysisResult } from "../fixtures";
import { menuExtractionSchema } from "../schemas";
import {
  createResearchPlan,
  identifyResearchCandidates,
  MAX_RESEARCH_DISHES,
  MAX_SEARCHES_PER_DISH,
  type ResearchPlannerModel,
} from "./research-planner";

describe("bounded research planner", () => {
  it("only offers dishes with material hard-restriction uncertainty", () => {
    const candidates = identifyResearchCandidates(
      demoAnalysisResult.menu,
      demoGroup.members,
    );

    expect(candidates.map(({ dishId }) => dishId)).toEqual([
      "rendang-sapi",
      "kari-sayur",
    ]);
    expect(candidates.some(({ dishId }) => dishId === "nasi-sayur-kukus")).toBe(
      false,
    );
  });

  it("enforces per-scan and per-dish limits even when the model over-selects", async () => {
    const menu = menuExtractionSchema.parse({
      languageCode: "en",
      languageName: "English",
      dishes: Array.from({ length: 5 }, (_, index) => ({
        id: `special-${index + 1}`,
        originalName: `Chef Special ${index + 1}`,
      })),
    });
    const model: ResearchPlannerModel = {
      decide: vi.fn().mockResolvedValue({
        decisions: menu.dishes.map((dish) => ({
          dishId: dish.id,
          shouldResearch: true,
          reason: "Ingredients are missing.",
          queries: [
            `${dish.originalName} ingredients`,
            `${dish.originalName} allergens`,
          ],
        })),
      }),
    };

    const plan = await createResearchPlan(menu, demoGroup.members, model);

    expect(plan.items).toHaveLength(MAX_RESEARCH_DISHES);
    expect(
      plan.items.every(
        ({ queries }) => queries.length <= MAX_SEARCHES_PER_DISH,
      ),
    ).toBe(true);
    expect(plan.skippedDishIds).toEqual(["special-4", "special-5"]);
  });

  it("rejects invented dish ids and respects a model decision not to search", async () => {
    const model: ResearchPlannerModel = {
      decide: vi.fn().mockResolvedValue({
        decisions: [
          {
            dishId: "invented-dish",
            shouldResearch: true,
            reason: "Not in the menu.",
            queries: ["invented dish"],
          },
          {
            dishId: "rendang-sapi",
            shouldResearch: false,
            reason: "The menu is already sufficient.",
            queries: [],
          },
          {
            dishId: "kari-sayur",
            shouldResearch: true,
            reason: "Seafood seasoning is uncertain.",
            queries: ["kari sayur fish sauce shrimp paste ingredients"],
          },
        ],
      }),
    };

    const plan = await createResearchPlan(
      demoAnalysisResult.menu,
      demoGroup.members,
      model,
    );

    expect(plan.items.map(({ dishId }) => dishId)).toEqual(["kari-sayur"]);
    expect(plan.skippedDishIds).not.toContain("invented-dish");
    expect(plan.skippedDishIds).toEqual([
      "nasi-sayur-kukus",
      "rendang-sapi",
    ]);
  });

  it("falls back to a bounded deterministic plan when model planning fails", async () => {
    const model: ResearchPlannerModel = {
      decide: vi.fn().mockRejectedValue(new Error("model unavailable")),
    };

    const plan = await createResearchPlan(
      demoAnalysisResult.menu,
      demoGroup.members,
      model,
    );

    expect(plan.items.map(({ dishId }) => dishId)).toEqual([
      "rendang-sapi",
      "kari-sayur",
    ]);
    expect(plan.items.every(({ queries }) => queries.length === 2)).toBe(true);
  });

  it("adds coarse place context to candidates and fallback queries", async () => {
    const model: ResearchPlannerModel = {
      decide: vi.fn().mockRejectedValue(new Error("model unavailable")),
    };

    const plan = await createResearchPlan(
      demoAnalysisResult.menu,
      demoGroup.members,
      model,
      {
        source: "browser",
        city: "Yogyakarta",
        region: "Special Region of Yogyakarta",
        country: "Indonesia",
        countryCode: "ID",
      },
    );

    expect(plan.items[0].queries.every((query) => query.includes("Yogyakarta")))
      .toBe(true);
    expect(vi.mocked(model.decide).mock.calls[0][0][0]).toMatchObject({
      locationLabel: "Yogyakarta, Special Region of Yogyakarta, Indonesia",
    });
  });

  it("keeps the original query shape when location is skipped", async () => {
    const model: ResearchPlannerModel = {
      decide: vi.fn().mockRejectedValue(new Error("model unavailable")),
    };

    const plan = await createResearchPlan(
      demoAnalysisResult.menu,
      demoGroup.members,
      model,
    );

    expect(plan.items[0].queries[0]).not.toContain(" in ");
  });
});
