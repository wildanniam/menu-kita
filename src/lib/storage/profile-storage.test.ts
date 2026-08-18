import { describe, expect, it } from "vitest";

import { parseStoredProfile } from "./profile-storage";

describe("parseStoredProfile", () => {
  it("restores valid profiles and ignores corrupted browser data", () => {
    const profile = {
      id: "current-user",
      name: "Wildan",
      isCurrentUser: true,
      dietaryRequirements: ["halal"],
      allergies: [],
      spiceTolerance: "medium",
      likes: [],
      dislikes: [],
    };

    expect(parseStoredProfile(JSON.stringify(profile))).toEqual(profile);
    expect(parseStoredProfile("not-json")).toBeNull();
    expect(parseStoredProfile(JSON.stringify({ name: "Incomplete" }))).toBeNull();
  });
});
