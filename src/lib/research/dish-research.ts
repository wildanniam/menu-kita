import { z } from "zod";

import { researchSourceSchema, type ResearchSource } from "../schemas";

export const TAVILY_SEARCH_OPTIONS = {
  searchDepth: "basic" as const,
  maxResults: 3,
  includeAnswer: false,
  includeRawContent: false as const,
  timeout: 6_000,
};

const dishResearchRequestSchema = z.object({
  dishId: z.string().trim().min(1),
  query: z.string().trim().min(1).max(300),
});

interface TavilyResultLike {
  title?: unknown;
  url?: unknown;
  content?: unknown;
  score?: unknown;
}

interface TavilyResponseLike {
  results?: TavilyResultLike[];
}

export interface TavilySearchClient {
  search(
    query: string,
    options: typeof TAVILY_SEARCH_OPTIONS,
  ): Promise<TavilyResponseLike>;
}

export type DishResearchResult =
  | {
      status: "success";
      dishId: string;
      query: string;
      sources: ResearchSource[];
    }
  | {
      status: "unavailable";
      dishId: string;
      query: string;
      sources: [];
      reason: "no_results" | "provider_error";
    };

export interface DishResearchProvider {
  search(input: { dishId: string; query: string }): Promise<DishResearchResult>;
}

function normalizeSources(results: TavilyResultLike[]): ResearchSource[] {
  return results
    .slice(0, TAVILY_SEARCH_OPTIONS.maxResults)
    .flatMap((result) => {
      const parsed = researchSourceSchema.safeParse({
        title: result.title,
        url: result.url,
        snippet: result.content,
        score: result.score,
      });

      return parsed.success ? [parsed.data] : [];
    });
}

export function createTavilyDishResearchProvider(
  client: TavilySearchClient,
): DishResearchProvider {
  return {
    async search(input) {
      const { dishId, query } = dishResearchRequestSchema.parse(input);

      try {
        const response = await client.search(query, TAVILY_SEARCH_OPTIONS);
        const sources = normalizeSources(response.results ?? []);

        if (sources.length === 0) {
          return {
            status: "unavailable",
            dishId,
            query,
            sources: [],
            reason: "no_results",
          };
        }

        return { status: "success", dishId, query, sources };
      } catch {
        return {
          status: "unavailable",
          dishId,
          query,
          sources: [],
          reason: "provider_error",
        };
      }
    },
  };
}
