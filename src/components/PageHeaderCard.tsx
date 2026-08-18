import Image from "next/image";
import type { ReactNode } from "react";

export function PageHeaderCard({
  nav,
  children,
}: {
  nav: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      style={{ backgroundColor: "rgba(245, 230, 200, 0.92)" }}
      className="flex flex-col rounded-2xl"
    >
      <div
        style={{ backgroundColor: "rgba(245, 230, 200, 0.98)" }}
        className="sticky top-0 z-20 flex flex-col gap-3 rounded-t-2xl px-4 pt-4 pb-3 sm:px-6 sm:pt-5"
      >
        <Image
          src="/menukita-logo-transparent.png"
          alt="MenuKita"
          width={210}
          height={104}
          priority
          className="h-9 w-auto sm:h-10"
        />
        {nav}
      </div>
      <div className="flex flex-col gap-6 px-4 pt-3 pb-5 sm:gap-8 sm:px-6 sm:pb-6">
        {children}
      </div>
    </div>
  );
}
