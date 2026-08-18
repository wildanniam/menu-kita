import { describe, expect, it } from "vitest";

import {
  AnalyzeRequestError,
  MAX_IMAGE_BYTES,
  MAX_REQUEST_BYTES,
  parseAnalyzeRequest,
} from "./analyze-request";

const profile = {
  id: "wildan",
  name: "Wildan",
  isCurrentUser: true,
  dietaryRequirements: ["halal"],
  allergies: [],
  spiceTolerance: "medium",
  likes: ["savory food"],
  dislikes: [],
};

function multipartRequest(options: {
  image?: File;
  profile?: string;
  location?: string;
} = {}): Request {
  const form = new FormData();
  if (options.image !== undefined) form.set("image", options.image);
  if (options.profile !== undefined) form.set("profile", options.profile);
  if (options.location !== undefined) form.set("location", options.location);
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    body: form,
  });
}

describe("parseAnalyzeRequest", () => {
  it("accepts a bounded supported image and validated profile", async () => {
    const request = multipartRequest({
      image: new File([new Uint8Array([1, 2, 3])], "menu.png", {
        type: "image/png",
      }),
      profile: JSON.stringify(profile),
    });

    const parsed = await parseAnalyzeRequest(request);

    expect(parsed.profile).toMatchObject({ id: "wildan", name: "Wildan" });
    expect(parsed.imageDataUrl).toBe("data:image/png;base64,AQID");
    expect(parsed.location).toBeNull();
  });

  it("accepts bounded optional place context without coordinates", async () => {
    const request = multipartRequest({
      image: new File(["menu"], "menu.jpg", { type: "image/jpeg" }),
      profile: JSON.stringify(profile),
      location: JSON.stringify({
        source: "browser",
        city: "Jakarta",
        region: "DKI Jakarta",
        country: "Indonesia",
        countryCode: "ID",
      }),
    });

    await expect(parseAnalyzeRequest(request)).resolves.toMatchObject({
      location: {
        source: "browser",
        city: "Jakarta",
        region: "DKI Jakarta",
      },
    });
  });

  it("rejects malformed or coordinate-bearing location context", async () => {
    const request = multipartRequest({
      image: new File(["menu"], "menu.jpg", { type: "image/jpeg" }),
      profile: JSON.stringify(profile),
      location: JSON.stringify({ source: "browser", latitude: -6.2 }),
    });

    await expect(parseAnalyzeRequest(request)).rejects.toMatchObject({
      code: "INVALID_CONTEXT",
      status: 400,
    } satisfies Partial<AnalyzeRequestError>);
  });

  it("rejects unsupported image types without reading model providers", async () => {
    const request = multipartRequest({
      image: new File(["menu"], "menu.svg", { type: "image/svg+xml" }),
      profile: JSON.stringify(profile),
    });

    await expect(parseAnalyzeRequest(request)).rejects.toMatchObject({
      code: "UNSUPPORTED_IMAGE_TYPE",
      status: 415,
    } satisfies Partial<AnalyzeRequestError>);
  });

  it("rejects an oversized request from its declared content length", async () => {
    const request = new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: {
        "content-type": "multipart/form-data; boundary=test",
        "content-length": String(MAX_REQUEST_BYTES + 1),
      },
      body: "--test--",
    });

    await expect(parseAnalyzeRequest(request)).rejects.toMatchObject({
      code: "REQUEST_TOO_LARGE",
      status: 413,
    } satisfies Partial<AnalyzeRequestError>);
  });

  it("rejects an image larger than 8 MB", async () => {
    const request = multipartRequest({
      image: new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], "menu.webp", {
        type: "image/webp",
      }),
      profile: JSON.stringify(profile),
    });

    await expect(parseAnalyzeRequest(request)).rejects.toMatchObject({
      code: "IMAGE_TOO_LARGE",
      status: 413,
    } satisfies Partial<AnalyzeRequestError>);
  });

  it("rejects malformed and excessively large profile fields", async () => {
    const request = multipartRequest({
      image: new File(["menu"], "menu.jpg", { type: "image/jpeg" }),
      profile: JSON.stringify({ ...profile, name: "x".repeat(101) }),
    });

    await expect(parseAnalyzeRequest(request)).rejects.toMatchObject({
      code: "INVALID_PROFILE",
      status: 400,
    } satisfies Partial<AnalyzeRequestError>);
  });
});
