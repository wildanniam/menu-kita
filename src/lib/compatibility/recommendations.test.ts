import { describe, expect, it } from "vitest";

import { demoGroup } from "../data";
import { demoAnalysisResult } from "../fixtures";
import { memberDishCompatibilitySchema } from "../schemas";
import {
  buildRecommendations,
  RecommendationInputError,
} from "./recommendations";

describe("group and member recommendation ranking", () => {
  it("selects the fully compatible shared fixture option", () => {
    const result = buildRecommendations(
      demoGroup.members,
      demoAnalysisResult.menu.dishes,
      demoAnalysisResult.compatibility,
    );

    expect(result.bestForEveryone).toMatchObject({
      dishId: "nasi-sayur-kukus",
      requiresConfirmation: false,
    });
    expect(result.perMember).toHaveLength(5);
  });

  it("prefers fewer confirmations before a higher preference average", () => {
    const dishes = demoAnalysisResult.menu.dishes.slice(0, 2);
    const rows = demoGroup.members.flatMap((profile) => [
      memberDishCompatibilitySchema.parse({
        profileId: profile.id,
        dishId: dishes[0].id,
        status: "compatible",
        preferenceScore: 60,
        summary: "No known conflict found.",
      }),
      memberDishCompatibilitySchema.parse({
        profileId: profile.id,
        dishId: dishes[1].id,
        status: "needs_confirmation",
        preferenceScore: 100,
        summary: "Confirmation required.",
      }),
    ]);

    const result = buildRecommendations(demoGroup.members, dishes, rows);

    expect(result.bestForEveryone?.dishId).toBe(dishes[0].id);
  });

  it("never recommends a high-scoring conflict to that member", () => {
    const profiles = demoGroup.members.slice(0, 1);
    const dishes = demoAnalysisResult.menu.dishes.slice(0, 2);
    const rows = [
      memberDishCompatibilitySchema.parse({
        profileId: profiles[0].id,
        dishId: dishes[0].id,
        status: "compatible",
        preferenceScore: 40,
        summary: "No known conflict found.",
      }),
      memberDishCompatibilitySchema.parse({
        profileId: profiles[0].id,
        dishId: dishes[1].id,
        status: "conflict",
        preferenceScore: 100,
        summary: "Known hard conflict.",
      }),
    ];

    const result = buildRecommendations(profiles, dishes, rows);

    expect(result.perMember[0].dishId).toBe(dishes[0].id);
  });

  it("returns individual fallbacks when every dish conflicts with someone", () => {
    const profiles = demoGroup.members.slice(0, 2);
    const dishes = demoAnalysisResult.menu.dishes.slice(0, 2);
    const rows = [
      memberDishCompatibilitySchema.parse({
        profileId: profiles[0].id,
        dishId: dishes[0].id,
        status: "compatible",
        preferenceScore: 80,
        summary: "No known conflict found.",
      }),
      memberDishCompatibilitySchema.parse({
        profileId: profiles[1].id,
        dishId: dishes[0].id,
        status: "conflict",
        preferenceScore: 90,
        summary: "Known conflict.",
      }),
      memberDishCompatibilitySchema.parse({
        profileId: profiles[0].id,
        dishId: dishes[1].id,
        status: "conflict",
        preferenceScore: 90,
        summary: "Known conflict.",
      }),
      memberDishCompatibilitySchema.parse({
        profileId: profiles[1].id,
        dishId: dishes[1].id,
        status: "compatible",
        preferenceScore: 80,
        summary: "No known conflict found.",
      }),
    ];

    const result = buildRecommendations(profiles, dishes, rows);

    expect(result.bestForEveryone).toBeNull();
    expect(result.noSharedDishReason).not.toBeNull();
    expect(result.perMember.map(({ dishId }) => dishId)).toEqual([
      dishes[0].id,
      dishes[1].id,
    ]);
  });

  it("rejects an incomplete compatibility matrix", () => {
    expect(() =>
      buildRecommendations(
        demoGroup.members,
        demoAnalysisResult.menu.dishes,
        demoAnalysisResult.compatibility.slice(1),
      ),
    ).toThrow(RecommendationInputError);
  });
});
