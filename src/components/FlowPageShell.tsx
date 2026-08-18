import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { FlowNav } from "./FlowNav";

const DECORATIVE_DOTS = ["#AD390B", "#385610", "#D97706", "#7C2D12"];

type FlowRoute = "/onboarding" | "/group" | "/scan" | "/results";

interface FlowPageShellProps {
  children: ReactNode;
  current: FlowRoute;
  description?: string;
  maxWidthClassName?: string;
  title: string;
}

export function FlowPageShell({
  children,
  current,
  description,
  maxWidthClassName = "max-w-3xl",
  title,
}: FlowPageShellProps) {
  return (
    <main className="flex min-h-screen w-full justify-center bg-[#F5E6C8]/28 px-3 pb-10 pt-20 sm:px-6 sm:pb-16 sm:pt-24">
      <div className={cn("flex w-full flex-col gap-4 sm:gap-5", maxWidthClassName)}>
        <header className="flex flex-col gap-3 rounded-3xl border border-[#AD390B]/15 bg-[#F9EDCF]/94 p-4 shadow-[0_22px_70px_-48px_rgba(80,35,10,0.8)] backdrop-blur-[2px] sm:p-6">
          <FlowNav current={current} />
          <div className="flex gap-1.5" aria-hidden="true">
            {DECORATIVE_DOTS.map((color) => (
              <span
                key={color}
                style={{ backgroundColor: color }}
                className="size-2 rounded-full"
              />
            ))}
          </div>
          <h1 className="text-3xl font-extrabold text-[#7C2D12] sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-sm leading-6 text-neutral-600 sm:text-base">
              {description}
            </p>
          )}
        </header>

        <section className="rounded-[2rem] border border-[#AD390B]/15 bg-[#F9EDCF]/94 p-4 shadow-[0_30px_90px_-55px_rgba(80,35,10,0.75)] backdrop-blur-[2px] sm:p-6 lg:p-8">
          {children}
        </section>
      </div>
    </main>
  );
}
