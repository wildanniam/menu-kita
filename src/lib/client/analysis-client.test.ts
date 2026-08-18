import { describe, expect, it, vi } from "vitest";

import { demoAnalysisResult } from "../fixtures";
import { AnalysisClientError, analyzeMenuImage } from "./analysis-client";

const profile = {
  id: "current-user",
  name: "Wildan",
  isCurrentUser: true,
  dietaryRequirements: ["halal"],
  allergies: [],
  spiceTolerance: "medium" as const,
  likes: ["savory food"],
  dislikes: [],
};

function image(): File {
  return new File(["menu"], "menu.png", { type: "image/png" });
}

describe("analyzeMenuImage", () => {
  it("parses split NDJSON chunks, reports stages, and returns the result", async () => {
    const stages: string[] = [];
    const payload = [
      JSON.stringify({
        type: "stage",
        stage: "reading_menu",
        message: "Reading menu",
      }),
      JSON.stringify({ type: "result", data: demoAnalysisResult }),
      "",
    ].join("\n");
    const bytes = new TextEncoder().encode(payload);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, 17));
        controller.enqueue(bytes.slice(17));
        controller.close();
      },
    });
    const fetcher = vi.fn().mockResolvedValue(
      new Response(stream, {
        headers: { "content-type": "application/x-ndjson" },
      }),
    );

    const result = await analyzeMenuImage({
      image: image(),
      profile,
      fetcher,
      onStage: ({ stage }) => stages.push(stage),
    });

    expect(stages).toEqual(["reading_menu"]);
    expect(result).toEqual(demoAnalysisResult);
    const request = fetcher.mock.calls[0][1];
    expect(request.body).toBeInstanceOf(FormData);
    expect(request.body.get("profile")).toBe(JSON.stringify(profile));
  });

  it("surfaces safe streamed API errors", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        `${JSON.stringify({
          type: "error",
          code: "RATE_LIMITED",
          message: "Please wait.",
          retryable: true,
        })}\n`,
        { status: 429 },
      ),
    );

    await expect(
      analyzeMenuImage({ image: image(), profile, fetcher }),
    ).rejects.toMatchObject({
      code: "RATE_LIMITED",
      message: "Please wait.",
      retryable: true,
    } satisfies Partial<AnalysisClientError>);
  });

  it("rejects malformed streams instead of trusting partial output", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response("not-json\n", { status: 200 }));

    await expect(
      analyzeMenuImage({ image: image(), profile, fetcher }),
    ).rejects.toMatchObject({ code: "INVALID_ANALYSIS_STREAM" });
  });
});
