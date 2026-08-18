import { z } from "zod";

import { foodProfileSchema, type FoodProfile } from "../schemas";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 256 * 1024;
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const boundedText = z.string().trim().min(1).max(100);
const analyzeProfileSchema = foodProfileSchema.extend({
  id: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(100),
  dietaryRequirements: z.array(boundedText).max(20),
  allergies: z.array(boundedText).max(20),
  likes: z.array(boundedText).max(20),
  dislikes: z.array(boundedText).max(20),
});

export type AnalyzeRequestErrorCode =
  | "INVALID_CONTENT_TYPE"
  | "REQUEST_TOO_LARGE"
  | "MISSING_IMAGE"
  | "UNSUPPORTED_IMAGE_TYPE"
  | "EMPTY_IMAGE"
  | "IMAGE_TOO_LARGE"
  | "INVALID_PROFILE";

export class AnalyzeRequestError extends Error {
  constructor(
    readonly code: AnalyzeRequestErrorCode,
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AnalyzeRequestError";
  }
}

export interface ParsedAnalyzeRequest {
  imageDataUrl: string;
  profile: FoodProfile;
}

function parseContentLength(request: Request): number | undefined {
  const raw = request.headers.get("content-length");
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

function parseProfile(value: FormDataEntryValue | null): FoodProfile {
  if (typeof value !== "string") {
    throw new AnalyzeRequestError(
      "INVALID_PROFILE",
      400,
      "A valid food profile is required.",
    );
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(value);
  } catch {
    throw new AnalyzeRequestError(
      "INVALID_PROFILE",
      400,
      "A valid food profile is required.",
    );
  }

  const parsed = analyzeProfileSchema.safeParse(decoded);
  if (!parsed.success) {
    throw new AnalyzeRequestError(
      "INVALID_PROFILE",
      400,
      "A valid food profile is required.",
    );
  }

  return parsed.data;
}

async function fileToDataUrl(file: File): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${bytes.toString("base64")}`;
}

export async function parseAnalyzeRequest(
  request: Request,
): Promise<ParsedAnalyzeRequest> {
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) {
    throw new AnalyzeRequestError(
      "INVALID_CONTENT_TYPE",
      415,
      "Submit the menu as multipart form data.",
    );
  }

  const contentLength = parseContentLength(request);
  if (contentLength !== undefined && contentLength > MAX_REQUEST_BYTES) {
    throw new AnalyzeRequestError(
      "REQUEST_TOO_LARGE",
      413,
      "The upload is too large.",
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new AnalyzeRequestError(
      "INVALID_CONTENT_TYPE",
      400,
      "The submitted form data could not be read.",
    );
  }

  const image = form.get("image");
  if (!(image instanceof File)) {
    throw new AnalyzeRequestError(
      "MISSING_IMAGE",
      400,
      "Choose a menu image to analyze.",
    );
  }
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(image.type)) {
    throw new AnalyzeRequestError(
      "UNSUPPORTED_IMAGE_TYPE",
      415,
      "Use a JPEG, PNG, or WebP menu image.",
    );
  }
  if (image.size === 0) {
    throw new AnalyzeRequestError("EMPTY_IMAGE", 400, "The menu image is empty.");
  }
  if (image.size > MAX_IMAGE_BYTES) {
    throw new AnalyzeRequestError(
      "IMAGE_TOO_LARGE",
      413,
      "The menu image must be 8 MB or smaller.",
    );
  }

  return {
    imageDataUrl: await fileToDataUrl(image),
    profile: parseProfile(form.get("profile")),
  };
}
