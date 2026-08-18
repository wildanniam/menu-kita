import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import {
  batchPreferenceModelOutputSchema,
  preferenceModelOutputSchema,
  type BatchPreferenceEvaluationModel,
  type PreferenceEvaluationModel,
  type PreferenceModelInput,
} from "../compatibility";
import { getOpenAIClient } from "./openai-client";

const PREFERENCE_MODEL = "gpt-4o-mini";

const PREFERENCE_INSTRUCTIONS = `Evaluate food preference fit, not dietary safety.

Rules:
- Use only the supplied likes, dislikes, spice tolerance, menu fields, and evidence.
- Dietary restrictions and allergies are intentionally absent; never infer or evaluate them.
- Every explanation reason must cite one or more allowed basis ids.
- Use basis id "menu" for visible name, description, or listed ingredients.
- Do not invent flavor, texture, spice, or preparation details.
- A preference score cannot imply that a dish is safe or compatible.`;

export class OpenAIPreferenceEvaluationModel
  implements PreferenceEvaluationModel
{
  constructor(
    private readonly client: OpenAI = getOpenAIClient(),
    private readonly signal?: AbortSignal,
  ) {}

  async evaluate(input: PreferenceModelInput): Promise<unknown> {
    const response = await this.client.responses.create({
      model: PREFERENCE_MODEL,
      store: false,
      instructions: PREFERENCE_INSTRUCTIONS,
      input: JSON.stringify(input),
      text: {
        format: zodTextFormat(preferenceModelOutputSchema, "preference_fit"),
      },
      max_output_tokens: 1_200,
    }, { signal: this.signal });

    return JSON.parse(response.output_text) as unknown;
  }
}

export class OpenAIBatchPreferenceEvaluationModel
  implements BatchPreferenceEvaluationModel
{
  constructor(
    private readonly client: OpenAI = getOpenAIClient(),
    private readonly signal?: AbortSignal,
  ) {}

  async evaluateBatch(
    input: Parameters<BatchPreferenceEvaluationModel["evaluateBatch"]>[0],
  ): Promise<unknown> {
    const response = await this.client.responses.create({
      model: PREFERENCE_MODEL,
      store: false,
      instructions: `${PREFERENCE_INSTRUCTIONS}\nReturn exactly one evaluation for every supplied profile and dish pair, preserving their ids.`,
      input: JSON.stringify(input),
      text: {
        format: zodTextFormat(
          batchPreferenceModelOutputSchema,
          "group_preference_fit",
        ),
      },
      max_output_tokens: 6_000,
    }, { signal: this.signal });

    return JSON.parse(response.output_text) as unknown;
  }
}
