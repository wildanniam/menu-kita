"use client";

import { RotateCcwIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { clearCurrentUserProfile } from "@/lib/storage/profile-storage";

export function ResetJourneyButton() {
  const router = useRouter();

  function handleReset() {
    clearCurrentUserProfile();
    router.push("/onboarding");
  }

  return (
    <button
      type="button"
      onClick={handleReset}
      className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800"
    >
      <RotateCcwIcon aria-hidden="true" className="size-3.5" />
      Start over (new person)
    </button>
  );
}
