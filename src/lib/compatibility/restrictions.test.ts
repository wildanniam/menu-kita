import { describe, expect, it } from "vitest";
import { z } from "zod";

import { demoCurrentUser, presetGroupMembers } from "../data";
import { demoAnalysisResult } from "../fixtures";
import { dishSchema, type Dish, type FoodProfile } from "../schemas";
import {
  evaluateHardRestrictions,
  extractCanonicalIngredients,
} from "./restrictions";

function member(name: string): FoodProfile {
  const profile = [demoCurrentUser, ...presetGroupMembers].find(
    (candidate) => candidate.name === name,
  );

  if (!profile) throw new Error(`Missing test member: ${name}`);
  return profile;
}

function dish(
  input: z.input<typeof dishSchema>,
): Dish {
  return dishSchema.parse(input);
}

describe("ingredient normalization", () => {
  it("normalizes English and Indonesian aliases", () => {
    expect(extractCanonicalIngredients("Rendang daging sapi")).toEqual(
      new Set(["beef", "meat"]),
    );
    expect(extractCanonicalIngredients("Sambal terasi dan udang")).toEqual(
      new Set(["seafood", "shellfish"]),
    );
  });

  it("does not classify plant milk as dairy", () => {
    expect(extractCanonicalIngredients("tofu in coconut milk").has("dairy")).toBe(
      false,
    );
    expect(extractCanonicalIngredients("cream and cow milk").has("dairy")).toBe(
      true,
    );
  });

  it("does not turn explicit ingredient-free wording into a conflict", () => {
    expect(extractCanonicalIngredients("pork-free vegetable noodles").has("pork")).toBe(
      false,
    );
    expect(extractCanonicalIngredients("made without dairy").has("dairy")).toBe(
      false,
    );
  });
});

describe("deterministic hard-restriction evaluation", () => {
  it("reproduces every hard-status decision in the approved demo fixture", () => {
    const profiles = [demoCurrentUser, ...presetGroupMembers];

    for (const expected of demoAnalysisResult.compatibility) {
      const profile = profiles.find(({ id }) => id === expected.profileId);
      const menuDish = demoAnalysisResult.menu.dishes.find(
        ({ id }) => id === expected.dishId,
      );

      expect(profile, `missing profile ${expected.profileId}`).toBeDefined();
      expect(menuDish, `missing dish ${expected.dishId}`).toBeDefined();
      expect(evaluateHardRestrictions(profile!, menuDish!).status).toBe(
        expected.status,
      );
    }
  });

  it("marks a menu-listed beef conflict for vegan and no-beef members", () => {
    const rendang = dish({
      id: "rendang-sapi",
      originalName: "Rendang Sapi",
      listedIngredients: ["beef", "coconut milk"],
      evidence: [
        {
          id: "menu-rendang",
          claim: "The menu lists beef and coconut milk.",
          type: "menu_listed",
        },
      ],
    });

    expect(evaluateHardRestrictions(member("Madhoolika"), rendang)).toMatchObject(
      {
        status: "conflict",
        triggeredRestrictions: ["vegan"],
        evidenceIds: ["menu-rendang"],
      },
    );
    expect(evaluateHardRestrictions(member("Harsh"), rendang)).toMatchObject({
      status: "conflict",
      triggeredRestrictions: ["no beef"],
    });
  });

  it("keeps coconut milk compatible with lactose intolerance", () => {
    const curry = dish({
      id: "coconut-curry",
      originalName: "Coconut Curry",
      menuDescription: "Vegetables cooked in coconut milk.",
      listedIngredients: ["vegetables", "coconut milk"],
    });

    expect(evaluateHardRestrictions(member("Victor"), curry).status).toBe(
      "compatible",
    );
  });

  it("treats researched common seafood as needing confirmation", () => {
    const curry = dish({
      id: "kari-sayur",
      originalName: "Kari Sayur",
      listedIngredients: ["vegetables", "coconut milk"],
      evidence: [
        {
          id: "research-seasoning",
          claim: "Some recipes use fish sauce or shrimp paste.",
          type: "common_usage",
          sourceTitle: "Culinary reference",
          sourceUrl: "https://example.com/curry",
        },
      ],
    });

    expect(evaluateHardRestrictions(member("Moomina"), curry)).toMatchObject({
      status: "needs_confirmation",
      triggeredRestrictions: ["seafood allergy"],
      evidenceIds: ["research-seasoning"],
    });
  });

  it("requires halal confirmation for meat and conflicts on listed pork", () => {
    const chicken = dish({
      id: "ayam-bakar",
      originalName: "Ayam Bakar",
      listedIngredients: ["chicken", "spices"],
    });
    const pork = dish({
      id: "pork-satay",
      originalName: "Pork Satay",
      listedIngredients: ["pork", "peanut sauce"],
    });

    expect(evaluateHardRestrictions(demoCurrentUser, chicken).status).toBe(
      "needs_confirmation",
    );
    expect(evaluateHardRestrictions(demoCurrentUser, pork).status).toBe(
      "conflict",
    );
  });

  it("supports exact custom allergens without misreading allergen-free text", () => {
    const mustardProfile = {
      ...demoCurrentUser,
      dietaryRequirements: [],
      allergies: ["mustard"],
    };
    const withMustard = dish({
      id: "mustard-salad",
      originalName: "Garden Salad",
      listedIngredients: ["lettuce", "mustard"],
    });
    const withoutMustard = dish({
      id: "mustard-free-salad",
      originalName: "Mustard-free Salad",
      listedIngredients: ["lettuce", "tomato"],
    });

    expect(evaluateHardRestrictions(mustardProfile, withMustard).status).toBe(
      "conflict",
    );
    expect(evaluateHardRestrictions(mustardProfile, withoutMustard).status).toBe(
      "compatible",
    );
  });

  it("keeps explicit conflict above unresolved evidence", () => {
    const dishWithUnknowns = dish({
      id: "beef-special",
      originalName: "Beef Special",
      listedIngredients: ["beef"],
      unreadableFields: ["small-print ingredients"],
      evidence: [
        {
          id: "unknown-sauce",
          claim: "The sauce ingredients are unresolved.",
          type: "unresolved",
        },
      ],
    });

    expect(
      evaluateHardRestrictions(member("Harsh"), dishWithUnknowns).status,
    ).toBe("conflict");
  });

  it("uses conservative statuses for sparse evidence and unknown requirements", () => {
    const sparseDish = dish({ id: "chef-special", originalName: "Chef Special" });
    const customProfile = {
      ...demoCurrentUser,
      dietaryRequirements: ["low FODMAP"],
    };

    expect(evaluateHardRestrictions(member("Harsh"), sparseDish).status).toBe(
      "insufficient_information",
    );
    expect(evaluateHardRestrictions(customProfile, sparseDish)).toMatchObject({
      status: "needs_confirmation",
      triggeredRestrictions: ["low FODMAP"],
    });
  });
});
