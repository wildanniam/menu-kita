import { z } from "zod";

import {
  restaurantQuestionSchema,
  type FoodProfile,
  type MemberDishCompatibility,
  type MenuExtraction,
  type RestaurantQuestion,
} from "../schemas";

const questionDraftSchema = z.object({
  candidateId: z.string().trim().min(1),
  dishId: z.string().trim().min(1),
  memberId: z.string().trim().min(1),
  english: z.string().trim().min(1).max(500),
  localized: z.string().trim().min(1).max(500).nullable(),
});

export const questionGenerationOutputSchema = z.object({
  questions: z.array(questionDraftSchema),
});

export interface QuestionCandidate {
  candidateId: string;
  dishId: string;
  dishName: string;
  memberId: string;
  memberName: string;
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
  profiles: FoodProfile[],
): QuestionCandidate[] {
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

  return menu.dishes.flatMap((dish) => {
    const relevant = compatibility.filter(
      (row) =>
        row.dishId === dish.id &&
        row.status === "needs_confirmation" &&
        row.uncertainties.length > 0,
    );

    return relevant.flatMap((row) => {
      const profile = profilesById.get(row.profileId);
      if (!profile) return [];

      const profileRestrictions = [
        ...profile.dietaryRequirements,
        ...profile.allergies.map((allergy) => `${allergy} allergy`),
      ];

      return [{
        candidateId: `${dish.id}:${profile.id}`,
        dishId: dish.id,
        dishName: dish.translatedName ?? dish.originalName,
        memberId: profile.id,
        memberName: profile.name,
        triggeredRestrictions: unique(
          row.triggeredRestrictions.length > 0
            ? row.triggeredRestrictions
            : profileRestrictions,
        ),
        uncertainties: unique(row.uncertainties),
      }];
    });
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
  const english = `For ${candidate.memberName}, could you confirm whether ${candidate.dishName} contains or uses anything related to ${details}?`;

  return {
    english,
    localized:
      languageCode.toLowerCase() === "id"
        ? `Untuk ${candidate.memberName}, bisa dikonfirmasi apakah ${candidate.dishName} mengandung atau menggunakan sesuatu yang berkaitan dengan ${details}?`
        : null,
  };
}

export async function generateRestaurantQuestions(
  menu: MenuExtraction,
  compatibility: MemberDishCompatibility[],
  profiles: FoodProfile[],
  model: RestaurantQuestionModel,
): Promise<RestaurantQuestion[]> {
  const candidates = identifyQuestionCandidates(menu, compatibility, profiles);
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

  const draftsByCandidate = new Map(
    (parsedOutput?.questions ?? []).map((question) => [
      question.candidateId,
      question,
    ]),
  );
  const isEnglish = menu.languageCode.toLowerCase().startsWith("en");

  return candidates.map((candidate) => {
    const draft = draftsByCandidate.get(candidate.candidateId);
    const validDraft =
      draft &&
      draft.candidateId === candidate.candidateId &&
      draft.dishId === candidate.dishId &&
      draft.memberId === candidate.memberId &&
      (isEnglish || Boolean(draft.localized))
        ? draft
        : undefined;
    const fallback = fallbackQuestion(candidate, menu.languageCode);

    return restaurantQuestionSchema.parse({
      id: `question-${candidate.dishId}-${candidate.memberId}`,
      dishId: candidate.dishId,
      memberIds: [candidate.memberId],
      english: validDraft?.english ?? fallback.english,
      localized: isEnglish
        ? null
        : validDraft?.localized ?? fallback.localized,
      languageCode: menu.languageCode,
      languageName: menu.languageName,
    });
  });
}
