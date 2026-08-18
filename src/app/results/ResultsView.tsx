"use client";

import { ChevronDownIcon, ClipboardIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  evaluateHardRestrictions,
  type RestrictionEvaluation,
} from "@/lib/compatibility";
import { buildDemoGroup } from "@/lib/data/demo-group";
import type { Dish, DietaryStatus, FoodProfile } from "@/lib/schemas";
import { useCurrentUserProfile } from "@/lib/storage/profile-storage";
import { dummyMenuDishes } from "./dummy-menu";

const PALETTE = {
  rustySpice: "#AD390B",
  oliveLeaf: "#385610",
  champagneMist: "#F5E6C8",
  brandy: "#7C2D12",
  ochre: "#D97706",
};

const STATUS_TEXT_CLASS: Record<DietaryStatus, string> = {
  conflict: "text-red-600",
  needs_confirmation: "text-amber-600",
  insufficient_information: "text-amber-600",
  compatible: "text-green-700",
};

const STATUS_LABEL: Record<DietaryStatus, string> = {
  conflict: "Cannot have",
  needs_confirmation: "Needs to ask",
  insufficient_information: "Needs to ask",
  compatible: "Can have",
};

const ALL_TAB_VALUE = "all";

function buildConfirmationQuestion(
  dish: Dish,
  evaluation: RestrictionEvaluation,
): string {
  const uncertainty = evaluation.uncertainties[0] ?? evaluation.reasons[0];
  if (uncertainty) {
    return `Could you confirm the ingredients and preparation for the ${dish.originalName}? Specifically: ${uncertainty}`;
  }
  return `Could you confirm the exact ingredients and preparation for the ${dish.originalName}?`;
}

function CopyQuestionButton({ question }: { question: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(question);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    setTimeout(() => setStatus("idle"), 1500);
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={handleCopy}>
      <ClipboardIcon aria-hidden="true" />
      {status === "copied"
        ? "Copied!"
        : status === "failed"
          ? "Couldn't copy - select the text above"
          : "Copy question"}
    </Button>
  );
}

function DishRow({
  dish,
  evaluation,
}: {
  dish: Dish;
  evaluation: RestrictionEvaluation;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = evaluation.reasons.length > 0;

  return (
    <li className="rounded-lg border border-neutral-200 bg-white">
      <button
        type="button"
        onClick={() => hasDetails && setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className={`font-medium ${STATUS_TEXT_CLASS[evaluation.status]}`}>
          {dish.originalName}
          <span className="sr-only"> &mdash; {STATUS_LABEL[evaluation.status]}</span>
        </span>
        {hasDetails && (
          <ChevronDownIcon
            aria-hidden="true"
            className={`size-4 shrink-0 text-neutral-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {expanded && hasDetails && (
        <div className="flex flex-col gap-2 border-t border-neutral-100 px-4 py-3">
          <ul className="flex flex-col gap-1 text-sm text-neutral-600">
            {evaluation.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>

          {(evaluation.status === "needs_confirmation" ||
            evaluation.status === "insufficient_information") && (
            <div className="flex flex-col gap-2 pt-1">
              <p className="text-sm text-neutral-800">
                {buildConfirmationQuestion(dish, evaluation)}
              </p>
              <div className="flex items-center gap-2">
                <CopyQuestionButton
                  question={buildConfirmationQuestion(dish, evaluation)}
                />
                <span className="text-xs text-neutral-500">
                  Local-language translation isn&apos;t connected yet &mdash; ask
                  in English or point to this text.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export function ResultsView() {
  const profile = useCurrentUserProfile();
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB_VALUE);

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

  const group = buildDemoGroup(profile);

  const evaluationByMember: Record<string, Record<string, RestrictionEvaluation>> = {};
  for (const member of group.members) {
    evaluationByMember[member.id] = {};
    for (const dish of dummyMenuDishes) {
      evaluationByMember[member.id][dish.id] = evaluateHardRestrictions(
        member,
        dish,
      );
    }
  }

  const everyoneCanHave = dummyMenuDishes.filter((dish) =>
    group.members.every(
      (member) => evaluationByMember[member.id][dish.id].status === "compatible",
    ),
  );

  const activeMember: FoodProfile | undefined = group.members.find(
    (member) => member.id === activeTab,
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="w-fit rounded-lg bg-white/90 px-3 py-1.5 text-xs text-neutral-500">
        Sample menu &mdash; live scanning isn&apos;t connected yet.
      </p>

      <ToggleGroup
        value={[activeTab]}
        onValueChange={(values) => {
          if (values[0]) setActiveTab(values[0]);
        }}
        aria-label="Choose a group member"
        className="flex flex-wrap gap-2"
      >
        {group.members.map((member) => (
          <ToggleGroupItem
            key={member.id}
            value={member.id}
            style={{ "--pill-accent": PALETTE.rustySpice } as React.CSSProperties}
            className="rounded-full border-2 border-[var(--pill-accent)] bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:text-white data-pressed:bg-[var(--pill-accent)] data-pressed:text-white"
          >
            {member.name}
            {member.isCurrentUser && " (You)"}
          </ToggleGroupItem>
        ))}
        <ToggleGroupItem
          value={ALL_TAB_VALUE}
          style={{ "--pill-accent": PALETTE.oliveLeaf } as React.CSSProperties}
          className="rounded-full border-2 border-[var(--pill-accent)] bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:text-white data-pressed:bg-[var(--pill-accent)] data-pressed:text-white"
        >
          All
        </ToggleGroupItem>
      </ToggleGroup>

      {activeTab === ALL_TAB_VALUE ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-neutral-800">
            Dishes everyone can have
          </h2>
          {everyoneCanHave.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {everyoneCanHave.map((dish) => (
                <li
                  key={dish.id}
                  className="rounded-lg border border-neutral-200 bg-white px-4 py-3 font-medium text-green-700"
                >
                  {dish.originalName}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-600">
              No dish works for everyone &mdash; check individual tabs.
            </p>
          )}
        </div>
      ) : (
        activeMember && (
          <ul className="flex flex-col gap-2">
            {dummyMenuDishes.map((dish) => (
              <DishRow
                key={dish.id}
                dish={dish}
                evaluation={evaluationByMember[activeMember.id][dish.id]}
              />
            ))}
          </ul>
        )
      )}

      <p className="rounded-lg bg-white/90 px-3 py-2 text-xs text-neutral-500">
        Not a guarantee of allergy or religious safety &mdash; confirm with
        staff.
      </p>
    </div>
  );
}
