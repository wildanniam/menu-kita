import type {
  DietaryStatus,
  Dish,
  Evidence,
  FoodProfile,
} from "../schemas";

export type CanonicalIngredient =
  | "alcohol"
  | "beef"
  | "dairy"
  | "egg"
  | "fish"
  | "gluten"
  | "goat"
  | "honey"
  | "lamb"
  | "meat"
  | "peanut"
  | "pork"
  | "poultry"
  | "seafood"
  | "sesame"
  | "shellfish"
  | "soy"
  | "tree_nut";

export interface RestrictionEvaluation {
  status: DietaryStatus;
  summary: string;
  reasons: string[];
  triggeredRestrictions: string[];
  evidenceIds: string[];
  uncertainties: string[];
}

interface RestrictionRule {
  label: string;
  prohibited: ReadonlySet<CanonicalIngredient>;
  confirmationOnly?: ReadonlySet<CanonicalIngredient>;
  rawTerms?: string[];
}

interface EvidenceMaterial {
  text: string;
  evidenceId?: string;
}

interface RuleMatch {
  label: string;
  ingredients: string[];
  evidenceIds: string[];
}

const INGREDIENT_ALIASES: Record<CanonicalIngredient, readonly string[]> = {
  alcohol: [
    "alcohol",
    "beer",
    "brandy",
    "cooking wine",
    "mirin",
    "rum",
    "sake",
    "wine",
  ],
  beef: ["beef", "cow", "daging sapi", "sapi", "veal"],
  dairy: [
    "butter",
    "casein",
    "cheese",
    "cream",
    "dairy",
    "ghee",
    "keju",
    "lactose",
    "mentega",
    "milk",
    "susu",
    "whey",
    "yoghurt",
    "yogurt",
  ],
  egg: ["egg", "eggs", "telur"],
  fish: [
    "anchovy",
    "fish",
    "fish sauce",
    "ikan",
    "salmon",
    "tuna",
  ],
  gluten: ["barley", "rye", "wheat", "gandum"],
  goat: ["daging kambing", "goat", "kambing"],
  honey: ["honey", "madu"],
  lamb: ["daging domba", "domba", "lamb", "mutton"],
  meat: ["daging", "meat"],
  peanut: ["groundnut", "kacang tanah", "peanut", "peanuts"],
  pork: [
    "bacon",
    "ham",
    "lard",
    "pancetta",
    "pig",
    "pork",
    "prosciutto",
    "babi",
  ],
  poultry: [
    "ayam",
    "bebek",
    "chicken",
    "duck",
    "turkey",
  ],
  seafood: [
    "anchovy",
    "belacan",
    "clam",
    "crab",
    "cumi",
    "fish",
    "fish sauce",
    "ikan",
    "kepiting",
    "lobster",
    "mussel",
    "octopus",
    "oyster",
    "prawn",
    "salmon",
    "seafood",
    "shellfish",
    "shrimp",
    "shrimp paste",
    "squid",
    "terasi",
    "tuna",
    "udang",
  ],
  sesame: ["sesame", "tahini", "wijen"],
  shellfish: [
    "clam",
    "crab",
    "kepiting",
    "lobster",
    "mussel",
    "oyster",
    "prawn",
    "shellfish",
    "shrimp",
    "udang",
  ],
  soy: ["kedelai", "soy", "soya"],
  tree_nut: [
    "almond",
    "cashew",
    "hazelnut",
    "macadamia",
    "pecan",
    "pistachio",
    "walnut",
  ],
};

const ANIMAL_PRODUCTS = new Set<CanonicalIngredient>([
  "beef",
  "dairy",
  "egg",
  "fish",
  "goat",
  "honey",
  "lamb",
  "meat",
  "pork",
  "poultry",
  "seafood",
  "shellfish",
]);

const MEAT_AND_SEAFOOD = new Set<CanonicalIngredient>([
  "beef",
  "fish",
  "goat",
  "lamb",
  "meat",
  "pork",
  "poultry",
  "seafood",
  "shellfish",
]);

const HALAL_PROHIBITED = new Set<CanonicalIngredient>(["alcohol", "pork"]);
const HALAL_CONFIRMATION = new Set<CanonicalIngredient>([
  "beef",
  "goat",
  "lamb",
  "meat",
  "poultry",
]);

const PLANT_MILK_PATTERN = /\b(?:almond|coconut|oat|rice|soy) milk\b/g;

export function normalizeFoodText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function containsPhrase(text: string, phrase: string): boolean {
  return ` ${text} `.includes(` ${phrase} `);
}

function withoutNegatedPhrase(text: string, phrase: string): string {
  return ` ${text} `
    .replaceAll(` no ${phrase} `, " ")
    .replaceAll(` without ${phrase} `, " ")
    .replaceAll(` ${phrase} free `, " ")
    .trim();
}

export function extractCanonicalIngredients(
  value: string,
): Set<CanonicalIngredient> {
  const normalized = normalizeFoodText(value);
  const withoutPlantMilk = normalized.replace(PLANT_MILK_PATTERN, " ");
  const matches = new Set<CanonicalIngredient>();

  for (const [ingredient, aliases] of Object.entries(INGREDIENT_ALIASES) as [
    CanonicalIngredient,
    readonly string[],
  ][]) {
    const searchText = ingredient === "dairy" ? withoutPlantMilk : normalized;

    if (
      aliases.some((alias) =>
        containsPhrase(withoutNegatedPhrase(searchText, alias), alias),
      )
    ) {
      matches.add(ingredient);
    }
  }

  return matches;
}

function knownIngredientSet(
  ...ingredients: CanonicalIngredient[]
): ReadonlySet<CanonicalIngredient> {
  return new Set(ingredients);
}

function dietaryRule(requirement: string): RestrictionRule | undefined {
  const normalized = normalizeFoodText(requirement);

  if (["vegan", "plant based"].includes(normalized)) {
    return { label: requirement, prohibited: ANIMAL_PRODUCTS };
  }

  if (["vegetarian", "no meat"].includes(normalized)) {
    return { label: requirement, prohibited: MEAT_AND_SEAFOOD };
  }

  if (["halal", "halal only"].includes(normalized)) {
    return {
      label: requirement,
      prohibited: HALAL_PROHIBITED,
      confirmationOnly: HALAL_CONFIRMATION,
    };
  }

  const categoryRules: Array<{
    terms: string[];
    prohibited: CanonicalIngredient[];
  }> = [
    { terms: ["no beef", "beef free"], prohibited: ["beef"] },
    { terms: ["no pork", "pork free"], prohibited: ["pork"] },
    {
      terms: ["no seafood", "seafood free"],
      prohibited: ["seafood"],
    },
    {
      terms: ["no shellfish", "shellfish free"],
      prohibited: ["shellfish"],
    },
    {
      terms: ["dairy free", "lactose intolerant", "no dairy"],
      prohibited: ["dairy"],
    },
    { terms: ["egg free", "no egg", "no eggs"], prohibited: ["egg"] },
    {
      terms: ["gluten free", "no gluten"],
      prohibited: ["gluten"],
    },
    {
      terms: ["nut free", "no nuts"],
      prohibited: ["peanut", "tree_nut"],
    },
  ];

  const matchedRule = categoryRules.find(({ terms }) =>
    terms.includes(normalized),
  );

  if (!matchedRule) {
    return undefined;
  }

  return {
    label: requirement,
    prohibited: knownIngredientSet(...matchedRule.prohibited),
  };
}

function allergyRule(allergy: string): RestrictionRule {
  const normalized = normalizeFoodText(allergy);
  const knownAllergies: Record<string, CanonicalIngredient[]> = {
    dairy: ["dairy"],
    egg: ["egg"],
    eggs: ["egg"],
    fish: ["fish"],
    gluten: ["gluten"],
    milk: ["dairy"],
    nuts: ["peanut", "tree_nut"],
    peanut: ["peanut"],
    peanuts: ["peanut"],
    seafood: ["seafood"],
    sesame: ["sesame"],
    shellfish: ["shellfish"],
    soy: ["soy"],
    tree_nuts: ["tree_nut"],
  };
  const prohibited = knownAllergies[normalized.replaceAll(" ", "_")];

  return {
    label: `${allergy} allergy`,
    prohibited: knownIngredientSet(...(prohibited ?? [])),
    rawTerms: prohibited ? undefined : [normalized],
  };
}

function collectMaterials(dish: Dish): {
  explicit: EvidenceMaterial[];
  common: EvidenceMaterial[];
  unresolved: Evidence[];
} {
  const explicit: EvidenceMaterial[] = [
    { text: dish.originalName },
    ...(dish.translatedName ? [{ text: dish.translatedName }] : []),
    ...(dish.menuDescription ? [{ text: dish.menuDescription }] : []),
    ...dish.listedIngredients.map((text) => ({ text })),
    ...dish.evidence
      .filter((evidence) => evidence.type === "menu_listed")
      .map((evidence) => ({ text: evidence.claim, evidenceId: evidence.id })),
  ];
  const common = dish.evidence
    .filter((evidence) => evidence.type === "common_usage")
    .map((evidence) => ({ text: evidence.claim, evidenceId: evidence.id }));

  return {
    explicit,
    common,
    unresolved: dish.evidence.filter(
      (evidence) => evidence.type === "unresolved",
    ),
  };
}

function matchRule(
  rule: RestrictionRule,
  materials: EvidenceMaterial[],
  ingredients: ReadonlySet<CanonicalIngredient> = rule.prohibited,
): RuleMatch | undefined {
  const matchedIngredients = new Set<string>();
  const evidenceIds = new Set<string>();

  for (const material of materials) {
    const canonicalMatches = extractCanonicalIngredients(material.text);

    for (const ingredient of ingredients) {
      if (canonicalMatches.has(ingredient)) {
        matchedIngredients.add(ingredient.replaceAll("_", " "));
        if (material.evidenceId) evidenceIds.add(material.evidenceId);
      }
    }

    for (const rawTerm of rule.rawTerms ?? []) {
      const normalizedMaterial = normalizeFoodText(material.text);
      if (
        rawTerm &&
        containsPhrase(
          withoutNegatedPhrase(normalizedMaterial, rawTerm),
          rawTerm,
        )
      ) {
        matchedIngredients.add(rawTerm);
        if (material.evidenceId) evidenceIds.add(material.evidenceId);
      }
    }
  }

  if (matchedIngredients.size === 0) {
    return undefined;
  }

  return {
    label: rule.label,
    ingredients: [...matchedIngredients],
    evidenceIds: [...evidenceIds],
  };
}

function hasRestaurantConfirmedHalal(dish: Dish): boolean {
  return dish.evidence.some(
    (evidence) =>
      evidence.restaurantConfirmed &&
      containsPhrase(normalizeFoodText(evidence.claim), "halal"),
  );
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function describeMatches(matches: RuleMatch[]): string[] {
  return matches.map(
    (match) =>
      `${match.label}: ${match.ingredients.join(", ")} appears in the available evidence.`,
  );
}

export function evaluateHardRestrictions(
  profile: FoodProfile,
  dish: Dish,
): RestrictionEvaluation {
  const dietaryRules = profile.dietaryRequirements
    .map((requirement) => dietaryRule(requirement))
    .filter((rule): rule is RestrictionRule => Boolean(rule));
  const unrecognizedRequirements = profile.dietaryRequirements.filter(
    (requirement) => !dietaryRule(requirement),
  );
  const rules = [...dietaryRules, ...profile.allergies.map(allergyRule)];
  const { explicit, common, unresolved } = collectMaterials(dish);
  const explicitConflicts = rules.flatMap((rule) => {
    const match = matchRule(rule, explicit);
    return match ? [match] : [];
  });

  if (explicitConflicts.length > 0) {
    return {
      status: "conflict",
      summary: "A menu-listed item conflicts with a hard restriction.",
      reasons: describeMatches(explicitConflicts),
      triggeredRestrictions: unique(
        explicitConflicts.map((match) => match.label),
      ),
      evidenceIds: unique(
        explicitConflicts.flatMap((match) => match.evidenceIds),
      ),
      uncertainties: [],
    };
  }

  const commonConflicts = rules.flatMap((rule) => {
    const match = matchRule(rule, common);
    return match ? [match] : [];
  });
  const halalConfirmation = hasRestaurantConfirmedHalal(dish)
    ? []
    : dietaryRules.flatMap((rule) => {
        if (!rule.confirmationOnly) return [];
        const match = matchRule(rule, explicit, rule.confirmationOnly);
        return match ? [match] : [];
      });
  const hasMaterialUnknown =
    unresolved.length > 0 || dish.unreadableFields.length > 0;
  const uncertaintyReasons = [
    ...commonConflicts.map(
      (match) =>
        `${match.ingredients.join(", ")} is commonly used but is not confirmed by the restaurant.`,
    ),
    ...halalConfirmation.map(
      () => "The meat source and preparation are not confirmed halal.",
    ),
    ...unrecognizedRequirements.map(
      (requirement) =>
        `The deterministic rules do not yet recognize the requirement: ${requirement}.`,
    ),
    ...(hasMaterialUnknown && rules.length > 0
      ? ["Some menu information relevant to hard restrictions remains unresolved."]
      : []),
  ];

  if (uncertaintyReasons.length > 0) {
    const uncertainMatches = [...commonConflicts, ...halalConfirmation];
    return {
      status: "needs_confirmation",
      summary: "A material hard-restriction detail needs restaurant confirmation.",
      reasons: uncertaintyReasons,
      triggeredRestrictions: unique([
        ...uncertainMatches.map((match) => match.label),
        ...unrecognizedRequirements,
      ]),
      evidenceIds: unique([
        ...uncertainMatches.flatMap((match) => match.evidenceIds),
        ...unresolved.map((evidence) => evidence.id),
      ]),
      uncertainties: uncertaintyReasons,
    };
  }

  const hasAdequateEvidence =
    dish.listedIngredients.length > 0 ||
    Boolean(dish.menuDescription) ||
    dish.evidence.some((evidence) => evidence.type === "menu_listed");

  if (!hasAdequateEvidence) {
    return {
      status: "insufficient_information",
      summary: "The available menu information is too sparse for evaluation.",
      reasons: ["No ingredient list or useful menu description is available."],
      triggeredRestrictions: [],
      evidenceIds: [],
      uncertainties: ["Ingredients and preparation are not described."],
    };
  }

  return {
    status: "compatible",
    summary: "No known conflict was found in the available information.",
    reasons: [
      "The listed and researched evidence does not match a known hard restriction.",
    ],
    triggeredRestrictions: [],
    evidenceIds: unique(
      dish.evidence
        .filter((evidence) => evidence.type !== "unresolved")
        .map((evidence) => evidence.id),
    ),
    uncertainties: [],
  };
}
