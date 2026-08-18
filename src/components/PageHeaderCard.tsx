import type { ReactNode } from "react";

export function PageHeaderCard({ children }: { children: ReactNode }) {
  return (
    <div
      style={{ backgroundColor: "rgba(245, 230, 200, 0.92)" }}
      className="flex flex-col gap-6 rounded-2xl px-4 py-5 sm:gap-8 sm:px-6 sm:py-6"
    >
      {children}
    </div>
  );
}
