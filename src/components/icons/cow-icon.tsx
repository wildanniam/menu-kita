"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

export interface CowIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface CowIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const STRIKE_VARIANTS: Variants = {
  normal: {
    pathLength: 1,
    opacity: 1,
    pathOffset: 0,
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    transition: {
      delay: 0.1,
      duration: 0.4,
      opacity: { duration: 0.1, delay: 0.1 },
    },
  },
};

const CowIcon = forwardRef<CowIconHandle, CowIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: () => controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else {
          controls.start("animate");
        }
      },
      [controls, onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          controls.start("normal");
        }
      },
      [controls, onMouseLeave]
    );

    return (
      <div
        className={cn(className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M4.5 7.8c-.6-.8-.4-1.7.4-2.2" />
          <path d="M7.5 7.8c.6-.8.4-1.7-.4-2.2" />
          <circle cx="6" cy="10" r="2.6" />
          <path d="M4.8 9c-.8-.2-1.3-.8-1.2-1.5" />
          <path d="M6.6 9.6v.01" />
          <path d="M4 10.8v.01" />
          <path d="M8 10.5c0-1.5 1.5-2.5 3-2.5h6.5c2.5 0 4.5 1.8 4.5 4.5v1.5c0 1.7-1.3 3-3 3H11c-1.7 0-3-1.3-3-3v-3.5Z" />
          <path d="M11 17v3" />
          <path d="M14 17v3" />
          <path d="M18 17v3" />
          <path d="M21 17v3" />
          <path d="M22.5 12c1.3.2 1.8 1.4 1 2.5" />
          <path d="M23.7 14.8c-.3.6.1 1.1.7 1.1" />
          <path d="M14 16.5c1-.4 2-.4 3 0" />
          <motion.path
            animate={controls}
            d="M2.5 4 22.5 20"
            fill="none"
            initial="normal"
            variants={STRIKE_VARIANTS}
          />
        </svg>
      </div>
    );
  }
);

CowIcon.displayName = "CowIcon";

export { CowIcon };
