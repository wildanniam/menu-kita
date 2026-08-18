import {
  ReverseGeocodeError,
  reverseGeocode,
} from "../../../../lib/location/reverse-geocode";
import { reverseGeocodeRequestSchema } from "../../../../lib/schemas";

export const runtime = "nodejs";

function json(data: unknown, status: number): Response {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(request: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ code: "INVALID_LOCATION", message: "Invalid location." }, 400);
  }

  const parsed = reverseGeocodeRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return json({ code: "INVALID_LOCATION", message: "Invalid location." }, 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    return json(await reverseGeocode(parsed.data, { signal: controller.signal }), 200);
  } catch (error) {
    if (error instanceof ReverseGeocodeError) {
      return json({ code: error.code, message: error.message }, 503);
    }
    return json(
      {
        code: "UNAVAILABLE",
        message: "Location lookup is unavailable. You can type a city instead.",
      },
      503,
    );
  } finally {
    clearTimeout(timeout);
  }
}
