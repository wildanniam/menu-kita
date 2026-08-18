import { describe, expect, it, vi } from "vitest";

import {
  ReverseGeocodeError,
  parseNominatimPlace,
  reverseGeocode,
} from "./reverse-geocode";

describe("reverse geocoding", () => {
  it("normalizes Nominatim city-level address data", () => {
    expect(
      parseNominatimPlace({
        address: {
          city: "Yogyakarta",
          state: "Special Region of Yogyakarta",
          country: "Indonesia",
          country_code: "id",
        },
      }),
    ).toEqual({
      source: "browser",
      city: "Yogyakarta",
      region: "Special Region of Yogyakarta",
      country: "Indonesia",
      countryCode: "ID",
      attribution: "© OpenStreetMap contributors",
    });
  });

  it("falls back from a city to a village", () => {
    expect(
      parseNominatimPlace({
        address: { village: "Ubud", state: "Bali", country: "Indonesia" },
      }).city,
    ).toBe("Ubud");
  });

  it("rounds coordinates and sends policy-friendly request metadata", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      Response.json({
        address: { city: "Jakarta", country: "Indonesia", country_code: "id" },
      }),
    );

    await reverseGeocode(
      { latitude: -6.20481, longitude: 106.82119 },
      { fetcher },
    );

    const [url, options] = fetcher.mock.calls[0];
    expect(String(url)).toContain("lat=-6.2");
    expect(String(url)).toContain("lon=106.82");
    expect(options.headers["User-Agent"]).toContain("MenuKita-Hackathon");
    expect(options.cache).toBe("no-store");
  });

  it("returns a safe manual fallback when the provider fails", async () => {
    await expect(
      reverseGeocode(
        { latitude: -6.2, longitude: 106.82 },
        { fetcher: vi.fn().mockResolvedValue(new Response(null, { status: 503 })) },
      ),
    ).rejects.toMatchObject({
      code: "UNAVAILABLE",
    } satisfies Partial<ReverseGeocodeError>);
  });
});
