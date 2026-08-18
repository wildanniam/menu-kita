import { describe, expect, it } from "vitest";

import { demoAnalysisResult } from "../fixtures";
import { parseStoredAnalysisResult } from "./analysis-storage";

describe("parseStoredAnalysisResult", () => {
  it("restores only contract-valid results", () => {
    expect(parseStoredAnalysisResult(JSON.stringify(demoAnalysisResult))).toEqual(
      demoAnalysisResult,
    );
    expect(parseStoredAnalysisResult("not-json")).toBeNull();
    expect(parseStoredAnalysisResult(JSON.stringify({ menu: {} }))).toBeNull();
  });
});
