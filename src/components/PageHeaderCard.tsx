import type { ReactNode } from "react";

export function PageHeaderCard({ children }: { children: ReactNode }) {
  return (
    <div
      style={{ backgroundColor: "rgba(245, 230, 200, 0.92)" }}
      className="flex flex-col gap-3 rounded-2xl px-4 py-4 sm:px-5"
    >
      {children}
    </div>
  );
}
