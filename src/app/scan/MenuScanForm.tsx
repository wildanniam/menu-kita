"use client";

import { CameraIcon, ImageUpIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useCurrentUserProfile } from "@/lib/storage/profile-storage";

const PALETTE = {
  rustySpice: "#AD390B",
  oliveLeaf: "#385610",
  champagneMist: "#F5E6C8",
  brandy: "#7C2D12",
  ochre: "#D97706",
};

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

interface SelectedImage {
  file: File;
  previewUrl: string;
}

function validateFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Please choose an image file.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "That image is too large. Please choose one under 8 MB.";
  }
  return null;
}

export function MenuScanForm() {
  const profile = useCurrentUserProfile();
  const [image, setImage] = useState<SelectedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanRequested, setScanRequested] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (image) {
        URL.revokeObjectURL(image.previewUrl);
      }
    };
  }, [image]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (image) {
      URL.revokeObjectURL(image.previewUrl);
    }
    setError(null);
    setScanRequested(false);
    setImage({ file, previewUrl: URL.createObjectURL(file) });
  }

  function handleRemove() {
    if (image) {
      URL.revokeObjectURL(image.previewUrl);
    }
    setImage(null);
    setError(null);
    setScanRequested(false);
  }

  if (!profile) {
    return (
      <div
        className="flex flex-col items-start gap-4 rounded-xl border-2 border-dashed bg-white p-6"
        style={{ borderColor: PALETTE.brandy }}
      >
        <p className="text-base text-neutral-700">
          Complete the questionnaire first so we know who&apos;s scanning.
        </p>
        <Button
          render={<Link href="/onboarding" />}
          style={{ backgroundColor: PALETTE.rustySpice }}
          className="border-transparent text-white hover:opacity-90"
        >
          Go to questionnaire
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {!image ? (
        <div
          className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed bg-white p-8 text-center"
          style={{ borderColor: PALETTE.oliveLeaf }}
        >
          <p className="text-sm text-neutral-600">
            Works with menus in any language, including Indonesian.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              style={{ backgroundColor: PALETTE.rustySpice }}
              className="border-transparent text-white hover:opacity-90"
            >
              <CameraIcon aria-hidden="true" />
              Take a photo
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              style={{ borderColor: PALETTE.oliveLeaf, color: PALETTE.oliveLeaf }}
            >
              <ImageUpIcon aria-hidden="true" />
              Upload from device
            </Button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-xl border-2 bg-white" style={{ borderColor: PALETTE.oliveLeaf }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not a static/remote asset */}
            <img
              src={image.previewUrl}
              alt="Selected menu"
              className="max-h-96 w-full object-contain"
            />
            <Button
              type="button"
              size="icon-sm"
              variant="secondary"
              aria-label="Remove photo"
              onClick={handleRemove}
              className="absolute top-2 right-2"
            >
              <XIcon aria-hidden="true" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => setScanRequested(true)}
              style={{ backgroundColor: PALETTE.rustySpice }}
              className="border-transparent text-white hover:opacity-90"
            >
              Scan menu
            </Button>
            <Button type="button" variant="outline" onClick={handleRemove}>
              Retry with another photo
            </Button>
          </div>

          {scanRequested && (
            <p role="status" style={{ color: PALETTE.oliveLeaf }} className="text-sm font-medium">
              Photo ready. Menu scanning isn&apos;t built yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
