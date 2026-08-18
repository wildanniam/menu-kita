import { analysisResultSchema, analysisStageEventSchema } from "../schemas";
import type {
  AnalysisResult,
  AnalysisStageEvent,
  LocationContext,
  Dish,
  FoodProfile,
  MenuExtraction,
} from "../schemas";
import type { BatchPreferenceEvaluationModel } from "../compatibility";
import { buildRecommendations, evaluateGroupCompatibility } from "../compatibility";
import type { RestaurantQuestionModel } from "../questions";
import { generateRestaurantQuestions } from "../questions";
import type {
  DishResearchProvider,
  DishResearchResult,
  EvidenceNormalizationModel,
  ResearchPlannerModel,
} from "../research";
import { createResearchPlan, normalizeResearchEvidence } from "../research";

export interface AnalyzeMenuDependencies {
  extractMenu(imageDataUrl: string): Promise<MenuExtraction>;
  researchPlanner: ResearchPlannerModel;
  researchProvider: DishResearchProvider;
  evidenceNormalizer: EvidenceNormalizationModel;
  preferenceEvaluator: BatchPreferenceEvaluationModel;
  questionGenerator: RestaurantQuestionModel;
}

export interface AnalyzeMenuInput {
  imageDataUrl: string;
  profiles: FoodProfile[];
  location?: LocationContext | null;
}

export type EmitAnalysisStage = (event: AnalysisStageEvent) => void | Promise<void>;

const STAGE_MESSAGES = {
  reading_menu: "Reading the uploaded menu image…",
  checking_evidence: "Checking which details need more evidence…",
  researching_dishes: "Researching material ingredient uncertainties…",
  matching_profiles: "Matching dishes with every group member…",
  preparing_recommendations: "Preparing group recommendations and questions…",
  complete: "Analysis complete.",
} as const;

async function emit(
  stage: keyof typeof STAGE_MESSAGES,
  emitStage: EmitAnalysisStage,
): Promise<void> {
  await emitStage(
    analysisStageEventSchema.parse({
      type: "stage",
      stage,
      message: STAGE_MESSAGES[stage],
    }),
  );
}

function combineResearchResults(
  dishId: string,
  queries: string[],
  results: DishResearchResult[],
): DishResearchResult {
  const successful = results.filter(
    (result): result is Extract<DishResearchResult, { status: "success" }> =>
      result.status === "success",
  );
  const seenUrls = new Set<string>();
  const sources = successful.flatMap(({ sources }) =>
    sources.filter(({ url }) => {
      if (seenUrls.has(url)) return false;
      seenUrls.add(url);
      return true;
    }),
  );

  if (sources.length > 0) {
    return {
      status: "success",
      dishId,
      query: queries.join(" | "),
      sources,
    };
  }

  return {
    status: "unavailable",
    dishId,
    query: queries.join(" | "),
    sources: [],
    reason: results.some(
      (result) => result.status === "unavailable" && result.reason === "provider_error",
    )
      ? "provider_error"
      : "no_results",
  };
}

async function researchDish(
  dish: Dish,
  queries: string[],
  dependencies: AnalyzeMenuDependencies,
): Promise<Dish> {
  const results: DishResearchResult[] = [];

  // Queries for one dish stay sequential to keep provider load predictable.
  for (const query of queries) {
    results.push(await dependencies.researchProvider.search({ dishId: dish.id, query }));
  }

  return normalizeResearchEvidence(
    dish,
    combineResearchResults(dish.id, queries, results),
    dependencies.evidenceNormalizer,
  );
}

function attachRecommendationQuestions(
  result: AnalysisResult,
): AnalysisResult {
  const shared = result.recommendations.bestForEveryone;
  if (!shared) return result;

  const questionIds = result.restaurantQuestions
    .filter(({ dishId }) => dishId === shared.dishId)
    .map(({ id }) => id);

  return analysisResultSchema.parse({
    ...result,
    recommendations: {
      ...result.recommendations,
      bestForEveryone: {
        ...shared,
        requiresConfirmation: shared.requiresConfirmation || questionIds.length > 0,
        questionIds,
      },
    },
  });
}

export async function analyzeMenu(
  input: AnalyzeMenuInput,
  dependencies: AnalyzeMenuDependencies,
  emitStage: EmitAnalysisStage = () => undefined,
): Promise<AnalysisResult> {
  await emit("reading_menu", emitStage);
  const extractedMenu = await dependencies.extractMenu(input.imageDataUrl);

  await emit("checking_evidence", emitStage);
  const plan = await createResearchPlan(
    extractedMenu,
    input.profiles,
    dependencies.researchPlanner,
    input.location ?? null,
  );

  let menu = extractedMenu;
  if (plan.items.length > 0) {
    await emit("researching_dishes", emitStage);
    const planByDish = new Map(plan.items.map((item) => [item.dishId, item]));
    const dishes = await Promise.all(
      extractedMenu.dishes.map((dish) => {
        const item = planByDish.get(dish.id);
        return item
          ? researchDish(dish, item.queries, dependencies)
          : Promise.resolve(dish);
      }),
    );
    menu = { ...extractedMenu, dishes };
  }

  await emit("matching_profiles", emitStage);
  const compatibility = await evaluateGroupCompatibility(
    input.profiles,
    menu.dishes,
    dependencies.preferenceEvaluator,
  );

  await emit("preparing_recommendations", emitStage);
  const recommendations = buildRecommendations(
    input.profiles,
    menu.dishes,
    compatibility,
  );
  const restaurantQuestions = await generateRestaurantQuestions(
    menu,
    compatibility,
    dependencies.questionGenerator,
  );
  const result = attachRecommendationQuestions(
    analysisResultSchema.parse({
      menu,
      compatibility,
      recommendations,
      restaurantQuestions,
    }),
  );

  await emit("complete", emitStage);
  return result;
}
