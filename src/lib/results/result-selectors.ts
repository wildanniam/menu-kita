import type {
  AnalysisResult,
  MemberDishCompatibility,
  MemberRecommendation,
  RestaurantQuestion,
} from "../schemas";

export const ALL_MEMBERS_SELECTION = "all" as const;
export type ResultSelection = string | typeof ALL_MEMBERS_SELECTION;

const STATUS_PRIORITY: Record<MemberDishCompatibility["status"], number> = {
  conflict: 0,
  needs_confirmation: 1,
  insufficient_information: 2,
  compatible: 3,
};

export function getMemberRecommendation(
  result: AnalysisResult,
  profileId: string,
): MemberRecommendation | undefined {
  return result.recommendations.perMember.find(
    (recommendation) => recommendation.profileId === profileId,
  );
}

export function getMemberCompatibility(
  result: AnalysisResult,
  profileId: string,
): MemberDishCompatibility[] {
  const menuOrder = new Map(
    result.menu.dishes.map((dish, index) => [dish.id, index]),
  );
  const recommendation = getMemberRecommendation(result, profileId);

  return result.compatibility
    .filter((row) => row.profileId === profileId)
    .toSorted((left, right) => {
      const leftRecommended = left.dishId === recommendation?.dishId ? 0 : 1;
      const rightRecommended = right.dishId === recommendation?.dishId ? 0 : 1;
      if (leftRecommended !== rightRecommended) {
        return leftRecommended - rightRecommended;
      }

      const statusDifference =
        STATUS_PRIORITY[left.status] - STATUS_PRIORITY[right.status];
      if (statusDifference !== 0) return statusDifference;

      return (
        (menuOrder.get(left.dishId) ?? Number.MAX_SAFE_INTEGER) -
        (menuOrder.get(right.dishId) ?? Number.MAX_SAFE_INTEGER)
      );
    });
}

export function getRowsByDish(
  result: AnalysisResult,
): Map<string, MemberDishCompatibility[]> {
  const rows = new Map<string, MemberDishCompatibility[]>();
  for (const row of result.compatibility) {
    rows.set(row.dishId, [...(rows.get(row.dishId) ?? []), row]);
  }
  return rows;
}

export function getQuestionsForSelection(
  result: AnalysisResult,
  selection: ResultSelection,
): RestaurantQuestion[] {
  if (selection === ALL_MEMBERS_SELECTION) {
    return result.restaurantQuestions;
  }

  return result.restaurantQuestions.filter((question) =>
    question.memberIds.includes(selection),
  );
}
