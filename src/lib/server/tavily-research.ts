import "server-only";

import { tavily } from "@tavily/core";

import { getServerEnv } from "../env";
import { createTavilyDishResearchProvider } from "../research";

export function getTavilyDishResearchProvider() {
  const client = tavily({ apiKey: getServerEnv().TAVILY_API_KEY });

  return createTavilyDishResearchProvider({
    search: (query, options) => client.search(query, options),
  });
}
