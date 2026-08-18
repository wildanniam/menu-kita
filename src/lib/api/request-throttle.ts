export interface RequestThrottle {
  consume(key: string): { allowed: true } | { allowed: false; retryAfterSeconds: number };
}

interface Bucket {
  count: number;
  resetAt: number;
}

export function createRequestThrottle(options: {
  limit: number;
  windowMs: number;
  now?: () => number;
}): RequestThrottle {
  const buckets = new Map<string, Bucket>();
  const now = options.now ?? Date.now;

  return {
    consume(key) {
      const timestamp = now();
      const current = buckets.get(key);
      const bucket =
        !current || current.resetAt <= timestamp
          ? { count: 0, resetAt: timestamp + options.windowMs }
          : current;

      if (bucket.count >= options.limit) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(
            1,
            Math.ceil((bucket.resetAt - timestamp) / 1_000),
          ),
        };
      }

      bucket.count += 1;
      buckets.set(key, bucket);
      return { allowed: true };
    },
  };
}
