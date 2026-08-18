import { describe, expect, it, vi } from "vitest";

import { analyzeMenu } from "../analysis";
import { buildDemoGroup } from "../data";
import { demoAnalysisResult } from "../fixtures";
import {
  analysisResultSchema,
  foodProfileSchema,
  groupSchema,
} from "../schemas";

const questionnaireSubmission = {
  id: "current-user",
  name: "Demo Guest",
  dietaryRequirements: ["halal"],
  allergies: ["peanut"],
  spiceTolerance: "medium",
  likes: ["savory dishes"],
  dislikes: ["very sweet food"],
};

describe("questionnaire-to-analysis integration", () => {
  it("normalizes questionnaire data into the replaceable five-person group", () => {
    const profile = foodProfileSchema.parse(questionnaireSubmission);
    const group = buildDemoGroup(profile);

    expect(groupSchema.safeParse(group).success).toBe(true);
    expect(group.members).toHaveLength(5);
    expect(group.members[0]).toMatchObject({
      id: "current-user",
      name: "Demo Guest",
      isCurrentUser: true,
    });
    expect(group.members.filter(({ isCurrentUser }) => isCurrentUser)).toHaveLength(
      1,
    );
  });

  it("completes with deterministic fallbacks when planning, research, and models fail", async () => {
    const profile = foodProfileSchema.parse(questionnaireSubmission);
    const group = buildDemoGroup(profile);
    const emittedStages: string[] = [];
    const normalize = vi.fn();

    const result = await analyzeMenu(
      {
        imageDataUrl: "data:image/png;base64,deterministic-fixture",
        profiles: group.members,
      },
      {
        extractMenu: vi.fn().mockResolvedValue(demoAnalysisResult.menu),
        researchPlanner: {
          decide: vi.fn().mockRejectedValue(new Error("planner unavailable")),
        },
        researchProvider: {
          search: vi.fn().mockImplementation(async ({ dishId, query }) => ({
            status: "unavailable" as const,
            dishId,
            query,
            sources: [] as const,
            reason: "provider_error" as const,
          })),
        },
        evidenceNormalizer: { normalize },
        preferenceEvaluator: {
          evaluateBatch: vi
            .fn()
            .mockRejectedValue(new Error("preference model unavailable")),
        },
        questionGenerator: {
          generate: vi
            .fn()
            .mockRejectedValue(new Error("question model unavailable")),
        },
      },
      ({ stage }) => {
        emittedStages.push(stage);
      },
    );

    expect(analysisResultSchema.safeParse(result).success).toBe(true);
    expect(emittedStages).toEqual([
      "reading_menu",
      "checking_evidence",
      "researching_dishes",
      "matching_profiles",
      "preparing_recommendations",
      "complete",
    ]);
    expect(result.compatibility).toHaveLength(
      group.members.length * demoAnalysisResult.menu.dishes.length,
    );
    expect(
      result.compatibility.find(
        ({ profileId, dishId }) =>
          profileId === "madhoolika" && dishId === "rendang-sapi",
      )?.status,
    ).toBe("conflict");
    expect(
      result.menu.dishes.some((dish) =>
        dish.evidence.some(({ type }) => type === "unresolved"),
      ),
    ).toBe(true);
    expect(result.recommendations.perMember).toHaveLength(group.members.length);
    expect(normalize).not.toHaveBeenCalled();
  });
});
