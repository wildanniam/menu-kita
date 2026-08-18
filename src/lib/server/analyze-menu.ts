import "server-only";

import { extractMenuFromImage } from "../ai";
import { analyzeMenu, type AnalyzeMenuInput, type EmitAnalysisStage } from "../analysis";
import { OpenAIMenuExtractionModel } from "./openai-menu-extraction";
import { OpenAIResearchPlannerModel } from "./openai-research-planner";
import { OpenAIEvidenceNormalizationModel } from "./openai-evidence-normalizer";
import { OpenAIBatchPreferenceEvaluationModel } from "./openai-preference-evaluator";
import { OpenAIRestaurantQuestionModel } from "./openai-question-generator";
import { getTavilyDishResearchProvider } from "./tavily-research";

export function analyzeMenuWithLiveProviders(
  input: AnalyzeMenuInput,
  emitStage: EmitAnalysisStage,
  signal?: AbortSignal,
) {
  const extractionModel = new OpenAIMenuExtractionModel(undefined, signal);

  return analyzeMenu(
    input,
    {
      extractMenu: (imageDataUrl) =>
        extractMenuFromImage(imageDataUrl, extractionModel),
      researchPlanner: new OpenAIResearchPlannerModel(undefined, signal),
      researchProvider: getTavilyDishResearchProvider(),
      evidenceNormalizer: new OpenAIEvidenceNormalizationModel(undefined, signal),
      preferenceEvaluator: new OpenAIBatchPreferenceEvaluationModel(undefined, signal),
      questionGenerator: new OpenAIRestaurantQuestionModel(undefined, signal),
    },
    emitStage,
  );
}
