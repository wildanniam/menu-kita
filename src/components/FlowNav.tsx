import Link from "next/link";

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
  return (
    <nav aria-label="Flow steps" className="flex flex-wrap gap-2">
      {STEPS.map((step) => {
        const active = step.href === current;
        return (
          <Link
            key={step.href}
            href={step.href}
            aria-current={active ? "page" : undefined}
            style={
              active
                ? { backgroundColor: PALETTE.rustySpice, borderColor: PALETTE.rustySpice }
                : { borderColor: PALETTE.rustySpice }
            }
            className={cn(
              "rounded-full border-2 bg-white px-3 py-1.5 text-sm font-medium transition-colors",
              active ? "text-white" : "text-neutral-700 hover:bg-neutral-50",
            )}
          >
            {step.label}
          </Link>
        );
      })}
    </nav>
  );
}
