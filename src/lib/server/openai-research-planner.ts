import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { getServerEnv } from "../env";
import {
  researchPlannerOutputSchema,
  type ResearchCandidate,
  type ResearchPlannerModel,
} from "../research";

const PLANNER_MODEL = "gpt-4o-mini";

const PLANNER_INSTRUCTIONS = `You plan bounded web research for restaurant menu dishes.

For every provided candidate:
- Decide whether web research could materially clarify a hard dietary restriction.
- Do not research merely to add trivia or preference detail.
- Prefer an official restaurant/menu query when restaurant context is present; otherwise use a precise dish and ingredient query.
- Return no more than two concise search queries per dish.
- Never invent a dish id and never claim that general recipes prove a restaurant's exact ingredients.`;

let cachedClient: OpenAI | undefined;

function getOpenAIClient(): OpenAI {
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey: getServerEnv().OPENAI_API_KEY });
  }
  return cachedClient;
}

export class OpenAIResearchPlannerModel implements ResearchPlannerModel {
  constructor(private readonly client: OpenAI = getOpenAIClient()) {}

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
    });

    return JSON.parse(response.output_text) as unknown;
  }
}
