import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";
import "./animated-button.css";

const ARROW_PATH =
  "M16.1716 10.9999L10.8076 5.63588L12.2218 4.22167L20 11.9999L12.2218 19.7781L10.8076 18.3639L16.1716 12.9999H4V10.9999H16.1716Z";

type AnimatedButtonSize = "default" | "sm" | "xs";

const SIZE_CLASS: Record<AnimatedButtonSize, string | null> = {
  default: null,
  sm: "animated-button--sm",
  xs: "animated-button--xs",
};

function AnimatedButtonArrows({ children }: { children: ReactNode }) {
  return (
    <>
      <svg className="arr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d={ARROW_PATH} />
      </svg>
      <span className="text">{children}</span>
      <span className="circle" />
      <svg className="arr-1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d={ARROW_PATH} />
      </svg>
    </>
  );
}

export function AnimatedButton({
  children,
  className,
  size = "default",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { size?: AnimatedButtonSize }) {
  return (
    <button
      {...props}
      className={cn("animated-button", SIZE_CLASS[size], className)}
    >
      <AnimatedButtonArrows>{children}</AnimatedButtonArrows>
    </button>
  );
}

export function AnimatedLinkButton({
  children,
  className,
  size = "default",
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  size?: AnimatedButtonSize;
}) {
  return (
    <Link
      href={href}
      {...props}
      className={cn("animated-button", SIZE_CLASS[size], className)}
    >
      <AnimatedButtonArrows>{children}</AnimatedButtonArrows>
    </Link>
  );
}
