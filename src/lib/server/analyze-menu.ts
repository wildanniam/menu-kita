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
) {
  const extractionModel = new OpenAIMenuExtractionModel();

  return analyzeMenu(
    input,
    {
      extractMenu: (imageDataUrl) =>
        extractMenuFromImage(imageDataUrl, extractionModel),
      researchPlanner: new OpenAIResearchPlannerModel(),
      researchProvider: getTavilyDishResearchProvider(),
      evidenceNormalizer: new OpenAIEvidenceNormalizationModel(),
      preferenceEvaluator: new OpenAIBatchPreferenceEvaluationModel(),
      questionGenerator: new OpenAIRestaurantQuestionModel(),
    },
    emitStage,
  );
}
