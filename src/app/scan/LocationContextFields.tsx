"use client";

import { LoaderCircleIcon, LocateFixedIcon, MapPinIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  LocationClientError,
  resolveBrowserLocation,
} from "@/lib/client";
import type { LocationContext } from "@/lib/schemas";

const PALETTE = {
  rustySpice: "#AD390B",
  oliveLeaf: "#385610",
  champagneMist: "#F5E6C8",
};

interface LocationContextFieldsProps {
  location: LocationContext | null;
  onChange: (location: LocationContext | null) => void;
}

export function LocationContextFields({
  location,
  onChange,
}: LocationContextFieldsProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function handleCityChange(value: string) {
    const city = value.trim();
    setMessage(null);
    onChange(
      city
        ? {
            source: "manual",
            city,
            region: null,
            country: null,
            countryCode: null,
          }
        : null,
    );
  }

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setMessage("Location isn't supported here. You can type a city instead.");
      return;
    }

    setMessage(null);
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const place = await resolveBrowserLocation({
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
          onChange(place);
          setMessage(`Using ${[place.city, place.region, place.country].filter(Boolean).join(", ")}.`);
        } catch (error) {
          setMessage(
            error instanceof LocationClientError
              ? error.message
              : "Location lookup failed. You can type a city instead.",
          );
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        setMessage("Location wasn't shared. That's okay—you can type a city or continue without it.");
      },
      { enableHighAccuracy: false, timeout: 8_000, maximumAge: 300_000 },
    );
  }

  return (
    <section
      aria-labelledby="location-heading"
      className="rounded-xl border bg-white/70 p-4"
      style={{ borderColor: `${PALETTE.oliveLeaf}55` }}
    >
      <div className="flex gap-3">
        <MapPinIcon
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0"
          style={{ color: PALETTE.rustySpice }}
        />
        <div className="min-w-0 flex-1">
          <h2 id="location-heading" className="font-semibold text-neutral-900">
            Add local food context <span className="font-normal text-neutral-500">(optional)</span>
          </h2>
          <p className="mt-1 text-xs leading-5 text-neutral-600">
            This helps the AI research ingredients commonly used nearby. It does not prove this restaurant&apos;s exact recipe.
          </p>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="menu-location-city">
              City or area
            </label>
            <input
              id="menu-location-city"
              type="text"
              value={location?.city ?? ""}
              maxLength={100}
              disabled={isLocating}
              onChange={(event) => handleCityChange(event.target.value)}
              placeholder="Type a city, e.g. Yogyakarta"
              className="min-h-10 flex-1 rounded-lg border bg-white px-3 text-sm outline-none transition focus:ring-2"
              style={{ borderColor: `${PALETTE.oliveLeaf}66` }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={isLocating}
              onClick={handleUseLocation}
              style={{ borderColor: PALETTE.oliveLeaf, color: PALETTE.oliveLeaf }}
            >
              {isLocating ? (
                <LoaderCircleIcon aria-hidden="true" className="animate-spin" />
              ) : (
                <LocateFixedIcon aria-hidden="true" />
              )}
              {isLocating ? "Finding city…" : "Use my location"}
            </Button>
          </div>

          {message && (
            <p role="status" className="mt-2 text-xs text-neutral-700">
              {message}
            </p>
          )}
          {location?.source === "browser" && (
            <p className="mt-1 text-[11px] text-neutral-500">
              Place data ©{" "}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                OpenStreetMap contributors
              </a>
              . Coordinates are not saved or sent to menu analysis.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
