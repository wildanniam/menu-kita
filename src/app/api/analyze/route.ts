import { buildDemoGroup } from "@/lib/data";
import {
  analysisStreamEventSchema,
  foodProfileSchema,
  type AnalysisStreamEvent,
} from "@/lib/schemas";
import { analyzeMenuWithLiveProviders } from "@/lib/server/analyze-menu";

export const runtime = "nodejs";

const encoder = new TextEncoder();

function encodeEvent(event: AnalysisStreamEvent): Uint8Array {
  return encoder.encode(`${JSON.stringify(analysisStreamEventSchema.parse(event))}\n`);
}

async function fileToDataUrl(file: File): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${bytes.toString("base64")}`;
}

export async function POST(request: Request): Promise<Response> {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const form = await request.formData();
        const image = form.get("image");
        const rawProfile = form.get("profile");

        if (!(image instanceof File) || typeof rawProfile !== "string") {
          throw new Error("INVALID_ANALYSIS_REQUEST");
        }

        const profile = foodProfileSchema.parse(JSON.parse(rawProfile));
        const group = buildDemoGroup(profile);
        const result = await analyzeMenuWithLiveProviders(
          {
            imageDataUrl: await fileToDataUrl(image),
            profiles: group.members,
          },
          (event) => controller.enqueue(encodeEvent(event)),
        );

        controller.enqueue(encodeEvent({ type: "result", data: result }));
      } catch {
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
