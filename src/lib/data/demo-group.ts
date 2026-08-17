import {
  foodProfileSchema,
  groupSchema,
  type FoodProfile,
  type Group,
} from "../schemas";

export const presetGroupMembers = foodProfileSchema.array().parse([
  {
    id: "madhoolika",
    name: "Madhoolika",
    dietaryRequirements: ["vegan"],
    allergies: [],
    spiceTolerance: "mild",
    likes: ["vegetable curries", "coconut-based dishes"],
    dislikes: ["very spicy food"],
  },
  {
    id: "harsh",
    name: "Harsh",
    dietaryRequirements: ["no beef"],
    allergies: [],
    spiceTolerance: "medium",
    likes: ["grilled food", "savory dishes"],
    dislikes: ["very sweet dishes"],
  },
  {
    id: "moomina",
    name: "Moomina",
    dietaryRequirements: [],
    allergies: ["seafood"],
    spiceTolerance: "medium",
    likes: ["spiced rice", "soups"],
    dislikes: ["overly oily food"],
  },
  {
    id: "victor",
    name: "Victor",
    dietaryRequirements: ["lactose intolerant"],
    allergies: [],
    spiceTolerance: "spicy",
    likes: ["smoky flavors", "grilled dishes"],
    dislikes: ["very sweet sauces"],
  },
]);

export const demoCurrentUser = foodProfileSchema.parse({
  id: "wildan",
  name: "Wildan",
  isCurrentUser: true,
  dietaryRequirements: ["halal"],
  allergies: [],
  spiceTolerance: "medium",
  likes: ["savory food", "grilled chicken"],
  dislikes: ["extremely spicy food"],
});

export function buildDemoGroup(currentUser: FoodProfile): Group {
  const normalizedCurrentUser = foodProfileSchema.parse({
    ...currentUser,
    isCurrentUser: true,
  });

  return groupSchema.parse({
    id: "global-friends",
    name: "Global Friends",
    description: "Five friends finding dishes everyone can enjoy.",
    members: [normalizedCurrentUser, ...presetGroupMembers],
  });
}

export const demoGroup = buildDemoGroup(demoCurrentUser);
