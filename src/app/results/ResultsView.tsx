"use client";

import {
  AlertTriangleIcon,
  CheckIcon,
  ChevronDownIcon,
  ClipboardIcon,
  ExternalLinkIcon,
  FlameIcon,
  HeartIcon,
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
import {
  ALL_MEMBERS_SELECTION,
  getMemberCompatibility,
  getMemberRecommendation,
  getQuestionMemberNames,
  getQuestionsForSelection,
  getRowsByDish,
  shouldShowRestaurantQuestions,
  type ResultSelection,
} from "@/lib/results/result-selectors";
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
    <div className="rounded-3xl border-2 border-dashed border-[#AD390B]/35 bg-white/95 p-6 sm:p-8">
      <ShieldQuestionIcon className="mb-4 size-9 text-[#AD390B]" aria-hidden="true" />
      <h2 className="text-xl font-bold text-[#7C2D12]">
        {profileExists ? "Scan a menu to see live results" : "Create your profile first"}
      </h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-neutral-600">
        {profileExists
          ? "This page only shows validated results from the current browser session."
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

function StatusBadge({ status }: { status: DietaryStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${meta.className}`}
    >
      <span className={`size-2 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

function DishName({ dish }: { dish: Dish }) {
  return (
    <div className="min-w-0">
      <h3 className="truncate text-base font-extrabold text-[#385610] sm:text-lg">
        {dish.translatedName ?? dish.originalName}
      </h3>
      {dish.translatedName && dish.translatedName !== dish.originalName && (
        <p className="truncate text-xs font-medium text-neutral-500">{dish.originalName}</p>
      )}
    </div>
  );
}

function CompatibilityBody({
  row,
  dish,
}: {
  row: MemberDishCompatibility;
  dish: Dish;
}) {
  const evidenceById = new Map(dish.evidence.map((item) => [item.id, item]));
  const evidence = row.evidenceIds.flatMap((id) => {
    const item = evidenceById.get(id);
    return item ? [item] : [];
  });

  return (
    <div className="border-t border-neutral-100 px-4 pb-4 pt-4 text-sm leading-6 text-neutral-700 sm:px-5">
      <p>{row.summary}</p>
      {row.reasons.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {row.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
      {row.triggeredRestrictions.length > 0 && (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-red-900">
          <strong>Restriction involved:</strong> {row.triggeredRestrictions.join(", ")}
        </p>
      )}
      {row.uncertainties.length > 0 && (
        <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-amber-950">
          <p className="font-bold">Still needs confirmation</p>
          <p>{row.uncertainties.join(", ")}</p>
        </div>
      )}
      {dish.listedIngredients.length > 0 && (
        <p className="mt-3 text-neutral-600">
          <strong className="text-neutral-800">Menu lists:</strong>{" "}
          {dish.listedIngredients.join(", ")}
        </p>
      )}
      {evidence.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-500">
            Evidence
          </p>
          {evidence.map((item) => (
            <div key={item.id} className="rounded-xl bg-neutral-50 px-3 py-2">
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
  );
}

function MemberDishDisclosure({
  dish,
  row,
  recommended,
}: {
  dish: Dish;
  row: MemberDishCompatibility;
  recommended: boolean;
}) {
  return (
    <details
      className="group overflow-hidden rounded-2xl border border-[#AD390B]/15 bg-white shadow-[0_14px_36px_-32px_rgba(124,45,18,0.8)] open:border-[#AD390B]/30"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#AD390B] sm:px-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <DishName dish={dish} />
            {recommended && (
              <span className="hidden rounded-full bg-[#385610] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white sm:inline-flex">
                Best match
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
            {dish.price && <span className="font-bold text-[#7C2D12]">{dish.price}</span>}
            <span>Preference fit {row.preferenceScore}/100</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={row.status} />
          <ChevronDownIcon
            className="size-4 shrink-0 text-neutral-400 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </div>
      </summary>
      <CompatibilityBody row={row} dish={dish} />
    </details>
  );
}

function MemberRow({
  row,
  member,
  dish,
}: {
  row: MemberDishCompatibility;
  member: FoodProfile;
  dish: Dish;
}) {
  return (
    <details className="group rounded-xl border border-neutral-200 bg-white open:shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#AD390B]">
        <div className="min-w-0">
          <p className="truncate font-bold text-neutral-900">
            {member.name}{member.isCurrentUser ? " (You)" : ""}
          </p>
          <p className="text-xs text-neutral-500">Preference fit {row.preferenceScore}/100</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={row.status} />
          <ChevronDownIcon
            className="size-4 text-neutral-400 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </div>
      </summary>
      <CompatibilityBody row={row} dish={dish} />
    </details>
  );
}

function AllDishDisclosure({
  dish,
  rows,
  profileById,
}: {
  dish: Dish;
  rows: MemberDishCompatibility[];
  profileById: Map<string, FoodProfile>;
}) {
  const counts = rows.reduce<Partial<Record<DietaryStatus, number>>>((summary, row) => {
    summary[row.status] = (summary[row.status] ?? 0) + 1;
    return summary;
  }, {});

  return (
    <details className="group overflow-hidden rounded-2xl border border-[#AD390B]/15 bg-white shadow-[0_14px_36px_-32px_rgba(124,45,18,0.8)] open:border-[#AD390B]/30">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#AD390B] sm:px-5">
        <div className="min-w-0 flex-1">
          <DishName dish={dish} />
          {dish.price && <p className="mt-1 text-xs font-bold text-[#7C2D12]">{dish.price}</p>}
        </div>
        <div className="hidden flex-wrap justify-end gap-1.5 md:flex">
          {Object.entries(counts).map(([status, count]) => (
            <span
              key={status}
              className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${STATUS_META[status as DietaryStatus].className}`}
            >
              {count} {STATUS_META[status as DietaryStatus].label.toLowerCase()}
            </span>
          ))}
        </div>
        <ChevronDownIcon
          className="size-4 shrink-0 text-neutral-400 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="grid gap-2 border-t border-neutral-100 bg-[#fffdf8] p-3 sm:grid-cols-2 sm:p-4">
        {rows.map((row) => {
          const member = profileById.get(row.profileId);
          return member ? (
            <MemberRow key={row.profileId} row={row} member={member} dish={dish} />
          ) : null;
        })}
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
    <section className="relative overflow-hidden rounded-3xl bg-[#385610] p-5 text-white shadow-[0_24px_70px_-35px_rgba(56,86,16,0.8)] sm:p-7">
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
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
              {dish.translatedName ?? dish.originalName}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">
              {shared.reason}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
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
            <h2 className="mt-2 text-2xl font-extrabold">No single shared dish yet</h2>
            <p className="mt-3 max-w-2xl leading-7 text-white/85">
              {result.recommendations.noSharedDishReason}
            </p>
          </>
        )}
      </div>
    </section>
  );
}

function MemberOverview({
  member,
  result,
}: {
  member: FoodProfile;
  result: AnalysisResult;
}) {
  const recommendation = getMemberRecommendation(result, member.id);
  const dish = recommendation?.dishId
    ? result.menu.dishes.find((item) => item.id === recommendation.dishId)
    : undefined;

  return (
    <section className="grid overflow-hidden rounded-3xl border border-[#AD390B]/15 bg-white/95 lg:grid-cols-[1.35fr_1fr]">
      <article className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#AD390B]">
            {member.name}{member.isCurrentUser ? " · Your profile" : " · Food profile"}
          </p>
          {[...member.dietaryRequirements, ...member.allergies].map((item) => (
            <span
              key={item}
              className="rounded-full border border-[#AD390B]/20 bg-[#F5E6C8]/55 px-2 py-0.5 text-[11px] font-bold text-[#7C2D12]"
            >
              {item}
            </span>
          ))}
        </div>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          <div>
            <p className="flex items-center gap-1.5 font-bold text-[#7C2D12]">
              <HeartIcon className="size-4" aria-hidden="true" /> Likes
            </p>
            <p className="mt-1 leading-5 text-neutral-600">
              {member.likes.length > 0 ? member.likes.join(", ") : "No favorites added"}
            </p>
          </div>
          <div>
            <p className="font-bold text-[#7C2D12]">Dislikes</p>
            <p className="mt-1 leading-5 text-neutral-600">
              {member.dislikes.length > 0 ? member.dislikes.join(", ") : "None added"}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 font-bold text-[#7C2D12]">
              <FlameIcon className="size-4" aria-hidden="true" /> Spice
            </p>
            <p className="mt-1 capitalize leading-5 text-neutral-600">{member.spiceTolerance}</p>
          </div>
        </div>
      </article>

      <article className="relative overflow-hidden bg-[#385610] p-4 text-white sm:p-5">
        <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#F5E6C8]">
          <SparklesIcon className="size-4" aria-hidden="true" />
          Best option for {member.name}
        </p>
        <h2 className="mt-1 text-xl font-extrabold sm:text-2xl">
          {dish ? dish.translatedName ?? dish.originalName : "No suitable option found"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/85">
          {recommendation?.reason ?? "The current result did not include an individual fallback."}
        </p>
      </article>
    </section>
  );
}

function RestaurantQuestions({
  questions,
  memberName,
  profiles,
}: {
  questions: RestaurantQuestion[];
  memberName?: string;
  profiles: FoodProfile[];
}) {
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

  return (
    <section className="rounded-3xl border border-[#D97706]/30 bg-[#fffaf0]/95 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#D97706] text-white">
          <SearchIcon className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-extrabold text-[#7C2D12]">Ask the restaurant</h2>
          <p className="mt-1 text-sm leading-6 text-neutral-600">
            {memberName
              ? `Only questions relevant to ${memberName} are shown here.`
              : "These questions cover details general research cannot confirm for the group."}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {questions.map((question) => {
          const affectedMembers = getQuestionMemberNames(question, profiles);
          return (
            <article key={question.id} className="rounded-2xl border border-[#D97706]/20 bg-white p-4">
              {!memberName && affectedMembers.length > 0 && (
                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#AD390B]">
                  For {affectedMembers.join(", ")}
                </p>
              )}
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
                className="mt-3 inline-flex items-center gap-1.5 rounded-md text-sm font-bold text-[#385610] outline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[#385610]"
              >
                {copiedId === question.id ? (
                  <CheckIcon className="size-4" aria-hidden="true" />
                ) : (
                  <ClipboardIcon className="size-4" aria-hidden="true" />
                )}
                {copiedId === question.id ? "Copied" : "Copy question"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SafetyNotice() {
  return (
    <aside className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50/95 p-4 text-sm leading-6 text-amber-950">
      <AlertTriangleIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <p>
        <strong>Use this as guidance, not a safety guarantee.</strong> MenuKita can identify known conflicts and common usage, but it cannot certify halal status, allergy safety, the restaurant&apos;s exact recipe, or cross-contamination. Confirm material uncertainties with restaurant staff.
      </p>
    </aside>
  );
}

function ResultExplorer({
  profile,
  result,
}: {
  profile: FoodProfile;
  result: AnalysisResult;
}) {
  const [selection, setSelection] = useState<ResultSelection>(profile.id);
  const group = buildDemoGroup(profile);
  const profileById = new Map(group.members.map((member) => [member.id, member]));
  const dishById = new Map(result.menu.dishes.map((dish) => [dish.id, dish]));
  const rowsByDish = getRowsByDish(result);
  const selectedMember =
    selection === ALL_MEMBERS_SELECTION ? undefined : profileById.get(selection);
  const selectedRows = selectedMember
    ? getMemberCompatibility(result, selectedMember.id)
    : [];
  const selectedRecommendation = selectedMember
    ? getMemberRecommendation(result, selectedMember.id)
    : undefined;
  const questions = getQuestionsForSelection(result, selection);

  return (
    <div>
      <div
        role="tablist"
        aria-label="Choose whose menu matches to view"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-3 [scrollbar-width:thin]"
      >
        {group.members.map((member) => {
          const active = selection === member.id;
          return (
            <button
              key={member.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls="results-selection-panel"
              onClick={() => setSelection(member.id)}
              className={`shrink-0 rounded-full border-2 px-4 py-2 text-sm font-bold outline-offset-2 transition-colors focus-visible:outline-2 focus-visible:outline-[#385610] ${
                active
                  ? "border-[#AD390B] bg-[#AD390B] text-white"
                  : "border-[#AD390B] bg-white text-[#7C2D12] hover:bg-[#fffaf0]"
              }`}
            >
              {member.name}{member.isCurrentUser ? " (You)" : ""}
            </button>
          );
        })}
        <button
          type="button"
          role="tab"
          aria-selected={selection === ALL_MEMBERS_SELECTION}
          aria-controls="results-selection-panel"
          onClick={() => setSelection(ALL_MEMBERS_SELECTION)}
          className={`shrink-0 rounded-full border-2 px-4 py-2 text-sm font-bold outline-offset-2 transition-colors focus-visible:outline-2 focus-visible:outline-[#385610] ${
            selection === ALL_MEMBERS_SELECTION
              ? "border-[#385610] bg-[#385610] text-white"
              : "border-[#385610] bg-white text-[#385610] hover:bg-green-50"
          }`}
        >
          All
        </button>
      </div>

      <div
        id="results-selection-panel"
        role="tabpanel"
        className="mt-3 space-y-6 focus:outline-none"
      >
        {selectedMember ? (
          <>
            <MemberOverview member={selectedMember} result={result} />
            <section>
              <div className="mb-3">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#AD390B]">
                  {selectedMember.name}&apos;s menu matches
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-[#7C2D12]">
                  Open a dish for the details
                </h2>
              </div>
              <div className="space-y-2.5">
                {selectedRows.map((row) => {
                  const dish = dishById.get(row.dishId);
                  return dish ? (
                    <MemberDishDisclosure
                      key={`${selectedMember.id}-${row.dishId}`}
                      dish={dish}
                      row={row}
                      recommended={row.dishId === selectedRecommendation?.dishId}
                    />
                  ) : null;
                })}
              </div>
            </section>
            {shouldShowRestaurantQuestions(questions) && (
              <RestaurantQuestions
                questions={questions}
                memberName={selectedMember.name}
                profiles={group.members}
              />
            )}
          </>
        ) : (
          <>
            <GroupRecommendation result={result} profiles={group.members} />
            <section>
              <div className="mb-3">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#AD390B]">
                  Group compatibility
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-[#7C2D12]">
                  Every dish, everyone—kept compact
                </h2>
                <p className="mt-1 text-sm leading-6 text-neutral-600">
                  Open a dish, then a member, to inspect the complete reasoning and evidence.
                </p>
              </div>
              <div className="space-y-2.5">
                {result.menu.dishes.map((dish) => (
                  <AllDishDisclosure
                    key={dish.id}
                    dish={dish}
                    rows={rowsByDish.get(dish.id) ?? []}
                    profileById={profileById}
                  />
                ))}
              </div>
            </section>
            {shouldShowRestaurantQuestions(questions) && (
              <RestaurantQuestions questions={questions} profiles={group.members} />
            )}
          </>
        )}
        <SafetyNotice />
      </div>
    </div>
  );
}

export function ResultsView() {
  const profile = useCurrentUserProfile();
  const result = useAnalysisResult();

  if (!profile || !result) {
    return <EmptyState profileExists={Boolean(profile)} />;
  }

  return <ResultExplorer profile={profile} result={result} />;
}
