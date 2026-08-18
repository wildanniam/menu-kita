import {
  reverseGeocodeRequestSchema,
  reverseGeocodeResultSchema,
  type ReverseGeocodeRequest,
  type ReverseGeocodeResult,
} from "../schemas";

const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";
const OPENSTREETMAP_ATTRIBUTION = "© OpenStreetMap contributors" as const;

interface NominatimAddress {
  city?: unknown;
  town?: unknown;
  village?: unknown;
  municipality?: unknown;
  county?: unknown;
  state?: unknown;
  state_district?: unknown;
  country?: unknown;
  country_code?: unknown;
}

interface NominatimResponse {
  address?: NominatimAddress;
}

export class ReverseGeocodeError extends Error {
  constructor(
    readonly code: "UNAVAILABLE" | "PLACE_NOT_FOUND",
    message: string,
  ) {
    super(message);
    this.name = "ReverseGeocodeError";
  }
}

export interface ReverseGeocodeOptions {
  fetcher?: typeof fetch;
  signal?: AbortSignal;
}

function boundedText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text ? text.slice(0, max) : null;
}

export function parseNominatimPlace(payload: unknown): ReverseGeocodeResult {
  const address = (payload as NominatimResponse | null)?.address;
  if (!address || typeof address !== "object") {
    throw new ReverseGeocodeError(
      "PLACE_NOT_FOUND",
      "We couldn't identify a nearby city. You can type one instead.",
    );
  }

  const result = reverseGeocodeResultSchema.safeParse({
    source: "browser",
    city: boundedText(
      address.city ??
        address.town ??
        address.village ??
        address.municipality ??
        address.county,
      100,
    ),
    region: boundedText(address.state ?? address.state_district, 120),
    country: boundedText(address.country, 100),
    countryCode:
      typeof address.country_code === "string"
        ? address.country_code.trim().toUpperCase().slice(0, 2)
        : null,
    attribution: OPENSTREETMAP_ATTRIBUTION,
  });

  if (!result.success) {
    throw new ReverseGeocodeError(
      "PLACE_NOT_FOUND",
      "We couldn't identify a nearby city. You can type one instead.",
    );
  }
  return result.data;
}

export async function reverseGeocode(
  input: ReverseGeocodeRequest,
  { fetcher = fetch, signal }: ReverseGeocodeOptions = {},
): Promise<ReverseGeocodeResult> {
  const coordinates = reverseGeocodeRequestSchema.parse(input);
  const latitude = Math.round(coordinates.latitude * 100) / 100;
  const longitude = Math.round(coordinates.longitude * 100) / 100;
  const url = new URL(NOMINATIM_REVERSE_URL);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("layer", "address");

  let response: Response;
  try {
    response = await fetcher(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
        "User-Agent":
          "MenuKita-Hackathon/0.1 (+https://github.com/wildanniam/menu-kita)",
      },
      cache: "no-store",
      signal,
    });
  } catch {
    throw new ReverseGeocodeError(
      "UNAVAILABLE",
      "Location lookup is unavailable right now. You can type a city instead.",
    );
  }

  if (!response.ok) {
    throw new ReverseGeocodeError(
      "UNAVAILABLE",
      "Location lookup is unavailable right now. You can type a city instead.",
    );
  }

  try {
    return parseNominatimPlace(await response.json());
  } catch (error) {
    if (error instanceof ReverseGeocodeError) throw error;
    throw new ReverseGeocodeError(
      "UNAVAILABLE",
      "Location lookup returned an unreadable response. You can type a city instead.",
    );
  }
}
