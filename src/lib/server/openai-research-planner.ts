import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import {
  researchPlannerOutputSchema,
  type ResearchCandidate,
  type ResearchPlannerModel,
} from "../research";
import { getOpenAIClient } from "./openai-client";

const PLANNER_MODEL = "gpt-4o-mini";

const PLANNER_INSTRUCTIONS = `You plan bounded web research for restaurant menu dishes.

For every provided candidate:
- Decide whether web research could materially clarify a hard dietary restriction.
- Do not research merely to add trivia or preference detail.
- Use locationLabel only to investigate ingredients or preparation commonly used in that area.
- Never claim that regional usage proves the uploaded restaurant's exact recipe.
- Return no more than two concise search queries per dish.
- Never invent a dish id and never claim that general recipes prove a restaurant's exact ingredients.`;

export class OpenAIResearchPlannerModel implements ResearchPlannerModel {
  constructor(
    private readonly client: OpenAI = getOpenAIClient(),
    private readonly signal?: AbortSignal,
  ) {}

  async decide(candidates: ResearchCandidate[]): Promise<unknown> {
    const response = await this.client.responses.create({
      model: PLANNER_MODEL,
      store: false,
      instructions: PLANNER_INSTRUCTIONS,
      input: JSON.stringify({ candidates }),
      text: {
        format: zodTextFormat(researchPlannerOutputSchema, "research_plan"),
      },
      max_output_tokens: 2_000,
    }, { signal: this.signal });

    return JSON.parse(response.output_text) as unknown;
  }
}
