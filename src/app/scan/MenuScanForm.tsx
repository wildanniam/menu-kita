"use client";

import { CameraIcon, CheckIcon, ImageUpIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AnimatedButton, AnimatedLinkButton } from "@/components/ui/animated-button";
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

function CameraCapture({
  onCapture,
  onCancel,
}: {
  onCapture: (file: File) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCameraError(
            "Couldn't access the camera. Check your browser's camera permission, or upload a photo instead.",
          );
        }
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function handleCapture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          return;
        }
        onCapture(new File([blob], "menu-photo.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  }

  if (cameraError) {
    return (
      <div
        className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed bg-white p-8 text-center"
        style={{ borderColor: PALETTE.brandy }}
      >
        <p className="text-sm text-neutral-700">{cameraError}</p>
        <AnimatedButton type="button" onClick={onCancel}>
          Back
        </AnimatedButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border-2 bg-black" style={{ borderColor: PALETTE.oliveLeaf }}>
        <video ref={videoRef} autoPlay playsInline muted className="max-h-96 w-full object-contain" />
      </div>
      <div className="flex flex-wrap gap-3">
        <AnimatedButton type="button" onClick={handleCapture}>
          <CameraIcon aria-hidden="true" />
          Capture
        </AnimatedButton>
        <AnimatedButton type="button" onClick={onCancel}>
          Cancel
        </AnimatedButton>
      </div>
    </div>
  );
}

export function MenuScanForm() {
  const router = useRouter();
  const profile = useCurrentUserProfile();
  const [image, setImage] = useState<SelectedImage | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (image) {
        URL.revokeObjectURL(image.previewUrl);
      }
    };
  }, [image]);

  function acceptFile(file: File) {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (image) {
      URL.revokeObjectURL(image.previewUrl);
    }
    setError(null);
    setCameraOpen(false);
    setImage({ file, previewUrl: URL.createObjectURL(file) });
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      acceptFile(file);
    }
  }

  function handleRemove() {
    if (image) {
      URL.revokeObjectURL(image.previewUrl);
    }
    setImage(null);
    setError(null);
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
        <AnimatedLinkButton href="/onboarding">
          Go to questionnaire
        </AnimatedLinkButton>
      </div>
    );
  }

  if (cameraOpen) {
    return <CameraCapture onCapture={acceptFile} onCancel={() => setCameraOpen(false)} />;
  }

  return (
    <div className="flex flex-col gap-4">
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
            <AnimatedButton type="button" onClick={() => setCameraOpen(true)}>
              <CameraIcon aria-hidden="true" />
              Take a photo
            </AnimatedButton>
            <AnimatedButton
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageUpIcon aria-hidden="true" />
              Upload from device
            </AnimatedButton>
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
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <AnimatedButton type="button" onClick={handleRemove}>
              <XIcon aria-hidden="true" />
              Retake photo
            </AnimatedButton>

            <AnimatedButton type="button" onClick={() => router.push("/analyzing")}>
              <CheckIcon aria-hidden="true" />
              Scan photo
            </AnimatedButton>
          </div>
        </div>
      )}
    </div>
  );
}
