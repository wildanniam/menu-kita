import { describe, expect, it, vi } from "vitest";

import { LocationClientError, resolveBrowserLocation } from "./location-client";

describe("resolveBrowserLocation", () => {
  it("returns a validated coarse place", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      Response.json({
        source: "browser",
        city: "Bandung",
        region: "West Java",
        country: "Indonesia",
        countryCode: "ID",
        attribution: "© OpenStreetMap contributors",
      }),
    );

    await expect(
      resolveBrowserLocation({ latitude: -6.91, longitude: 107.61 }, fetcher),
    ).resolves.toMatchObject({ city: "Bandung", countryCode: "ID" });
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({
      latitude: -6.91,
      longitude: 107.61,
    });
  });

  it("surfaces a safe optional-location failure", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      Response.json(
        { message: "Location lookup is unavailable. You can type a city instead." },
        { status: 503 },
      ),
    );

    await expect(
      resolveBrowserLocation({ latitude: -6.91, longitude: 107.61 }, fetcher),
    ).rejects.toBeInstanceOf(LocationClientError);
  });
});
