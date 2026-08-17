import {
  analysisResultSchema,
  analysisStreamEventSchema,
} from "../schemas";

const allMemberIds = ["wildan", "madhoolika", "harsh", "moomina", "victor"];

export const demoAnalysisResult = analysisResultSchema.parse({
  menu: {
    languageCode: "id",
    languageName: "Indonesian",
    dishes: [
      {
        id: "nasi-sayur-kukus",
        originalName: "Nasi Sayur Kukus",
        translatedName: "Steamed Vegetable Rice",
        menuDescription: "Steamed rice with tofu and mixed vegetables.",
        price: "Rp45.000",
        listedIngredients: ["rice", "tofu", "carrot", "broccoli"],
        evidence: [
          {
            id: "menu-veg-rice",
            claim: "The menu lists rice, tofu, carrot, and broccoli.",
            type: "menu_listed",
            sourceTitle: "Uploaded menu",
            restaurantConfirmed: false,
          },
        ],
      },
      {
        id: "rendang-sapi",
        originalName: "Rendang Sapi",
        translatedName: "Beef Rendang",
        menuDescription: "Slow-cooked beef in coconut milk and spices.",
        price: "Rp75.000",
        listedIngredients: ["beef", "coconut milk", "spices"],
        evidence: [
          {
            id: "menu-beef-rendang",
            claim: "The menu explicitly lists beef and coconut milk.",
            type: "menu_listed",
            sourceTitle: "Uploaded menu",
            restaurantConfirmed: false,
          },
        ],
      },
      {
        id: "kari-sayur",
        originalName: "Kari Sayur",
        translatedName: "Vegetable Curry",
        menuDescription: "Seasonal vegetables in a coconut curry.",
        price: "Rp55.000",
        listedIngredients: ["vegetables", "coconut milk", "curry spices"],
        evidence: [
          {
            id: "menu-vegetable-curry",
            claim: "The menu lists vegetables, coconut milk, and curry spices.",
            type: "menu_listed",
            sourceTitle: "Uploaded menu",
            restaurantConfirmed: false,
          },
          {
            id: "research-curry-seasoning",
            claim: "Some vegetable curry recipes use fish sauce or shrimp paste.",
            type: "common_usage",
            sourceTitle: "Example culinary reference",
            sourceUrl: "https://example.com/vegetable-curry",
            restaurantConfirmed: false,
          },
        ],
      },
    ],
  },
  compatibility: [
    ...allMemberIds.map((profileId) => ({
      profileId,
      dishId: "nasi-sayur-kukus",
      status: "compatible" as const,
      preferenceScore: profileId === "madhoolika" ? 94 : 84,
      summary: "No known conflict appears in the listed ingredients.",
      evidenceIds: ["menu-veg-rice"],
    })),
    {
      profileId: "wildan",
      dishId: "rendang-sapi",
      status: "needs_confirmation",
      preferenceScore: 78,
      summary: "The beef source and preparation need halal confirmation.",
      uncertainties: ["halal sourcing and preparation"],
      evidenceIds: ["menu-beef-rendang"],
    },
    {
      profileId: "madhoolika",
      dishId: "rendang-sapi",
      status: "conflict",
      preferenceScore: 0,
      summary: "Beef conflicts with a vegan diet.",
      triggeredRestrictions: ["vegan"],
      evidenceIds: ["menu-beef-rendang"],
    },
    {
      profileId: "harsh",
      dishId: "rendang-sapi",
      status: "conflict",
      preferenceScore: 0,
      summary: "The dish explicitly contains beef.",
      triggeredRestrictions: ["no beef"],
      evidenceIds: ["menu-beef-rendang"],
    },
    {
      profileId: "moomina",
      dishId: "rendang-sapi",
      status: "compatible",
      preferenceScore: 70,
      summary: "No seafood is listed in this dish.",
      evidenceIds: ["menu-beef-rendang"],
    },
    {
      profileId: "victor",
      dishId: "rendang-sapi",
      status: "compatible",
      preferenceScore: 86,
      summary: "Coconut milk is dairy-free and no dairy is listed.",
      evidenceIds: ["menu-beef-rendang"],
    },
    ...allMemberIds.map((profileId) => {
      const needsConfirmation = ["madhoolika", "moomina"].includes(profileId);
      return {
        profileId,
        dishId: "kari-sayur",
        status: needsConfirmation ? ("needs_confirmation" as const) : ("compatible" as const),
        preferenceScore: profileId === "madhoolika" ? 92 : 80,
        summary: needsConfirmation
          ? "The restaurant should confirm that no fish sauce or shrimp paste is used."
          : "No known conflict appears in the available evidence.",
        evidenceIds: ["menu-vegetable-curry", "research-curry-seasoning"],
        uncertainties: needsConfirmation ? ["unlisted seafood seasoning"] : [],
      };
    }),
  ],
  recommendations: {
    bestForEveryone: {
      dishId: "nasi-sayur-kukus",
      memberIds: allMemberIds,
      reason: "Its listed ingredients have no known conflict for any group member.",
      requiresConfirmation: false,
      questionIds: [],
    },
    perMember: allMemberIds.map((profileId) => ({
      profileId,
      dishId: "nasi-sayur-kukus",
      reason: "The clearest shared option based on the listed ingredients.",
    })),
    noSharedDishReason: null,
  },
  restaurantQuestions: [
    {
      id: "question-curry-seafood",
      dishId: "kari-sayur",
      memberIds: ["madhoolika", "moomina"],
      english: "Does the vegetable curry contain fish sauce, shrimp paste, or any other seafood ingredient?",
      localized: "Apakah kari sayur mengandung saus ikan, terasi, atau bahan makanan laut lainnya?",
      languageCode: "id",
      languageName: "Indonesian",
    },
  ],
});

export const demoAnalysisStream = analysisStreamEventSchema.array().parse([
  { type: "stage", stage: "reading_menu", message: "Reading the menu image" },
  { type: "stage", stage: "checking_evidence", message: "Checking listed ingredients" },
  { type: "stage", stage: "researching_dishes", message: "Researching material unknowns" },
  { type: "stage", stage: "matching_profiles", message: "Matching dishes to the group" },
  { type: "stage", stage: "preparing_recommendations", message: "Preparing recommendations" },
  { type: "stage", stage: "complete", message: "Analysis complete" },
  { type: "result", data: demoAnalysisResult },
]);
