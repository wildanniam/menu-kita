"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { evaluateHardRestrictions } from "@/lib/compatibility";
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

function DishRow({ dish, status }: { dish: Dish; status: DietaryStatus }) {
  return (
    <li className="rounded-lg border border-neutral-200 bg-white px-4 py-3">
      <span className={`font-medium ${STATUS_TEXT_CLASS[status]}`}>
        {dish.originalName}
        <span className="sr-only"> &mdash; {STATUS_LABEL[status]}</span>
      </span>
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

  const statusByMember: Record<string, Record<string, DietaryStatus>> = {};
  for (const member of group.members) {
    statusByMember[member.id] = {};
    for (const dish of dummyMenuDishes) {
      statusByMember[member.id][dish.id] = evaluateHardRestrictions(
        member,
        dish,
      ).status;
    }
  }

  const everyoneCanHave = dummyMenuDishes.filter((dish) =>
    group.members.every(
      (member) => statusByMember[member.id][dish.id] === "compatible",
    ),
  );

  const activeMember: FoodProfile | undefined = group.members.find(
    (member) => member.id === activeTab,
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-neutral-500">
        Using a sample menu for this demo &mdash; live photo scanning isn&apos;t
        connected yet. Results below use the real compatibility rules.
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
              No single dish works for the whole group &mdash; check individual
              tabs for what each person can eat.
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
                status={statusByMember[activeMember.id][dish.id]}
              />
            ))}
          </ul>
        )
      )}
    </div>
  );
}
