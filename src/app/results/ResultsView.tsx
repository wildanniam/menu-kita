"use client";

import {
  AlertTriangleIcon,
  CheckIcon,
  ChevronDownIcon,
  ClipboardIcon,
  ExternalLinkIcon,
  SearchIcon,
  ShieldQuestionIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useAnalysisResult } from "@/lib/client";
import { buildDemoGroup } from "@/lib/data/demo-group";
import type {
  AnalysisResult,
  DietaryStatus,
  Dish,
  Evidence,
  FoodProfile,
  MemberDishCompatibility,
  RestaurantQuestion,
} from "@/lib/schemas";
import { useCurrentUserProfile } from "@/lib/storage/profile-storage";

const PALETTE = {
  rustySpice: "#AD390B",
  oliveLeaf: "#385610",
  champagneMist: "#F5E6C8",
  brandy: "#7C2D12",
  ochre: "#D97706",
};

const STATUS_META: Record<
  DietaryStatus,
  { label: string; className: string; dot: string }
> = {
  conflict: {
    label: "Conflict found",
    className: "border-red-200 bg-red-50 text-red-800",
    dot: "bg-red-600",
  },
  needs_confirmation: {
    label: "Needs confirmation",
    className: "border-amber-200 bg-amber-50 text-amber-900",
    dot: "bg-amber-500",
  },
  insufficient_information: {
    label: "Not enough information",
    className: "border-stone-200 bg-stone-50 text-stone-700",
    dot: "bg-stone-400",
  },
  compatible: {
    label: "No known conflict",
    className: "border-green-200 bg-green-50 text-green-800",
    dot: "bg-green-600",
  },
};

const EVIDENCE_LABEL: Record<Evidence["type"], string> = {
  menu_listed: "Listed on menu",
  common_usage: "Common usage",
  unresolved: "Still unresolved",
};

function EmptyState({ profileExists }: { profileExists: boolean }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-[#AD390B]/35 bg-white p-6 sm:p-8">
      <ShieldQuestionIcon className="mb-4 size-9 text-[#AD390B]" aria-hidden="true" />
      <h2 className="text-xl font-bold text-[#7C2D12]">
        {profileExists ? "Scan a menu to see live results" : "Create your profile first"}
      </h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-neutral-600">
        {profileExists
          ? "This page only shows validated results from the current browser session. No sample analysis is presented as live data."
          : "Complete the questionnaire so MenuKita can compare dishes with the whole group."}
      </p>
      <Button
        render={<Link href={profileExists ? "/scan" : "/onboarding"} />}
        style={{ backgroundColor: PALETTE.rustySpice }}
        className="mt-5 border-transparent text-white hover:opacity-90"
      >
        {profileExists ? "Scan a menu" : "Go to questionnaire"}
      </Button>
    </div>
  );
}

function DishTitle({ dish }: { dish: Dish }) {
  return (
    <div>
      <h3 className="text-xl font-extrabold text-[#7C2D12]">
        {dish.translatedName ?? dish.originalName}
      </h3>
      {dish.translatedName && dish.translatedName !== dish.originalName && (
        <p className="text-sm font-medium text-neutral-500">{dish.originalName}</p>
      )}
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-neutral-600">
        {dish.menuDescription && <span>{dish.menuDescription}</span>}
        {dish.price && <span className="font-bold text-[#385610]">{dish.price}</span>}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: DietaryStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${meta.className}`}
    >
      <span className={`size-2 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

function CompatibilityDetail({
  row,
  member,
  evidenceById,
}: {
  row: MemberDishCompatibility;
  member: FoodProfile;
  evidenceById: Map<string, Evidence>;
}) {
  const evidence = row.evidenceIds.flatMap((id) => {
    const item = evidenceById.get(id);
    return item ? [item] : [];
  });

  return (
    <details className="group rounded-xl border border-neutral-200 bg-white px-4 py-3 open:shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold text-neutral-900">
            {member.name}{member.isCurrentUser ? " (You)" : ""}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Preference fit {row.preferenceScore}/100
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={row.status} />
          <ChevronDownIcon
            className="size-4 text-neutral-400 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </div>
      </summary>

      <div className="mt-3 border-t border-neutral-100 pt-3 text-sm leading-6 text-neutral-700">
        <p>{row.summary}</p>
        {row.reasons.length > 0 && (
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {row.reasons.map((reason, reasonIndex) => (
              <li key={`${reasonIndex}-${reason}`}>{reason}</li>
            ))}
          </ul>
        )}
        {row.uncertainties.length > 0 && (
          <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-amber-950">
            <p className="font-bold">Still needs confirmation</p>
            <p>{row.uncertainties.join(", ")}</p>
          </div>
        )}
        {evidence.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-500">
              Evidence
            </p>
            {evidence.map((item) => (
              <div key={item.id} className="rounded-lg bg-neutral-50 px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-[#AD390B]">
                    {EVIDENCE_LABEL[item.type]}
                  </span>
                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#385610] underline-offset-2 hover:underline"
                    >
                      {item.sourceTitle ?? "Source"}
                      <ExternalLinkIcon className="size-3" aria-hidden="true" />
                    </a>
                  )}
                </div>
                <p className="mt-1 text-xs leading-5 text-neutral-600">{item.claim}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

function GroupRecommendation({
  result,
  profiles,
}: {
  result: AnalysisResult;
  profiles: FoodProfile[];
}) {
  const shared = result.recommendations.bestForEveryone;
  const dish = shared
    ? result.menu.dishes.find(({ id }) => id === shared.dishId)
    : undefined;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#385610] p-6 text-white shadow-[0_24px_70px_-35px_rgba(56,86,16,0.8)] sm:p-8">
      <div
        className="absolute -right-12 -top-12 size-40 rounded-full border-[28px] border-white/5"
        aria-hidden="true"
      />
      <div className="relative">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#F5E6C8]">
          <UsersIcon className="size-4" aria-hidden="true" />
          Best table-wide option
        </div>
        {shared && dish ? (
          <>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              {dish.translatedName ?? dish.originalName}
            </h2>
            {dish.translatedName && (
              <p className="mt-1 text-sm text-white/70">{dish.originalName}</p>
            )}
            <p className="mt-4 max-w-2xl leading-7 text-white/85">{shared.reason}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-white/12 px-3 py-1.5">
                {profiles.length} members considered
              </span>
              <span className="rounded-full bg-white/12 px-3 py-1.5">
                {shared.requiresConfirmation
                  ? "Confirmation still required"
                  : "No known hard conflict found"}
              </span>
            </div>
          </>
        ) : (
          <>
            <h2 className="mt-3 text-2xl font-extrabold">No single shared dish yet</h2>
            <p className="mt-3 max-w-2xl leading-7 text-white/85">
              {result.recommendations.noSharedDishReason}
            </p>
          </>
        )}
      </div>
    </section>
  );
}

function MemberFallbacks({
  result,
  profiles,
}: {
  result: AnalysisResult;
  profiles: FoodProfile[];
}) {
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const dishById = new Map(result.menu.dishes.map((dish) => [dish.id, dish]));

  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <SparklesIcon className="size-5 text-[#D97706]" aria-hidden="true" />
        <h2 className="text-xl font-extrabold text-[#7C2D12]">Best option per person</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {result.recommendations.perMember.map((recommendation) => {
          const profile = profileById.get(recommendation.profileId);
          const dish = recommendation.dishId
            ? dishById.get(recommendation.dishId)
            : undefined;
          return (
            <article
              key={recommendation.profileId}
              className="rounded-2xl border border-[#AD390B]/15 bg-white p-4"
            >
              <p className="text-sm font-bold text-neutral-500">
                {profile?.name ?? recommendation.profileId}
              </p>
              <p className="mt-1 text-lg font-extrabold text-[#385610]">
                {dish ? dish.translatedName ?? dish.originalName : "No suitable option found"}
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                {recommendation.reason}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function RestaurantQuestions({ questions }: { questions: RestaurantQuestion[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyQuestion(question: RestaurantQuestion) {
    const text = question.localized ?? question.english;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(question.id);
      window.setTimeout(() => setCopiedId(null), 2_000);
    } catch {
      setCopiedId(null);
    }
  }

  if (questions.length === 0) return null;

  return (
    <section className="rounded-3xl border border-[#D97706]/30 bg-[#fffaf0] p-5 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#D97706] text-white">
          <SearchIcon className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-extrabold text-[#7C2D12]">Ask the restaurant</h2>
          <p className="mt-1 text-sm leading-6 text-neutral-600">
            These questions cover details that general research cannot confirm about this restaurant.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {questions.map((question) => (
          <article key={question.id} className="rounded-2xl border border-[#D97706]/20 bg-white p-4">
            <p className="font-bold leading-6 text-neutral-900">{question.english}</p>
            {question.localized && (
              <div className="mt-3 rounded-xl bg-[#F5E6C8]/65 px-3 py-2.5">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#AD390B]">
                  {question.languageName}
                </p>
                <p className="mt-1 leading-6 text-neutral-800">{question.localized}</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => copyQuestion(question)}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-[#385610] hover:underline"
            >
              {copiedId === question.id ? (
                <CheckIcon className="size-4" aria-hidden="true" />
              ) : (
                <ClipboardIcon className="size-4" aria-hidden="true" />
              )}
              {copiedId === question.id ? "Copied" : "Copy question"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ResultsView() {
  const profile = useCurrentUserProfile();
  const result = useAnalysisResult();

  if (!profile || !result) {
    return <EmptyState profileExists={Boolean(profile)} />;
  }

  const group = buildDemoGroup(profile);
  const profileById = new Map(group.members.map((member) => [member.id, member]));
  const rowsByDish = new Map<string, MemberDishCompatibility[]>();
  for (const row of result.compatibility) {
    rowsByDish.set(row.dishId, [...(rowsByDish.get(row.dishId) ?? []), row]);
  }

  return (
    <div className="space-y-8">
      <GroupRecommendation result={result} profiles={group.members} />

      <section>
        <div className="mb-4">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#AD390B]">
            Group compatibility
          </p>
          <h2 className="mt-1 text-2xl font-extrabold text-[#7C2D12]">
            Every dish, every member
          </h2>
          <p className="mt-1 text-sm leading-6 text-neutral-600">
            Open a member row to inspect restriction reasons, preference fit, and evidence.
          </p>
        </div>

        <div className="space-y-5">
          {result.menu.dishes.map((dish) => {
            const evidenceById = new Map(
              dish.evidence.map((item) => [item.id, item]),
            );
            return (
              <article
                key={dish.id}
                className="rounded-3xl border border-[#AD390B]/15 bg-[#fffdf8] p-4 shadow-[0_18px_50px_-40px_rgba(124,45,18,0.65)] sm:p-6"
              >
                <DishTitle dish={dish} />
                {dish.listedIngredients.length > 0 && (
                  <p className="mt-3 text-xs leading-5 text-neutral-500">
                    <span className="font-bold text-neutral-700">Menu lists:</span>{" "}
                    {dish.listedIngredients.join(", ")}
                  </p>
                )}
                <div className="mt-4 grid gap-2 lg:grid-cols-2">
                  {(rowsByDish.get(dish.id) ?? []).map((row) => {
                    const member = profileById.get(row.profileId);
                    return member ? (
                      <CompatibilityDetail
                        key={row.profileId}
                        row={row}
                        member={member}
                        evidenceById={evidenceById}
                      />
                    ) : null;
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <MemberFallbacks result={result} profiles={group.members} />
      <RestaurantQuestions questions={result.restaurantQuestions} />

      <aside className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <AlertTriangleIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p>
          <strong>Use this as guidance, not a safety guarantee.</strong> MenuKita can identify known conflicts and common usage, but it cannot certify halal status, allergy safety, the restaurant&apos;s exact recipe, or cross-contamination. Confirm material uncertainties with restaurant staff.
        </p>
      </aside>
    </div>
  );
}
