import { z } from "zod";

export const httpUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2_048)
  .regex(/^https?:\/\/[^\s]+$/i)
  .refine((value) => {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname);
    } catch {
      return false;
    }
  }, "A valid HTTP or HTTPS URL is required.");
