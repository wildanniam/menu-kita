import { z } from "zod";

const optionalPlaceText = (max: number) =>
  z.string().trim().min(1).max(max).nullable().default(null);

const locationContextFields = {
    source: z.enum(["browser", "manual"]),
    city: optionalPlaceText(100),
    region: optionalPlaceText(120),
    country: optionalPlaceText(100),
    countryCode: z
      .string()
      .trim()
      .toUpperCase()
      .length(2)
      .nullable()
      .default(null),
  };

export const locationContextSchema = z
  .object(locationContextFields)
  .superRefine((location, context) => {
    if (!location.city && !location.region && !location.country) {
      context.addIssue({
        code: "custom",
        message: "At least one coarse place field is required.",
      });
    }
  });

export const reverseGeocodeRequestSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
});

export const reverseGeocodeResultSchema = z.object({
  ...locationContextFields,
  source: z.literal("browser"),
  attribution: z.literal("© OpenStreetMap contributors"),
}).superRefine((location, context) => {
  if (!location.city && !location.region && !location.country) {
    context.addIssue({
      code: "custom",
      message: "At least one coarse place field is required.",
    });
  }
});

export type LocationContext = z.infer<typeof locationContextSchema>;
export type ReverseGeocodeRequest = z.infer<typeof reverseGeocodeRequestSchema>;
export type ReverseGeocodeResult = z.infer<typeof reverseGeocodeResultSchema>;
