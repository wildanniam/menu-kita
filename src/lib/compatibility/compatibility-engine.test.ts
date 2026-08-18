import { describe, expect, it, vi } from "vitest";

import { demoGroup } from "../data";
import { demoAnalysisResult } from "../fixtures";
import {
  evaluateGroupCompatibility,
  type BatchPreferenceEvaluationModel,
} from "./preferences";
import { buildRecommendations } from "./recommendations";

function completeBatchOutput() {
  return {
    evaluations: demoGroup.members.flatMap((profile) =>
      demoAnalysisResult.menu.dishes.map((dish) => ({
        profileId: profile.id,
        dishId: dish.id,
        score: 88,
        summary: "Preference fit uses the visible menu description.",
        reasons: [{ text: "Visible menu basis.", basisIds: ["menu"] }],
      })),
    ),
  };
}

describe("complete compatibility engine", () => {
  it("builds the full matrix with one batch preference call", async () => {
    const evaluateBatch = vi.fn().mockResolvedValue(completeBatchOutput());
    const model: BatchPreferenceEvaluationModel = { evaluateBatch };

    const matrix = await evaluateGroupCompatibility(
      demoGroup.members,
      demoAnalysisResult.menu.dishes,
      model,
    );

    expect(evaluateBatch).toHaveBeenCalledOnce();
    expect(matrix).toHaveLength(15);
    expect(
      matrix.find(
        ({ profileId, dishId }) =>
          profileId === "harsh" && dishId === "rendang-sapi",
      ),
    ).toMatchObject({ status: "conflict", preferenceScore: 88 });
  });

  it("fills omitted and invalid model cells with deterministic preferences", async () => {
    const output = completeBatchOutput();
    output.evaluations = [
      output.evaluations[0],
      {
        ...output.evaluations[1],
        profileId: "invented-profile",
        dishId: "invented-dish",
      },
    ];
    const model: BatchPreferenceEvaluationModel = {
      evaluateBatch: vi.fn().mockResolvedValue(output),
    };

    const matrix = await evaluateGroupCompatibility(
      demoGroup.members,
      demoAnalysisResult.menu.dishes,
      model,
    );

    expect(matrix).toHaveLength(15);
    expect(matrix.filter(({ preferenceScore }) => preferenceScore === 88)).toHaveLength(
      1,
    );
  });

  it("produces contract-valid recommendations from the evaluated matrix", async () => {
    const model: BatchPreferenceEvaluationModel = {
      evaluateBatch: vi.fn().mockResolvedValue(completeBatchOutput()),
    };
    const matrix = await evaluateGroupCompatibility(
      demoGroup.members,
      demoAnalysisResult.menu.dishes,
      model,
    );

    const recommendations = buildRecommendations(
      demoGroup.members,
      demoAnalysisResult.menu.dishes,
      matrix,
    );

    expect(recommendations.bestForEveryone?.dishId).toBe(
      "nasi-sayur-kukus",
    );
    expect(recommendations.perMember).toHaveLength(5);
  });
});
