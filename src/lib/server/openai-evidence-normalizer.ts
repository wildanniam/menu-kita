import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { getServerEnv } from "../env";
import {
  evidenceNormalizationOutputSchema,
  type EvidenceNormalizationInput,
  type EvidenceNormalizationModel,
} from "../research";

const NORMALIZER_MODEL = "gpt-4o-mini";

const NORMALIZER_INSTRUCTIONS = `Normalize web search snippets into evidence about common dish usage.

Rules:
- Use only the supplied snippets and source URLs.
- Mark a source relevant only when it materially clarifies ingredients or preparation.
- Write concise claims about common usage, never the restaurant's confirmed recipe.
- Do not infer ingredients not present in the source snippet.
- Return the exact supplied source URL for each decision.
- If a source is weak or irrelevant, mark it irrelevant and return no claims.`;

let cachedClient: OpenAI | undefined;

function getOpenAIClient(): OpenAI {
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey: getServerEnv().OPENAI_API_KEY });
  }
  return cachedClient;
}

export class OpenAIEvidenceNormalizationModel
  implements EvidenceNormalizationModel
{
  constructor(private readonly client: OpenAI = getOpenAIClient()) {}

  async normalize(input: EvidenceNormalizationInput): Promise<unknown> {
    const response = await this.client.responses.create({
      model: NORMALIZER_MODEL,
      store: false,
      instructions: NORMALIZER_INSTRUCTIONS,
      input: JSON.stringify(input),
      text: {
        format: zodTextFormat(
          evidenceNormalizationOutputSchema,
          "research_evidence",
        ),
      },
      max_output_tokens: 2_000,
    });

    return JSON.parse(response.output_text) as unknown;
  }
}
