import { describe, expect, it } from "vitest";

import { createRequestThrottle } from "./request-throttle";

describe("createRequestThrottle", () => {
  it("limits each client independently and resets after the window", () => {
    let timestamp = 1_000;
    const throttle = createRequestThrottle({
      limit: 2,
      windowMs: 10_000,
      now: () => timestamp,
    });

    expect(throttle.consume("a")).toEqual({ allowed: true });
    expect(throttle.consume("a")).toEqual({ allowed: true });
    expect(throttle.consume("b")).toEqual({ allowed: true });
    expect(throttle.consume("a")).toEqual({
      allowed: false,
      retryAfterSeconds: 10,
    });

    timestamp = 11_000;
    expect(throttle.consume("a")).toEqual({ allowed: true });
  });
});
