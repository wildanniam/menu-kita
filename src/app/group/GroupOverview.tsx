"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CowIcon } from "@/components/icons/cow-icon";
import { FlameIcon } from "@/components/icons/flame-icon";
import { HalalIcon } from "@/components/icons/halal-icon";
import { LeafIcon } from "@/components/icons/leaf-icon";
import { LeafyGreenIcon } from "@/components/icons/leafy-green-icon";
import { SoupIcon } from "@/components/icons/soup-icon";
import { WheatIcon } from "@/components/icons/wheat-icon";
import { buildDemoGroup } from "@/lib/data/demo-group";
import type { FoodProfile, Group, SpiceTolerance } from "@/lib/schemas";
import { useCurrentUserProfile } from "@/lib/storage/profile-storage";
import { joinDemoGroup, useJoinedDemoGroup } from "@/lib/storage/group-storage";

const PALETTE = {
  rustySpice: "#AD390B",
  oliveLeaf: "#385610",
  champagneMist: "#F5E6C8",
  brandy: "#7C2D12",
  ochre: "#D97706",
};

const SPICE_META: Record<SpiceTolerance, { label: string; Icon: typeof LeafIcon; accent: string }> = {
  mild: { label: "Mild", Icon: LeafIcon, accent: PALETTE.ochre },
  medium: { label: "Medium", Icon: SoupIcon, accent: PALETTE.rustySpice },
  spicy: { label: "Spicy", Icon: FlameIcon, accent: PALETTE.brandy },
};

const DIETARY_ICONS: Record<string, typeof LeafyGreenIcon> = {
  halal: HalalIcon,
  vegan: LeafyGreenIcon,
  "gluten-free": WheatIcon,
  "no beef": CowIcon,
};

function MemberCard({ member }: { member: FoodProfile }) {
  const spice = SPICE_META[member.spiceTolerance];
  const SpiceIcon = spice.Icon;

  return (
    <li
      style={{ borderColor: member.isCurrentUser ? PALETTE.rustySpice : "#e5e5e5" }}
      className="flex flex-col gap-3 rounded-xl border-2 bg-white p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-neutral-900">{member.name}</h3>
        {member.isCurrentUser && (
          <Badge style={{ backgroundColor: PALETTE.rustySpice }} className="text-white">
            You
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-sm text-neutral-600">
        <SpiceIcon size={18} />
        {spice.label} spice tolerance
      </div>

      {(member.dietaryRequirements.length > 0 || member.allergies.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {member.dietaryRequirements.map((requirement) => {
            const Icon = DIETARY_ICONS[requirement.toLowerCase()];
            return (
              <Badge key={requirement} variant="outline" className="gap-1 bg-white text-sm">
                {Icon && <Icon size={14} />}
                {requirement}
              </Badge>
            );
          })}
          {member.allergies.map((allergy) => (
            <Badge
              key={allergy}
              style={{ backgroundColor: PALETTE.brandy }}
              className="text-sm text-white"
            >
              {allergy} allergy
            </Badge>
          ))}
        </div>
      )}

      {(member.likes.length > 0 || member.dislikes.length > 0) && (
        <div className="flex flex-col gap-0.5 text-xs text-neutral-500">
          {member.likes.length > 0 && <p>Likes: {member.likes.join(", ")}</p>}
          {member.dislikes.length > 0 && <p>Dislikes: {member.dislikes.join(", ")}</p>}
        </div>
      )}
    </li>
  );
}

function GroupSummary({ group }: { group: Group }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-neutral-900">{group.name}</h2>
        {group.description && (
          <p className="text-sm text-neutral-600">{group.description}</p>
        )}
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {group.members.map((member, index) => (
          <MemberCard key={`${index}-${member.id}`} member={member} />
        ))}
      </ul>

      <Button
        type="button"
        render={<Link href="/scan" />}
        style={{ backgroundColor: PALETTE.rustySpice }}
        className="w-full border-transparent text-white hover:opacity-90 sm:w-auto"
      >
        Start menu scan
      </Button>
    </div>
  );
}

export function GroupOverview() {
  const profile = useCurrentUserProfile();
  const joined = useJoinedDemoGroup();

  if (!profile) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-xl border-2 border-dashed bg-white p-6" style={{ borderColor: PALETTE.brandy }}>
        <p className="text-base text-neutral-700">
          Complete the questionnaire first so we know who&apos;s joining.
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
  if (!joined) {
    return (
      <section
        className="flex flex-col gap-5 rounded-2xl border-2 bg-white p-6"
        style={{ borderColor: PALETTE.oliveLeaf }}
      >
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] uppercase" style={{ color: PALETTE.rustySpice }}>
            Available group
          </p>
          <h2 className="mt-2 text-2xl font-bold text-neutral-900">{group.name}</h2>
          <p className="mt-1 text-sm text-neutral-600">{group.description}</p>
          <p className="mt-3 text-sm font-medium text-neutral-700">
            {group.members.length} diners · preset demo group
          </p>
        </div>
        <Button
          type="button"
          onClick={joinDemoGroup}
          style={{ backgroundColor: PALETTE.rustySpice }}
          className="w-full border-transparent text-white hover:opacity-90 sm:w-fit"
        >
          Join {group.name}
        </Button>
      </section>
    );
  }

  return <GroupSummary group={group} />;
}
