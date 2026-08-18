import {
  reverseGeocodeResultSchema,
  type ReverseGeocodeResult,
} from "../schemas";

export class LocationClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocationClientError";
  }
}

export async function resolveBrowserLocation(
  coordinates: { latitude: number; longitude: number },
  fetcher: typeof fetch = fetch,
): Promise<ReverseGeocodeResult> {
  let response: Response;
  try {
    response = await fetcher("/api/location/reverse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coordinates),
      cache: "no-store",
    });
  } catch {
    throw new LocationClientError(
      "Location lookup is unavailable. You can type a city instead.",
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new LocationClientError(
      "Location lookup returned an unreadable response. You can type a city instead.",
    );
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : "Location lookup is unavailable. You can type a city instead.";
    throw new LocationClientError(message);
  }

  const parsed = reverseGeocodeResultSchema.safeParse(payload);
  if (!parsed.success) {
    throw new LocationClientError(
      "Location lookup returned an invalid place. You can type a city instead.",
    );
  }
  return parsed.data;
}
