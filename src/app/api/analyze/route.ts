import {
  AnalyzeRequestError,
  createRequestThrottle,
  parseAnalyzeRequest,
} from "@/lib/api";
import { buildDemoGroup } from "@/lib/data";
import {
  analysisStreamEventSchema,
  type AnalysisStreamEvent,
} from "@/lib/schemas";
import { analyzeMenuWithLiveProviders } from "@/lib/server/analyze-menu";

export const runtime = "nodejs";
export const maxDuration = 180;

const ANALYSIS_TIMEOUT_MS = 150_000;

const encoder = new TextEncoder();
const throttle = createRequestThrottle({ limit: 5, windowMs: 60_000 });

function safeErrorDetails(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== "object") {
    return { name: "UnknownError" };
  }
  const value = error as {
    name?: unknown;
    status?: unknown;
    code?: unknown;
    type?: unknown;
    issues?: unknown;
  };
  const details: Record<string, unknown> = {
    name: typeof value.name === "string" ? value.name : "Error",
  };
  if (typeof value.status === "number") details.status = value.status;
  if (typeof value.code === "string") details.code = value.code;
  if (typeof value.type === "string") details.type = value.type;
  if (Array.isArray(value.issues)) {
    details.issues = value.issues.slice(0, 10).map((issue) => {
      if (!issue || typeof issue !== "object") return { code: "unknown" };
      const item = issue as { code?: unknown; path?: unknown };
      return {
        code: typeof item.code === "string" ? item.code : "unknown",
        path: Array.isArray(item.path)
          ? item.path.filter(
              (segment): segment is string | number =>
                typeof segment === "string" || typeof segment === "number",
            )
          : [],
      };
    });
  }
  return details;
}

function serializeEvent(event: AnalysisStreamEvent): string {
  return `${JSON.stringify(analysisStreamEventSchema.parse(event))}\n`;
}

function encodeEvent(event: AnalysisStreamEvent): Uint8Array {
  return encoder.encode(serializeEvent(event));
}

function eventResponse(
  event: AnalysisStreamEvent,
  status: number,
  additionalHeaders: HeadersInit = {},
): Response {
  return new Response(serializeEvent(event), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      ...additionalHeaders,
    },
  });
}

function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "anonymous"
  );
}

export async function POST(request: Request): Promise<Response> {
  const allowance = throttle.consume(clientKey(request));
  if (!allowance.allowed) {
    return eventResponse(
      {
        type: "error",
        code: "RATE_LIMITED",
        message: "Too many analysis requests. Please wait a moment and try again.",
        retryable: true,
      },
      429,
      { "Retry-After": String(allowance.retryAfterSeconds) },
    );
  }

  let parsedRequest;
  try {
    parsedRequest = await parseAnalyzeRequest(request);
  } catch (error) {
    if (error instanceof AnalyzeRequestError) {
      return eventResponse(
        {
          type: "error",
          code: error.code,
          message: error.message,
          retryable: true,
        },
        error.status,
      );
    }
    return eventResponse(
      {
        type: "error",
        code: "INVALID_REQUEST",
        message: "The analysis request could not be read.",
        retryable: true,
      },
      400,
    );
  }

  const analysisController = new AbortController();
  let timedOut = false;
  let cancelled = false;
  const startedAt = Date.now();
  let currentStage = "request_parsed";
  const abortForClient = () => {
    cancelled = true;
    analysisController.abort(new DOMException("Client disconnected", "AbortError"));
  };
  request.signal.addEventListener("abort", abortForClient, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    analysisController.abort(new DOMException("Analysis timed out", "TimeoutError"));
  }, ANALYSIS_TIMEOUT_MS);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enqueue = (event: AnalysisStreamEvent) => {
        if (!cancelled) controller.enqueue(encodeEvent(event));
      };
      try {
        const group = buildDemoGroup(parsedRequest.profile);
        const result = await analyzeMenuWithLiveProviders(
          {
            imageDataUrl: parsedRequest.imageDataUrl,
            profiles: group.members,
            location: parsedRequest.location,
          },
          (event) => {
            currentStage = event.stage;
            console.info(
              `[analysis-stage] ${JSON.stringify({
                stage: event.stage,
                elapsedMs: Date.now() - startedAt,
              })}`,
            );
            enqueue(event);
          },
          analysisController.signal,
        );

        enqueue({ type: "result", data: result });
      } catch (error) {
        console.error(
          `[analysis-error] ${JSON.stringify({
            stage: currentStage,
            elapsedMs: Date.now() - startedAt,
            ...safeErrorDetails(error),
          })}`,
        );
        if (!cancelled) {
          enqueue({
            type: "stage",
            stage: "failed",
            message: "Analysis stopped before a result could be prepared.",
          });
          enqueue({
            type: "error",
            code: timedOut ? "ANALYSIS_TIMEOUT" : "ANALYSIS_FAILED",
            message: timedOut
              ? "Menu analysis took too long. Please try again."
              : "We could not analyze this menu. Please check the image and try again.",
            retryable: true,
          });
        }
      } finally {
        clearTimeout(timeout);
        request.signal.removeEventListener("abort", abortForClient);
        if (!cancelled) controller.close();
      }
    },
    cancel() {
      abortForClient();
      clearTimeout(timeout);
      request.signal.removeEventListener("abort", abortForClient);
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
