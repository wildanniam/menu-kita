import { describe, expect, it, vi } from "vitest";

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
    );

    expect(candidates.map(({ dishId }) => dishId)).toEqual([
      "rendang-sapi",
      "kari-sayur",
    ]);
    expect(candidates.find(({ dishId }) => dishId === "kari-sayur")).toMatchObject(
      { memberIds: ["madhoolika", "moomina"] },
    );
  });

  it("returns English and detected-language questions for a non-English menu", async () => {
    const model: RestaurantQuestionModel = {
      generate: vi.fn().mockImplementation(({ candidates }) => ({
        questions: candidates.map(
          ({ dishId, dishName, memberIds }: (typeof candidates)[number]) => ({
            dishId,
            memberIds,
            english: `Does ${dishName} contain a restricted ingredient?`,
            localized: `Apakah ${dishName} mengandung bahan yang dibatasi?`,
          }),
        ),
      })),
    };

    const questions = await generateRestaurantQuestions(
      demoAnalysisResult.menu,
      demoAnalysisResult.compatibility,
      model,
    );

    expect(questions).toHaveLength(2);
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
            dishId: "rendang-sapi",
            memberIds: ["wildan"],
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
      model,
    );

    expect(questions[0].localized).toBeNull();
  });

  it("falls back safely when model output is unavailable or references wrong members", async () => {
    const model: RestaurantQuestionModel = {
      generate: vi.fn().mockResolvedValue({
        questions: [
          {
            dishId: "kari-sayur",
            memberIds: ["invented-member"],
            english: "Unsupported question",
            localized: "Pertanyaan tidak didukung",
          },
        ],
      }),
    };

    const questions = await generateRestaurantQuestions(
      demoAnalysisResult.menu,
      demoAnalysisResult.compatibility,
      model,
    );
    const curryQuestion = questions.find(
      ({ dishId }) => dishId === "kari-sayur",
    );

    expect(curryQuestion?.memberIds).toEqual(["madhoolika", "moomina"]);
    expect(curryQuestion?.english).not.toBe("Unsupported question");
  });
});
