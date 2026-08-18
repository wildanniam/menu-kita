import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

describe("POST /api/location/reverse", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("rejects out-of-range coordinates", async () => {
    const response = await POST(
      new Request("http://localhost/api/location/reverse", {
        method: "POST",
        body: JSON.stringify({ latitude: 200, longitude: 10 }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "INVALID_LOCATION",
    });
  });

  it("returns place-only data and no coordinates", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          address: {
            city: "Surabaya",
            state: "East Java",
            country: "Indonesia",
            country_code: "id",
          },
        }),
      ),
    );
    const response = await POST(
      new Request("http://localhost/api/location/reverse", {
        method: "POST",
        body: JSON.stringify({ latitude: -7.25, longitude: 112.75 }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ city: "Surabaya", countryCode: "ID" });
    expect(payload).not.toHaveProperty("latitude");
    expect(payload).not.toHaveProperty("longitude");
  });
});
