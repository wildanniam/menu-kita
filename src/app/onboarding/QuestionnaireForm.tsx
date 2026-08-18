"use client";

import { XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  forwardRef,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CowIcon, type CowIconHandle } from "@/components/icons/cow-icon";
import { FlameIcon, type FlameIconHandle } from "@/components/icons/flame-icon";
import { HalalIcon, type HalalIconHandle } from "@/components/icons/halal-icon";
import { LeafIcon, type LeafIconHandle } from "@/components/icons/leaf-icon";
import {
  LeafyGreenIcon,
  type LeafyGreenIconHandle,
} from "@/components/icons/leafy-green-icon";
import { SoupIcon, type SoupIconHandle } from "@/components/icons/soup-icon";
import { WheatIcon, type WheatIconHandle } from "@/components/icons/wheat-icon";
import type { FoodProfile, SpiceTolerance } from "@/lib/schemas";
import { foodProfileSchema } from "@/lib/schemas";
import {
  saveCurrentUserProfile,
  useCurrentUserProfile,
} from "@/lib/storage/profile-storage";
import { clearJoinedDemoGroup } from "@/lib/storage/group-storage";

type TagListField = "dietaryRequirements" | "allergies" | "likes" | "dislikes";

interface FormErrors {
  name?: string;
  spiceTolerance?: string;
}

const PALETTE = {
  rustySpice: "#AD390B",
  oliveLeaf: "#385610",
  champagneMist: "#F5E6C8",
  brandy: "#7C2D12",
  ochre: "#D97706",
};

const PILL_CLASS =
  "rounded-full border-2 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:text-white data-pressed:text-white";

function DietaryQuickAddChips({
  values,
  onValueChange,
}: {
  values: string[];
  onValueChange: (values: string[]) => void;
}) {
  const halalIconRef = useRef<HalalIconHandle>(null);
  const veganIconRef = useRef<LeafyGreenIconHandle>(null);
  const glutenFreeIconRef = useRef<WheatIconHandle>(null);
  const noBeefIconRef = useRef<CowIconHandle>(null);

  return (
    <ToggleGroup
      multiple
      value={values}
      onValueChange={onValueChange}
      aria-label="Dietary requirement quick-add"
      className="flex flex-wrap gap-2"
    >
      <ToggleGroupItem
        value="halal"
        onMouseEnter={() => halalIconRef.current?.startAnimation()}
        onMouseLeave={() => halalIconRef.current?.stopAnimation()}
        style={{ "--pill-accent": PALETTE.rustySpice } as React.CSSProperties}
        className={`${PILL_CLASS} border-[var(--pill-accent)] hover:bg-[var(--pill-accent)] data-pressed:bg-[var(--pill-accent)] data-pressed:border-[var(--pill-accent)]`}
      >
        <HalalIcon ref={halalIconRef} size={18} />
        Halal
      </ToggleGroupItem>

      <ToggleGroupItem
        value="vegan"
        onMouseEnter={() => veganIconRef.current?.startAnimation()}
        onMouseLeave={() => veganIconRef.current?.stopAnimation()}
        style={{ "--pill-accent": PALETTE.oliveLeaf } as React.CSSProperties}
        className={`${PILL_CLASS} border-[var(--pill-accent)] hover:bg-[var(--pill-accent)] data-pressed:bg-[var(--pill-accent)] data-pressed:border-[var(--pill-accent)]`}
      >
        <LeafyGreenIcon ref={veganIconRef} size={18} />
        Vegan
      </ToggleGroupItem>

      <ToggleGroupItem
        value="gluten-free"
        onMouseEnter={() => glutenFreeIconRef.current?.startAnimation()}
        onMouseLeave={() => glutenFreeIconRef.current?.stopAnimation()}
        style={{ "--pill-accent": PALETTE.ochre } as React.CSSProperties}
        className={`${PILL_CLASS} border-[var(--pill-accent)] hover:bg-[var(--pill-accent)] data-pressed:bg-[var(--pill-accent)] data-pressed:border-[var(--pill-accent)]`}
      >
        <WheatIcon ref={glutenFreeIconRef} size={18} />
        Gluten-free
      </ToggleGroupItem>

      <ToggleGroupItem
        value="no beef"
        onMouseEnter={() => noBeefIconRef.current?.startAnimation()}
        onMouseLeave={() => noBeefIconRef.current?.stopAnimation()}
        style={{ "--pill-accent": PALETTE.brandy } as React.CSSProperties}
        className={`${PILL_CLASS} border-[var(--pill-accent)] hover:bg-[var(--pill-accent)] data-pressed:bg-[var(--pill-accent)] data-pressed:border-[var(--pill-accent)]`}
      >
        <CowIcon ref={noBeefIconRef} size={18} />
        No beef
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

const CURRENT_USER_ID = "current-user";

export interface TagListInputHandle {
  /** Returns any typed-but-not-added text, so callers can include it before it's lost. */
  getPendingDraft: () => string;
}

const TagListInput = forwardRef<
  TagListInputHandle,
  {
    label: string;
    placeholder: string;
    values: string[];
    onChange: (values: string[]) => void;
    quickAdd?: ReactNode;
  }
>(function TagListInput({ label, placeholder, values, onChange, quickAdd }, ref) {
  const [draft, setDraft] = useState("");
  const inputId = useId();

  useImperativeHandle(ref, () => ({
    getPendingDraft: () => draft,
  }));

  function commitDraft() {
    const next = draft.trim();
    if (next.length === 0) {
      return;
    }
    if (!values.includes(next)) {
      onChange([...values, next]);
    }
    setDraft("");
  }

  function removeValue(value: string) {
    onChange(values.filter((existing) => existing !== value));
  }

  return (
    <Field className="gap-2">
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>

      {quickAdd}

      <InputGroup>
        <InputGroupInput
          id={inputId}
          type="text"
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              commitDraft();
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={commitDraft}
            style={{ "--pill-accent": PALETTE.rustySpice } as React.CSSProperties}
            className="border-[var(--pill-accent)] text-[var(--pill-accent)] hover:bg-[var(--pill-accent)] hover:text-white"
          >
            Add
          </Button>
        </InputGroupAddon>
      </InputGroup>

      {values.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {values.map((value) => (
            <li key={value}>
              <Badge variant="outline" className="gap-1.5 bg-white py-1 pr-1 pl-2.5 text-sm">
                {value}
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  aria-label={`Remove ${value}`}
                  onClick={() => removeValue(value)}
                >
                  <XIcon aria-hidden="true" />
                </Button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Field>
  );
});

export function QuestionnaireForm() {
  const savedProfile = useCurrentUserProfile();
  return (
    <QuestionnaireFormInner
      key={savedProfile?.id ?? "new"}
      savedProfile={savedProfile}
    />
  );
}

function QuestionnaireFormInner({
  savedProfile,
}: {
  savedProfile: FoodProfile | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(savedProfile?.name ?? "");
  const [spiceTolerance, setSpiceTolerance] = useState<SpiceTolerance | "">(
    savedProfile?.spiceTolerance ?? "",
  );
  const [tagLists, setTagLists] = useState<Record<TagListField, string[]>>({
    dietaryRequirements: savedProfile?.dietaryRequirements ?? [],
    allergies: savedProfile?.allergies ?? [],
    likes: savedProfile?.likes ?? [],
    dislikes: savedProfile?.dislikes ?? [],
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const mildIconRef = useRef<LeafIconHandle>(null);
  const mediumIconRef = useRef<SoupIconHandle>(null);
  const spicyIconRef = useRef<FlameIconHandle>(null);

  const dietaryRequirementsInputRef = useRef<TagListInputHandle>(null);
  const allergiesInputRef = useRef<TagListInputHandle>(null);
  const likesInputRef = useRef<TagListInputHandle>(null);
  const dislikesInputRef = useRef<TagListInputHandle>(null);

  function updateTagList(field: TagListField, values: string[]) {
    setTagLists((prev) => ({ ...prev, [field]: values }));
  }

  /** Includes any typed-but-not-added text so switching fields or submitting doesn't silently drop it. */
  function withPendingDraft(values: string[], ref: React.RefObject<TagListInputHandle | null>) {
    const pending = ref.current?.getPendingDraft().trim();
    if (!pending || values.includes(pending)) {
      return values;
    }
    return [...values, pending];
  }

  function getSpiceIconRef(value: SpiceTolerance) {
    if (value === "mild") return mildIconRef;
    if (value === "medium") return mediumIconRef;
    return spicyIconRef;
  }

  function handleSpiceValueChange(values: string[]) {
    const next = (values[0] as SpiceTolerance | undefined) ?? "";
    setSpiceTolerance(next);
    if (next) {
      getSpiceIconRef(next).current?.startAnimation();
    }
  }

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};
    if (name.trim().length === 0) {
      nextErrors.name = "Enter your name.";
    }
    if (!spiceTolerance) {
      nextErrors.spiceTolerance = "Choose your spice tolerance.";
    }
    return nextErrors;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const profile: FoodProfile = foodProfileSchema.parse({
      id: CURRENT_USER_ID,
      name: name.trim(),
      isCurrentUser: true,
      dietaryRequirements: withPendingDraft(
        tagLists.dietaryRequirements,
        dietaryRequirementsInputRef,
      ),
      allergies: withPendingDraft(tagLists.allergies, allergiesInputRef),
      spiceTolerance,
      likes: withPendingDraft(tagLists.likes, likesInputRef),
      dislikes: withPendingDraft(tagLists.dislikes, dislikesInputRef),
    });

    saveCurrentUserProfile(profile);
    clearJoinedDemoGroup();
    router.push("/group");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 sm:gap-8">
      <Field data-invalid={errors.name ? true : undefined} className="gap-2">
        <FieldLabel htmlFor="name">Name *</FieldLabel>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && (
          <p id="name-error" role="alert" className="text-xs text-red-700">
            {errors.name}
          </p>
        )}
      </Field>

      <Field data-invalid={errors.spiceTolerance ? true : undefined} className="gap-2">
        <FieldLabel>Spice tolerance *</FieldLabel>
        <ToggleGroup
          value={spiceTolerance ? [spiceTolerance] : []}
          onValueChange={handleSpiceValueChange}
          aria-label="Spice tolerance"
          aria-invalid={Boolean(errors.spiceTolerance)}
          aria-describedby={errors.spiceTolerance ? "spice-error" : undefined}
          className="flex flex-wrap gap-2"
        >
          <ToggleGroupItem
            value="mild"
            onMouseEnter={() => mildIconRef.current?.startAnimation()}
            onMouseLeave={() => mildIconRef.current?.stopAnimation()}
            style={{ "--pill-accent": PALETTE.ochre } as React.CSSProperties}
            className={`${PILL_CLASS} border-[var(--pill-accent)] hover:bg-[var(--pill-accent)] data-pressed:bg-[var(--pill-accent)] data-pressed:border-[var(--pill-accent)]`}
          >
            <LeafIcon ref={mildIconRef} size={18} />
            Mild
          </ToggleGroupItem>

          <ToggleGroupItem
            value="medium"
            onMouseEnter={() => mediumIconRef.current?.startAnimation()}
            onMouseLeave={() => mediumIconRef.current?.stopAnimation()}
            style={{ "--pill-accent": PALETTE.rustySpice } as React.CSSProperties}
            className={`${PILL_CLASS} border-[var(--pill-accent)] hover:bg-[var(--pill-accent)] data-pressed:bg-[var(--pill-accent)] data-pressed:border-[var(--pill-accent)]`}
          >
            <SoupIcon ref={mediumIconRef} size={18} />
            Medium
          </ToggleGroupItem>

          <ToggleGroupItem
            value="spicy"
            onMouseEnter={() => spicyIconRef.current?.startAnimation()}
            onMouseLeave={() => spicyIconRef.current?.stopAnimation()}
            style={{ "--pill-accent": PALETTE.brandy } as React.CSSProperties}
            className={`${PILL_CLASS} border-[var(--pill-accent)] hover:bg-[var(--pill-accent)] data-pressed:bg-[var(--pill-accent)] data-pressed:border-[var(--pill-accent)]`}
          >
            <FlameIcon ref={spicyIconRef} size={18} />
            Spicy
          </ToggleGroupItem>
        </ToggleGroup>
        {errors.spiceTolerance && (
          <p id="spice-error" role="alert" className="text-xs text-red-700">
            {errors.spiceTolerance}
          </p>
        )}
      </Field>

      <TagListInput
        ref={dietaryRequirementsInputRef}
        label="Dietary requirements"
        placeholder="Others"
        values={tagLists.dietaryRequirements}
        onChange={(values) => updateTagList("dietaryRequirements", values)}
        quickAdd={
          <DietaryQuickAddChips
            values={tagLists.dietaryRequirements}
            onValueChange={(values) => updateTagList("dietaryRequirements", values)}
          />
        }
      />

      <TagListInput
        ref={allergiesInputRef}
        label="Allergies"
        placeholder="e.g. peanuts, shellfish"
        values={tagLists.allergies}
        onChange={(values) => updateTagList("allergies", values)}
      />

      <TagListInput
        ref={likesInputRef}
        label="Likes"
        placeholder="Dishes or ingredients"
        values={tagLists.likes}
        onChange={(values) => updateTagList("likes", values)}
      />

      <TagListInput
        ref={dislikesInputRef}
        label="Dislikes"
        placeholder="Dishes or ingredients"
        values={tagLists.dislikes}
        onChange={(values) => updateTagList("dislikes", values)}
      />

      <Button
        type="submit"
        style={{ backgroundColor: PALETTE.rustySpice }}
        className="w-full border-transparent text-white hover:opacity-90 sm:w-auto"
      >
        Continue
      </Button>
    </form>
  );
}
