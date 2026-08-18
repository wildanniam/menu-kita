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

const encoder = new TextEncoder();
const throttle = createRequestThrottle({ limit: 5, windowMs: 60_000 });

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

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const group = buildDemoGroup(parsedRequest.profile);
        const result = await analyzeMenuWithLiveProviders(
          {
            imageDataUrl: parsedRequest.imageDataUrl,
            profiles: group.members,
          },
          (event) => controller.enqueue(encodeEvent(event)),
        );

        controller.enqueue(encodeEvent({ type: "result", data: result }));
      } catch {
        controller.enqueue(
          encodeEvent({
            type: "stage",
            stage: "failed",
            message: "Analysis stopped before a result could be prepared.",
          }),
        );
        controller.enqueue(
          encodeEvent({
            type: "error",
            code: "ANALYSIS_FAILED",
            message: "We could not analyze this menu. Please check the image and try again.",
            retryable: true,
          }),
        );
      } finally {
        controller.close();
      }
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
