"use client";

import { CameraIcon, CheckIcon, ImageUpIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  AnalysisClientError,
  analyzeMenuImage,
  clearAnalysisResult,
  saveAnalysisResult,
} from "@/lib/client";
import type { AnalysisStageEvent } from "@/lib/schemas";
import { useCurrentUserProfile } from "@/lib/storage/profile-storage";
import { AnalysisProgress } from "./AnalysisProgress";

const PALETTE = {
  rustySpice: "#AD390B",
  oliveLeaf: "#385610",
  champagneMist: "#F5E6C8",
  brandy: "#7C2D12",
  ochre: "#D97706",
};

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface SelectedImage {
  file: File;
  previewUrl: string;
}

function validateFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Please choose a JPEG, PNG, or WebP image.";
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
        <Button type="button" variant="outline" onClick={onCancel}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border-2 bg-black" style={{ borderColor: PALETTE.oliveLeaf }}>
        <video ref={videoRef} autoPlay playsInline muted className="max-h-96 w-full object-contain" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={handleCapture}
          style={{ backgroundColor: PALETTE.rustySpice }}
          className="border-transparent text-white hover:opacity-90"
        >
          <CameraIcon aria-hidden="true" />
          Capture
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stageEvents, setStageEvents] = useState<AnalysisStageEvent[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
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
    setStageEvents([]);
    clearAnalysisResult();
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
    setStageEvents([]);
    clearAnalysisResult();
  }

  async function handleAnalyze() {
    if (!image || !profile || isAnalyzing) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setError(null);
    setStageEvents([]);
    setIsAnalyzing(true);
    clearAnalysisResult();

    try {
      const result = await analyzeMenuImage({
        image: image.file,
        profile,
        signal: controller.signal,
        onStage: (event) => {
          setStageEvents((current) => [...current, event]);
        },
      });
      saveAnalysisResult(result);
      router.push("/results");
    } catch (caught) {
      setError(
        caught instanceof AnalysisClientError
          ? caught.message
          : "We could not analyze this menu. Please try again.",
      );
    } finally {
      abortControllerRef.current = null;
      setIsAnalyzing(false);
    }
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

  if (cameraOpen) {
    return <CameraCapture onCapture={acceptFile} onCancel={() => setCameraOpen(false)} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {isAnalyzing ? (
        <AnalysisProgress events={stageEvents} />
      ) : !image ? (
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
              onClick={() => setCameraOpen(true)}
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
          </div>

          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-1.5">
              <Button
                type="button"
                size="icon-lg"
                aria-label="Retake photo"
                onClick={handleRemove}
                className="rounded-full border-transparent bg-neutral-700 text-white hover:opacity-90"
              >
                <XIcon aria-hidden="true" />
              </Button>
              <span className="text-xs text-neutral-600">Retake photo</span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <Button
                type="button"
                size="icon-lg"
                aria-label="Scan photo"
                onClick={handleAnalyze}
                style={{ backgroundColor: PALETTE.oliveLeaf }}
                className="rounded-full border-transparent text-white hover:opacity-90"
              >
                <CheckIcon aria-hidden="true" />
              </Button>
              <span className="text-xs text-neutral-600">Scan photo</span>
            </div>
          </div>
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              <p>{error}</p>
              <p className="mt-1 text-xs text-red-700">
                Keep this photo to retry, or retake it if the menu is unclear.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
