import { describe, expect, it, vi } from "vitest";

import {
  extractMenuFromImage,
  MenuExtractionError,
  type MenuExtractionModel,
} from "./menu-extraction";

const validExtraction = JSON.stringify({
  languageCode: "id",
  languageName: "Indonesian",
  dishes: [
    {
      id: "nasi-goreng",
      originalName: "Nasi Goreng",
      translatedName: "Fried Rice",
      menuDescription: null,
      price: "Rp45.000",
      listedIngredients: ["rice", "egg"],
      unreadableFields: ["small text below the price"],
      evidence: [
        {
          id: "menu-nasi-goreng",
          claim: "The menu lists rice and egg.",
          type: "menu_listed",
          sourceTitle: "Uploaded menu",
          sourceUrl: null,
          restaurantConfirmed: false,
        },
      ],
    },
  ],
});

function modelWithOutputs(...outputs: string[]) {
  const generate = vi.fn<MenuExtractionModel["generate"]>();
  outputs.forEach((output) => generate.mockResolvedValueOnce(output));
  return { generate } satisfies MenuExtractionModel;
}

describe("menu extraction validation", () => {
  it("returns a valid first-pass extraction and preserves unreadable fields", async () => {
    const model = modelWithOutputs(validExtraction);

    const result = await extractMenuFromImage("data:image/jpeg;base64,abc", model);

    expect(result.dishes[0].unreadableFields).toEqual([
      "small text below the price",
    ]);
    expect(model.generate).toHaveBeenCalledOnce();
    expect(model.generate).toHaveBeenCalledWith(
      expect.objectContaining({ attempt: "initial" }),
    );
  });

  it("makes exactly one repair attempt after invalid model output", async () => {
    const model = modelWithOutputs('{"languageCode":"id"}', validExtraction);

    const result = await extractMenuFromImage("data:image/jpeg;base64,abc", model);

    expect(result.dishes[0].id).toBe("nasi-goreng");
    expect(model.generate).toHaveBeenCalledTimes(2);
    expect(model.generate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        attempt: "repair",
        validationIssues: expect.arrayContaining([
          expect.stringContaining("languageName"),
        ]),
      }),
    );
  });

  it("fails safely when the repair response remains invalid", async () => {
    const model = modelWithOutputs("not json", "still not json");

    await expect(
      extractMenuFromImage("data:image/jpeg;base64,abc", model),
    ).rejects.toBeInstanceOf(MenuExtractionError);
    expect(model.generate).toHaveBeenCalledTimes(2);
  });
});
