import "server-only";

import OpenAI from "openai";

import { getServerEnv } from "../env";

export const OPENAI_REQUEST_TIMEOUT_MS = 45_000;

let cachedClient: OpenAI | undefined;

export function getOpenAIClient(): OpenAI {
  if (!cachedClient) {
    cachedClient = new OpenAI({
      apiKey: getServerEnv().OPENAI_API_KEY,
      timeout: OPENAI_REQUEST_TIMEOUT_MS,
      maxRetries: 0,
    });
  }
  return cachedClient;
}
