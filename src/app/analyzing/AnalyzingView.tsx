"use client";

import { CheckIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { demoAnalysisStream } from "@/lib/fixtures";
import { useCurrentUserProfile } from "@/lib/storage/profile-storage";

const PALETTE = {
  rustySpice: "#AD390B",
  oliveLeaf: "#385610",
  brandy: "#7C2D12",
};

const STAGE_STEPS = demoAnalysisStream
  .filter((event) => event.type === "stage")
  .map((event) => ({ stage: event.stage, message: event.message }));

const STAGE_DELAY_MS = 900;

export function AnalyzingView() {
  const router = useRouter();
  const profile = useCurrentUserProfile();
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!profile) {
      return;
    }

    const timeout = setTimeout(
      () => {
        if (stepIndex < STAGE_STEPS.length) {
          setStepIndex((index) => index + 1);
        } else {
          router.push("/results");
        }
      },
      STAGE_DELAY_MS,
    );

    return () => clearTimeout(timeout);
  }, [stepIndex, profile, router]);

  if (!profile) {
    return (
      <div
        className="flex flex-col items-start gap-4 rounded-xl border-2 border-dashed bg-white p-6"
        style={{ borderColor: PALETTE.brandy }}
      >
        <p className="text-base text-neutral-700">
          Complete the questionnaire first so we know who&apos;s eating.
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
      <p className="w-fit rounded-lg bg-white/90 px-3 py-1.5 text-xs text-neutral-500">
        Preview using a sample analysis sequence &mdash; live streaming
        isn&apos;t connected yet.
      </p>

      <ul className="flex flex-col gap-2">
        {STAGE_STEPS.map((step, index) => {
          const done = index < stepIndex;
          const active = index === stepIndex;

          return (
            <li
              key={step.stage}
              className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3"
            >
              {done ? (
                <span
                  style={{ backgroundColor: PALETTE.oliveLeaf }}
                  className="flex size-5 shrink-0 items-center justify-center rounded-full text-white"
                >
                  <CheckIcon aria-hidden="true" className="size-3.5" />
                </span>
              ) : active ? (
                <Spinner
                  style={{ color: PALETTE.rustySpice }}
                  className="size-5 shrink-0"
                />
              ) : (
                <span className="size-5 shrink-0 rounded-full border-2 border-neutral-300" />
              )}
              <span
                className={
                  done || active
                    ? "font-medium text-neutral-900"
                    : "text-neutral-400"
                }
              >
                {step.message}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
