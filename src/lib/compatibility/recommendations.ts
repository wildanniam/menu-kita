import {
  recommendationResultSchema,
  type Dish,
  type FoodProfile,
  type MemberDishCompatibility,
  type RecommendationResult,
} from "../schemas";

export class RecommendationInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecommendationInputError";
  }
}

interface RankedDish {
  dish: Dish;
  rows: MemberDishCompatibility[];
  conflicts: number;
  confirmations: number;
  insufficient: number;
  averagePreference: number;
}

const MEMBER_STATUS_RANK: Record<MemberDishCompatibility["status"], number> = {
  compatible: 0,
  needs_confirmation: 1,
  insufficient_information: 2,
  conflict: 3,
};

function compatibilityKey(profileId: string, dishId: string): string {
  return `${profileId}\u0000${dishId}`;
}

function buildCompatibilityIndex(
  profiles: FoodProfile[],
  dishes: Dish[],
  compatibility: MemberDishCompatibility[],
): Map<string, MemberDishCompatibility> {
  const expected = new Set(
    profiles.flatMap((profile) =>
      dishes.map((dish) => compatibilityKey(profile.id, dish.id)),
    ),
  );
  const index = new Map<string, MemberDishCompatibility>();

  for (const row of compatibility) {
    const key = compatibilityKey(row.profileId, row.dishId);
    if (!expected.has(key)) {
      throw new RecommendationInputError(
        `Compatibility references an unknown profile or dish: ${row.profileId}/${row.dishId}`,
      );
    }
    if (index.has(key)) {
      throw new RecommendationInputError(
        `Duplicate compatibility row: ${row.profileId}/${row.dishId}`,
      );
    }
    index.set(key, row);
  }

  const missing = [...expected].filter((key) => !index.has(key));
  if (missing.length > 0) {
    throw new RecommendationInputError(
      "A recommendation requires one compatibility result for every member and dish.",
    );
  }

  return index;
}

function rankDishes(
  profiles: FoodProfile[],
  dishes: Dish[],
  index: Map<string, MemberDishCompatibility>,
): RankedDish[] {
  return dishes
    .map((dish) => {
      const rows = profiles.map(
        (profile) => index.get(compatibilityKey(profile.id, dish.id))!,
      );
      const averagePreference = Math.round(
        rows.reduce((total, row) => total + row.preferenceScore, 0) /
          rows.length,
      );

      return {
        dish,
        rows,
        conflicts: rows.filter(({ status }) => status === "conflict").length,
        confirmations: rows.filter(
          ({ status }) => status === "needs_confirmation",
        ).length,
        insufficient: rows.filter(
          ({ status }) => status === "insufficient_information",
        ).length,
        averagePreference,
      };
    })
    .sort(
      (left, right) =>
        left.conflicts - right.conflicts ||
        left.confirmations - right.confirmations ||
        left.insufficient - right.insufficient ||
        right.averagePreference - left.averagePreference ||
        left.dish.originalName.localeCompare(right.dish.originalName),
    );
}

function memberRecommendationReason(row: MemberDishCompatibility): string {
  if (row.status === "compatible") {
    return "No known hard conflict was found in the available information, and this is the member's highest-ranked option.";
  }
  if (row.status === "needs_confirmation") {
    return "This is the best available option for the member, but material details still need restaurant confirmation.";
  }
  return "This is the best available option, but the menu information remains insufficient.";
}

export function buildRecommendations(
  profiles: FoodProfile[],
  dishes: Dish[],
  compatibility: MemberDishCompatibility[],
): RecommendationResult {
  if (profiles.length === 0 || dishes.length === 0) {
    throw new RecommendationInputError(
      "Profiles and dishes are required to build recommendations.",
    );
  }

  const index = buildCompatibilityIndex(profiles, dishes, compatibility);
  const ranked = rankDishes(profiles, dishes, index);
  const shared = ranked.find(({ conflicts }) => conflicts === 0) ?? null;
  const perMember = profiles.map((profile) => {
    const candidates = dishes
      .map((dish) => index.get(compatibilityKey(profile.id, dish.id))!)
      .filter(({ status }) => status !== "conflict")
      .sort(
        (left, right) =>
          MEMBER_STATUS_RANK[left.status] - MEMBER_STATUS_RANK[right.status] ||
          right.preferenceScore - left.preferenceScore ||
          left.dishId.localeCompare(right.dishId),
      );
    const best = candidates[0];

    return best
      ? {
          profileId: profile.id,
          dishId: best.dishId,
          reason: memberRecommendationReason(best),
        }
      : {
          profileId: profile.id,
          dishId: null,
          reason:
            "Every analyzed dish has a known hard conflict for this member.",
        };
  });

  return recommendationResultSchema.parse({
    bestForEveryone: shared
      ? {
          dishId: shared.dish.id,
          memberIds: profiles.map(({ id }) => id),
          reason:
            shared.confirmations + shared.insufficient === 0
              ? "No known hard conflict was found for any member, and this dish has the strongest group fit among fully evaluated options."
              : "No known hard conflict was found for any member, and this dish minimizes confirmation burden before preference fit.",
          requiresConfirmation:
            shared.confirmations > 0 || shared.insufficient > 0,
          questionIds: [],
        }
      : null,
    perMember,
    noSharedDishReason: shared
      ? null
      : "Every analyzed dish has a known hard conflict for at least one group member.",
  });
}
