import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import {
  questionGenerationOutputSchema,
  type RestaurantQuestionModel,
} from "../questions";
import { getOpenAIClient } from "./openai-client";

const QUESTION_MODEL = "gpt-4o-mini";

const QUESTION_INSTRUCTIONS = `Generate concise questions that a diner can ask restaurant staff.

Rules:
- Ask only about supplied material uncertainties that could change a hard-restriction decision.
- Keep the English question direct and easy to say aloud.
- When the menu language is not English, provide a natural translation in that exact language.
- When the menu language is English, set localized to null.
- Preserve dish ids and use only supplied member ids.
- Do not claim that a general recipe is the restaurant's exact recipe.`;

export class OpenAIRestaurantQuestionModel implements RestaurantQuestionModel {
  constructor(
    private readonly client: OpenAI = getOpenAIClient(),
    private readonly signal?: AbortSignal,
  ) {}

  async generate(
    input: Parameters<RestaurantQuestionModel["generate"]>[0],
  ): Promise<unknown> {
    const response = await this.client.responses.create({
      model: QUESTION_MODEL,
      store: false,
      instructions: QUESTION_INSTRUCTIONS,
      input: JSON.stringify(input),
      text: {
        format: zodTextFormat(
          questionGenerationOutputSchema,
          "restaurant_questions",
        ),
      },
      max_output_tokens: 2_000,
    }, { signal: this.signal });

    return JSON.parse(response.output_text) as unknown;
  }
}
