import { menuExtractionSchema, type MenuExtraction } from "../schemas";

export interface MenuExtractionRequest {
  imageDataUrl: string;
  attempt: "initial" | "repair";
  validationIssues: string[];
}

export interface MenuExtractionModel {
  generate(request: MenuExtractionRequest): Promise<string>;
}

export class MenuExtractionError extends Error {
  readonly code = "INVALID_MENU_EXTRACTION";

  constructor() {
    super("The menu could not be read into a valid structured result.");
    this.name = "MenuExtractionError";
  }
}

type ParseResult =
  | { success: true; data: MenuExtraction }
  | { success: false; issues: string[] };

function parseModelOutput(rawOutput: string): ParseResult {
  let decoded: unknown;

  try {
    decoded = JSON.parse(rawOutput);
  } catch {
    return {
      success: false,
      issues: ["The response was not valid JSON."],
    };
  }

  const parsed = menuExtractionSchema.safeParse(decoded);

  if (parsed.success) {
    return parsed;
  }

  return {
    success: false,
    issues: parsed.error.issues.slice(0, 8).map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "root";
      return `${path}: ${issue.message}`;
    }),
  };
}

export async function extractMenuFromImage(
  imageDataUrl: string,
  model: MenuExtractionModel,
): Promise<MenuExtraction> {
  const firstOutput = await model.generate({
    imageDataUrl,
    attempt: "initial",
    validationIssues: [],
  });
  const firstResult = parseModelOutput(firstOutput);

  if (firstResult.success) {
    return firstResult.data;
  }

  const repairedOutput = await model.generate({
    imageDataUrl,
    attempt: "repair",
    validationIssues: firstResult.issues,
  });
  const repairedResult = parseModelOutput(repairedOutput);

  if (repairedResult.success) {
    return repairedResult.data;
  }

  throw new MenuExtractionError();
}
