import {
  analysisResultSchema,
  analysisStreamEventSchema,
  type AnalysisResult,
  type AnalysisStageEvent,
  type FoodProfile,
} from "../schemas";

export class AnalysisClientError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "AnalysisClientError";
  }
}

export interface AnalyzeMenuImageInput {
  image: File;
  profile: FoodProfile;
  onStage?: (event: AnalysisStageEvent) => void;
  signal?: AbortSignal;
  fetcher?: typeof fetch;
}

function parseEventLine(
  line: string,
  onStage: AnalyzeMenuImageInput["onStage"],
): AnalysisResult | undefined {
  let decoded: unknown;
  try {
    decoded = JSON.parse(line);
  } catch {
    throw new AnalysisClientError(
      "INVALID_ANALYSIS_STREAM",
      "The analysis response could not be read. Please try again.",
      true,
    );
  }

  const parsed = analysisStreamEventSchema.safeParse(decoded);
  if (!parsed.success) {
    throw new AnalysisClientError(
      "INVALID_ANALYSIS_STREAM",
      "The analysis response was incomplete. Please try again.",
      true,
    );
  }

  if (parsed.data.type === "error") {
    throw new AnalysisClientError(
      parsed.data.code,
      parsed.data.message,
      parsed.data.retryable,
    );
  }
  if (parsed.data.type === "stage") {
    onStage?.(parsed.data);
    return undefined;
  }

  return analysisResultSchema.parse(parsed.data.data);
}

export async function analyzeMenuImage({
  image,
  profile,
  onStage,
  signal,
  fetcher = fetch,
}: AnalyzeMenuImageInput): Promise<AnalysisResult> {
  const form = new FormData();
  form.set("image", image);
  form.set("profile", JSON.stringify(profile));

  let response: Response;
  try {
    response = await fetcher("/api/analyze", {
      method: "POST",
      body: form,
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AnalysisClientError(
        "ANALYSIS_CANCELLED",
        "Analysis was cancelled.",
        true,
      );
    }
    throw new AnalysisClientError(
      "NETWORK_ERROR",
      "The analysis service could not be reached. Check your connection and try again.",
      true,
    );
  }

  if (!response.body) {
    throw new AnalysisClientError(
      "EMPTY_ANALYSIS_RESPONSE",
      "The analysis service returned no result. Please try again.",
      true,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: AnalysisResult | undefined;

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      result = parseEventLine(line, onStage) ?? result;
    }

    if (done) break;
  }

  if (buffer.trim()) {
    result = parseEventLine(buffer, onStage) ?? result;
  }

  if (!result) {
    throw new AnalysisClientError(
      response.ok ? "MISSING_ANALYSIS_RESULT" : `HTTP_${response.status}`,
      response.ok
        ? "Analysis ended before a result was prepared. Please try again."
        : "The analysis request could not be completed. Please try again.",
      true,
    );
  }

  return result;
}
