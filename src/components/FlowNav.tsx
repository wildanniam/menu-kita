"use client";

import Link from "next/link";
import { RotateCcwIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { clearAnalysisResult, useAnalysisResult } from "@/lib/client";
import {
  clearCurrentUserProfile,
  useCurrentUserProfile,
} from "@/lib/storage/profile-storage";
import { cn } from "@/lib/utils";

const PALETTE = {
  rustySpice: "#AD390B",
};

const STEPS = [
  { href: "/onboarding", label: "Preferences" },
  { href: "/group", label: "Group" },
  { href: "/scan", label: "Scan" },
  { href: "/results", label: "Results" },
] as const;

export function FlowNav({ current }: { current: (typeof STEPS)[number]["href"] }) {
  const router = useRouter();
  const profile = useCurrentUserProfile();
  const analysis = useAnalysisResult();

  function resetSession() {
    clearAnalysisResult();
    clearCurrentUserProfile();
    router.replace("/onboarding");
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <nav aria-label="Flow steps" className="flex flex-wrap gap-2">
        {STEPS.map((step) => {
          const active = step.href === current;
          const disabled =
            (step.href === "/group" || step.href === "/scan") && !profile
              ? true
              : step.href === "/results" && !analysis;
          return (
            <Link
              key={step.href}
              href={disabled ? current : step.href}
              aria-current={active ? "page" : undefined}
              aria-disabled={disabled || undefined}
              tabIndex={disabled ? -1 : undefined}
              style={
                active
                  ? {
                      backgroundColor: PALETTE.rustySpice,
                      borderColor: PALETTE.rustySpice,
                    }
                  : { borderColor: PALETTE.rustySpice }
              }
              className={cn(
                "rounded-full border-2 bg-white px-3 py-1.5 text-sm font-medium transition-colors",
                active ? "text-white" : "text-neutral-700 hover:bg-neutral-50",
                disabled && "cursor-not-allowed opacity-35 hover:bg-white",
              )}
            >
              {step.label}
            </Link>
          );
        })}
      </nav>

      {(profile || analysis) && (
        <button
          type="button"
          onClick={resetSession}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-semibold text-[#7C2D12] transition-colors hover:bg-white/70"
        >
          <RotateCcwIcon className="size-3.5" aria-hidden="true" />
          Start over
        </button>
      )}
    </div>
  );
}
