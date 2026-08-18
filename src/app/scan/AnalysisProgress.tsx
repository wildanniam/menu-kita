import { CheckIcon, LoaderCircleIcon, SearchIcon, SparklesIcon } from "lucide-react";

import type { AnalysisStage, AnalysisStageEvent } from "@/lib/schemas";

const ORDER: AnalysisStage[] = [
  "reading_menu",
  "checking_evidence",
  "researching_dishes",
  "matching_profiles",
  "preparing_recommendations",
  "complete",
];

const LABELS: Record<AnalysisStage, string> = {
  reading_menu: "Reading the menu",
  checking_evidence: "Checking visible evidence",
  researching_dishes: "Researching material unknowns",
  matching_profiles: "Matching all five profiles",
  preparing_recommendations: "Preparing recommendations",
  complete: "Analysis complete",
  failed: "Analysis stopped",
};

export function AnalysisProgress({ events }: { events: AnalysisStageEvent[] }) {
  const received = new Set(events.map(({ stage }) => stage));
  const current = events.at(-1);
  const visibleStages = ORDER.filter(
    (stage) => stage !== "researching_dishes" || received.has(stage),
  );
  const currentIndex = current ? visibleStages.indexOf(current.stage) : 0;

  return (
    <section
      aria-live="polite"
      aria-label="Menu analysis progress"
      className="overflow-hidden rounded-2xl border border-[#AD390B]/20 bg-white shadow-[0_20px_60px_-35px_rgba(124,45,18,0.55)]"
    >
      <div className="flex items-center gap-3 border-b border-[#AD390B]/10 bg-[#fffaf0] px-5 py-4">
        <span className="grid size-10 place-items-center rounded-full bg-[#AD390B] text-white">
          <SparklesIcon className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-bold text-[#7C2D12]">Finding a table-wide match</h2>
          <p className="text-sm text-neutral-600">
            {current?.message ?? "Starting the analysis…"}
          </p>
        </div>
      </div>

      <ol className="grid gap-1 p-4 sm:grid-cols-2">
        {visibleStages.map((stage, index) => {
          const completed = received.has(stage) && index < currentIndex;
          const active = stage === current?.stage;
          return (
            <li
              key={stage}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                active ? "bg-[#F5E6C8] text-[#7C2D12]" : "text-neutral-500"
              }`}
            >
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full border ${
                  completed
                    ? "border-[#385610] bg-[#385610] text-white"
                    : active
                      ? "border-[#AD390B] text-[#AD390B]"
                      : "border-neutral-200 bg-white"
                }`}
              >
                {completed ? (
                  <CheckIcon className="size-4" aria-hidden="true" />
                ) : active ? (
                  <LoaderCircleIcon
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <SearchIcon className="size-3.5" aria-hidden="true" />
                )}
              </span>
              {LABELS[stage]}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
