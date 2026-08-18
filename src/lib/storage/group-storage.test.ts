import { describe, expect, it } from "vitest";

import { DEMO_GROUP_ID, parseStoredGroupId } from "./group-storage";

describe("group storage", () => {
  it("restores only the approved preset group", () => {
    expect(parseStoredGroupId(DEMO_GROUP_ID)).toBe(DEMO_GROUP_ID);
    expect(parseStoredGroupId("unknown-group")).toBeNull();
    expect(parseStoredGroupId(null)).toBeNull();
  });
});
