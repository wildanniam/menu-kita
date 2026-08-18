import { describe, expect, it, vi } from "vitest";

import { demoGroup } from "../data/demo-group";
import { demoAnalysisResult } from "../fixtures";
import {
  generateRestaurantQuestions,
  identifyQuestionCandidates,
  type RestaurantQuestionModel,
} from "./restaurant-questions";

describe("material restaurant questions", () => {
  it("creates candidates only for material needs-confirmation rows", () => {
    const candidates = identifyQuestionCandidates(
      demoAnalysisResult.menu,
      demoAnalysisResult.compatibility,
      demoGroup.members,
    );

    expect(candidates).toHaveLength(3);
    expect(candidates.map(({ candidateId }) => candidateId)).toEqual([
      "rendang-sapi:wildan",
      "kari-sayur:madhoolika",
      "kari-sayur:moomina",
    ]);
    expect(candidates.find(({ candidateId }) => candidateId === "kari-sayur:madhoolika")).toMatchObject({
      memberId: "madhoolika",
      memberName: "Madhoolika",
      triggeredRestrictions: ["vegan"],
    });
    expect(candidates.some(({ memberId }) => memberId === "harsh")).toBe(false);
  });

  it("returns English and detected-language questions for a non-English menu", async () => {
    const model: RestaurantQuestionModel = {
      generate: vi.fn().mockImplementation(({ candidates }) => ({
        questions: candidates.map(
          ({ candidateId, dishId, dishName, memberId, memberName }: (typeof candidates)[number]) => ({
            candidateId,
            dishId,
            memberId,
            english: `For ${memberName}, does ${dishName} contain a restricted ingredient?`,
            localized: `Untuk ${memberName}, apakah ${dishName} mengandung bahan yang dibatasi?`,
          }),
        ),
      })),
    };

    const questions = await generateRestaurantQuestions(
      demoAnalysisResult.menu,
      demoAnalysisResult.compatibility,
      demoGroup.members,
      model,
    );

    expect(questions).toHaveLength(3);
    expect(questions.every(({ memberIds }) => memberIds.length === 1)).toBe(true);
    expect(questions.every(({ localized }) => Boolean(localized))).toBe(true);
    expect(questions.every(({ languageCode }) => languageCode === "id")).toBe(
      true,
    );
  });

  it("does not duplicate translation for an English menu", async () => {
    const model: RestaurantQuestionModel = {
      generate: vi.fn().mockResolvedValue({
        questions: [
          {
            candidateId: "rendang-sapi:wildan",
            dishId: "rendang-sapi",
            memberId: "wildan",
            english: "Is the beef halal-certified and prepared without alcohol?",
            localized: "Duplicate text",
          },
        ],
      }),
    };
    const englishMenu = {
      ...demoAnalysisResult.menu,
      languageCode: "en",
      languageName: "English",
    };

    const questions = await generateRestaurantQuestions(
      englishMenu,
      demoAnalysisResult.compatibility,
      demoGroup.members,
      model,
    );

    expect(questions[0].localized).toBeNull();
  });

  it("falls back safely when model output is unavailable or references wrong members", async () => {
    const model: RestaurantQuestionModel = {
      generate: vi.fn().mockResolvedValue({
        questions: [
          {
            candidateId: "kari-sayur:madhoolika",
            dishId: "kari-sayur",
            memberId: "invented-member",
            english: "Unsupported question",
            localized: "Pertanyaan tidak didukung",
          },
        ],
      }),
    };

    const questions = await generateRestaurantQuestions(
      demoAnalysisResult.menu,
      demoAnalysisResult.compatibility,
      demoGroup.members,
      model,
    );
    const curryQuestion = questions.find(
      ({ id }) => id === "question-kari-sayur-madhoolika",
    );

    expect(curryQuestion?.memberIds).toEqual(["madhoolika"]);
    expect(curryQuestion?.english).not.toBe("Unsupported question");
    expect(curryQuestion?.english).toContain("Madhoolika");
    expect(curryQuestion?.english).toContain("vegan");
  });
});
