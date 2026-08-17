import { describe, expect, it, vi } from "vitest";

import {
  createTavilyDishResearchProvider,
  TAVILY_SEARCH_OPTIONS,
  type TavilySearchClient,
} from "./dish-research";

describe("Tavily dish research provider", () => {
  it("uses bounded basic search and normalizes at most three sources", async () => {
    const search = vi.fn<TavilySearchClient["search"]>().mockResolvedValue({
      results: Array.from({ length: 4 }, (_, index) => ({
        title: `Source ${index + 1}`,
        url: `https://example.com/source-${index + 1}`,
        content: `Useful ingredient context ${index + 1}`,
        score: 0.9 - index * 0.1,
      })),
    });
    const provider = createTavilyDishResearchProvider({ search });

    const result = await provider.search({
      dishId: "kari-sayur",
      query: "kari sayur common ingredients",
    });

    expect(search).toHaveBeenCalledWith(
      "kari sayur common ingredients",
      TAVILY_SEARCH_OPTIONS,
    );
    expect(result.status).toBe("success");
    expect(result.sources).toHaveLength(3);
  });

  it("drops malformed sources instead of passing unsafe evidence onward", async () => {
    const provider = createTavilyDishResearchProvider({
      search: vi.fn().mockResolvedValue({
        results: [{ title: "Broken", url: "not-a-url", content: "Context" }],
      }),
    });

    const result = await provider.search({
      dishId: "kari-sayur",
      query: "kari sayur ingredients",
    });

    expect(result).toMatchObject({
      status: "unavailable",
      reason: "no_results",
      sources: [],
    });
  });

  it("converts provider failures and timeouts into a graceful result", async () => {
    const provider = createTavilyDishResearchProvider({
      search: vi.fn().mockRejectedValue(new Error("request timed out")),
    });

    const result = await provider.search({
      dishId: "kari-sayur",
      query: "kari sayur ingredients",
    });

    expect(result).toEqual({
      status: "unavailable",
      dishId: "kari-sayur",
      query: "kari sayur ingredients",
      sources: [],
      reason: "provider_error",
    });
  });
});
