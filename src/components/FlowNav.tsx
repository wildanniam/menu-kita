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
    <nav
      aria-label="Flow steps"
      className="flex gap-5 overflow-x-auto border-b border-neutral-300"
    >
      {STEPS.map((step) => {
        const active = step.href === current;
        return (
          <Link
            key={step.href}
            href={step.href}
            aria-current={active ? "page" : undefined}
            style={active ? { color: PALETTE.rustySpice, borderColor: PALETTE.rustySpice } : undefined}
            className={cn(
              "shrink-0 border-b-2 border-transparent pb-2 text-sm font-semibold tracking-wide uppercase transition-colors",
              active ? "" : "text-neutral-500 hover:text-neutral-800",
            )}
          >
            {step.label}
          </Link>
        );
      })}
    </nav>
  );
}
