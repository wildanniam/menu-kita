import { describe, expect, it } from "vitest";

import { demoAnalysisResult } from "../fixtures/demo-analysis";

import {
  ALL_MEMBERS_SELECTION,
  getMemberCompatibility,
  getMemberRecommendation,
  getQuestionsForSelection,
  getRowsByDish,
} from "./result-selectors";

describe("result presentation selectors", () => {
  it("puts the selected member's recommended dish first", () => {
    const recommendation = getMemberRecommendation(demoAnalysisResult, "wildan");
    const rows = getMemberCompatibility(demoAnalysisResult, "wildan");

    expect(recommendation?.dishId).toBe("nasi-sayur-kukus");
    expect(rows[0]?.dishId).toBe(recommendation?.dishId);
    expect(rows.every((row) => row.profileId === "wildan")).toBe(true);
  });

  it("keeps confirmation questions scoped to referenced members", () => {
    expect(getQuestionsForSelection(demoAnalysisResult, "madhoolika")).toHaveLength(1);
    expect(getQuestionsForSelection(demoAnalysisResult, "wildan")).toHaveLength(0);
    expect(
      getQuestionsForSelection(demoAnalysisResult, ALL_MEMBERS_SELECTION),
    ).toEqual(demoAnalysisResult.restaurantQuestions);
  });

  it("groups the complete compatibility matrix by dish", () => {
    const rows = getRowsByDish(demoAnalysisResult);

    expect(rows.get("nasi-sayur-kukus")).toHaveLength(5);
    expect(rows.get("rendang-sapi")).toHaveLength(5);
    expect(rows.get("kari-sayur")).toHaveLength(5);
  });
});
