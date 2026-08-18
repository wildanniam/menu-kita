"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

export interface HalalIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface HalalIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const OUTER_RING_VARIANTS: Variants = {
  normal: {
    pathLength: 1,
    opacity: 1,
    pathOffset: 0,
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    transition: { duration: 0.6, ease: "easeInOut" },
  },
};

const INNER_RING_VARIANTS: Variants = {
  normal: {
    pathLength: 1,
    opacity: 1,
    pathOffset: 0,
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    transition: { duration: 0.5, delay: 0.2, ease: "easeInOut" },
  },
};

const TEXT_VARIANTS: Variants = {
  normal: {
    opacity: 1,
    y: 0,
  },
  animate: {
    opacity: [0, 1],
    y: [3, 0],
    transition: { duration: 0.3, delay: 0.55 },
  },
};

const HalalIcon = forwardRef<HalalIconHandle, HalalIconProps>(
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
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.circle
            animate={controls}
            cx="12"
            cy="12"
            r="10.4"
            fill="none"
            initial="normal"
            strokeWidth="1.2"
            variants={OUTER_RING_VARIANTS}
          />
          <motion.circle
            animate={controls}
            cx="12"
            cy="12"
            r="8.7"
            fill="none"
            initial="normal"
            strokeWidth="1"
            variants={INNER_RING_VARIANTS}
          />
          <motion.text
            animate={controls}
            direction="rtl"
            fill="currentColor"
            fontFamily="'Traditional Arabic', 'Segoe UI', Tahoma, sans-serif"
            fontSize="7.5"
            initial="normal"
            stroke="none"
            textAnchor="middle"
            variants={TEXT_VARIANTS}
            x="12"
            y="12.6"
          >
            حلال
          </motion.text>
          <motion.text
            animate={controls}
            fill="currentColor"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="3.1"
            fontWeight="700"
            initial="normal"
            letterSpacing="0.4"
            stroke="none"
            textAnchor="middle"
            variants={TEXT_VARIANTS}
            x="12"
            y="18.8"
          >
            HALAL
          </motion.text>
        </svg>
      </div>
    );
  }
);

HalalIcon.displayName = "HalalIcon";

export { HalalIcon };
