import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import {
  preferenceModelOutputSchema,
  type PreferenceEvaluationModel,
  type PreferenceModelInput,
} from "../compatibility";
import { getServerEnv } from "../env";

const PREFERENCE_MODEL = "gpt-4o-mini";

const PREFERENCE_INSTRUCTIONS = `Evaluate food preference fit, not dietary safety.

Rules:
- Use only the supplied likes, dislikes, spice tolerance, menu fields, and evidence.
- Dietary restrictions and allergies are intentionally absent; never infer or evaluate them.
- Every explanation reason must cite one or more allowed basis ids.
- Use basis id "menu" for visible name, description, or listed ingredients.
- Do not invent flavor, texture, spice, or preparation details.
- A preference score cannot imply that a dish is safe or compatible.`;

let cachedClient: OpenAI | undefined;

function getOpenAIClient(): OpenAI {
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey: getServerEnv().OPENAI_API_KEY });
  }
  return cachedClient;
}

export class OpenAIPreferenceEvaluationModel
  implements PreferenceEvaluationModel
{
  constructor(private readonly client: OpenAI = getOpenAIClient()) {}

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
    });

    return JSON.parse(response.output_text) as unknown;
  }
}
