import { z } from "zod";

import {
  restaurantQuestionSchema,
  type MemberDishCompatibility,
  type MenuExtraction,
  type RestaurantQuestion,
} from "../schemas";

const questionDraftSchema = z.object({
  dishId: z.string().trim().min(1),
  memberIds: z.array(z.string().trim().min(1)).min(1),
  english: z.string().trim().min(1).max(500),
  localized: z.string().trim().min(1).max(500).nullable(),
});

export const questionGenerationOutputSchema = z.object({
  questions: z.array(questionDraftSchema),
});

export interface QuestionCandidate {
  dishId: string;
  dishName: string;
  memberIds: string[];
  triggeredRestrictions: string[];
  uncertainties: string[];
}

export interface RestaurantQuestionModel {
  generate(input: {
    languageCode: string;
    languageName: string;
    candidates: QuestionCandidate[];
  }): Promise<unknown>;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function identifyQuestionCandidates(
  menu: MenuExtraction,
  compatibility: MemberDishCompatibility[],
): QuestionCandidate[] {
  return menu.dishes.flatMap((dish) => {
    const relevant = compatibility.filter(
      (row) =>
        row.dishId === dish.id &&
        row.status === "needs_confirmation" &&
        row.uncertainties.length > 0,
    );

    if (relevant.length === 0) return [];

    return [
      {
        dishId: dish.id,
        dishName: dish.translatedName ?? dish.originalName,
        memberIds: unique(relevant.map(({ profileId }) => profileId)),
        triggeredRestrictions: unique(
          relevant.flatMap(({ triggeredRestrictions }) => triggeredRestrictions),
        ),
        uncertainties: unique(
          relevant.flatMap(({ uncertainties }) => uncertainties),
        ),
      },
    ];
  });
}

function fallbackQuestion(
  candidate: QuestionCandidate,
  languageCode: string,
): Pick<RestaurantQuestion, "english" | "localized"> {
  const details = unique([
    ...candidate.triggeredRestrictions,
    ...candidate.uncertainties,
  ]).join(", ");
  const english = `Could you confirm whether ${candidate.dishName} contains or uses anything related to ${details}?`;

  return {
    english,
    localized:
      languageCode.toLowerCase() === "id"
        ? `Bisa dikonfirmasi apakah ${candidate.dishName} mengandung atau menggunakan sesuatu yang berkaitan dengan ${details}?`
        : null,
  };
}

export async function generateRestaurantQuestions(
  menu: MenuExtraction,
  compatibility: MemberDishCompatibility[],
  model: RestaurantQuestionModel,
): Promise<RestaurantQuestion[]> {
  const candidates = identifyQuestionCandidates(menu, compatibility);
  if (candidates.length === 0) return [];

  let parsedOutput: z.infer<typeof questionGenerationOutputSchema> | undefined;
  try {
    const rawOutput = await model.generate({
      languageCode: menu.languageCode,
      languageName: menu.languageName,
      candidates,
    });
    const parsed = questionGenerationOutputSchema.safeParse(rawOutput);
    if (parsed.success) parsedOutput = parsed.data;
  } catch {
    parsedOutput = undefined;
  }

  const draftsByDish = new Map(
    (parsedOutput?.questions ?? []).map((question) => [
      question.dishId,
      question,
    ]),
  );
  const isEnglish = menu.languageCode.toLowerCase().startsWith("en");

  return candidates.map((candidate, index) => {
    const draft = draftsByDish.get(candidate.dishId);
    const allowedMemberIds = new Set(candidate.memberIds);
    const validDraft =
      draft &&
      draft.memberIds.every((memberId) => allowedMemberIds.has(memberId)) &&
      (isEnglish || Boolean(draft.localized))
        ? draft
        : undefined;
    const fallback = fallbackQuestion(candidate, menu.languageCode);

    return restaurantQuestionSchema.parse({
      id: `question-${candidate.dishId}-${index + 1}`,
      dishId: candidate.dishId,
      memberIds: validDraft?.memberIds ?? candidate.memberIds,
      english: validDraft?.english ?? fallback.english,
      localized: isEnglish
        ? null
        : validDraft?.localized ?? fallback.localized,
      languageCode: menu.languageCode,
      languageName: menu.languageName,
    });
  });
}
