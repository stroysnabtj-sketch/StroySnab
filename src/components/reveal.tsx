"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Distance to rise from (px). Default 28. */
  distance?: number;
  /** Animation duration (s). Default 0.65. */
  duration?: number;
  /** Base delay (s). Default 0. */
  delay?: number;
  /** When set, enables staggered ladder effect. */
  ladderIndex?: number | null;
  /** Number of columns for stagger calculation. Default 3. */
  columns?: number;
  /** Trigger once or every time element enters viewport. Default true. */
  once?: boolean;
  /** Fraction of element visible to trigger. Default 0.1. */
  amount?: number;
}

/**
 * Blurred Staggered Rise Reveal — scroll-triggered appearance animation.
 *
 * When the element enters viewport it rises from below,
 * fades in and loses blur over 650 ms with a custom cubic-bezier easing.
 */
export function Reveal({
  children,
  className = "",
  distance = 28,
  duration = 0.65,
  delay = 0,
  ladderIndex = null,
  columns = 3,
  once = true,
  amount = 0.1,
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const [cols, setCols] = useState(columns);

  useEffect(() => {
    function updateCols() {
      if (typeof window === "undefined") return;
      if (window.innerWidth <= 760) {
        setCols(2);
      } else if (window.innerWidth <= 1100) {
        setCols(columns >= 4 ? 3 : 2);
      } else {
        setCols(columns);
      }
    }
    updateCols();
    window.addEventListener("resize", updateCols);
    return () => window.removeEventListener("resize", updateCols);
  }, [columns]);

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const hasLadder = ladderIndex !== null && ladderIndex !== undefined;
  const col = hasLadder ? ladderIndex % cols : 0;
  const initialY = hasLadder ? 24 + col * 12 : distance;
  const computedDelay = hasLadder ? delay + col * 0.08 : delay;

  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0,
        y: initialY,
        filter: "blur(14px)",
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transitionEnd: {
          filter: "none",
        },
      }}
      viewport={{
        once,
        amount,
        margin: "0px 0px -30px 0px",
      }}
      transition={{
        duration,
        delay: computedDelay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * ProductReveal — shortcut for product cards in a grid.
 * Strict left-to-right progression across responsive columns.
 */
export function ProductReveal({
  children,
  index = 0,
  columns = 3,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  index?: number;
  columns?: number;
  className?: string;
  delay?: number;
}) {
  return (
    <Reveal
      className={`product-reveal ${className}`}
      ladderIndex={index}
      columns={columns}
      delay={delay}
    >
      {children}
    </Reveal>
  );
}

/**
 * CategoryReveal — shortcut for category tiles in a grid.
 * Strict left-to-right progression across 4 -> 3 -> 2 responsive columns.
 */
export function CategoryReveal({
  children,
  index = 0,
  columns = 4,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  index?: number;
  columns?: number;
  className?: string;
  delay?: number;
}) {
  return (
    <Reveal className={className} ladderIndex={index} columns={columns} delay={delay}>
      {children}
    </Reveal>
  );
}
