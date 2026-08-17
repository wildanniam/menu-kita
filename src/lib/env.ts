import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  OPENAI_API_KEY: z.string().trim().min(1, "OPENAI_API_KEY is required"),
  TAVILY_API_KEY: z.string().trim().min(1, "TAVILY_API_KEY is required"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const missingKeys = parsed.error.issues
      .map((issue) => issue.path.join("."))
      .filter(Boolean)
      .join(", ");

    throw new Error(
      `Invalid server environment${missingKeys ? `: ${missingKeys}` : ""}. Copy .env.example to .env.local and provide the required values.`,
    );
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
