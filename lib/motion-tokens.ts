/**
 * PinkSurfing motion tokens — mirrored from Ps-web-app CORE / ecommerce.
 * Use these values only; never invent durations or springs.
 * Framer Motion uses seconds; CSS vars in globals.css use milliseconds.
 */

export const PS_MOTION = {
  duration: {
    instant: 0.1,
    fast: 0.16,
    normal: 0.25,
    moderate: 0.35,
    slow: 0.5,
    celebration: 0.8,
  },
  distance: { small: 4, medium: 12, large: 24 },
  scale: { pressed: 0.97, subtle: 0.98, initial: 0.96, normal: 1 },
  easing: {
    standard: [0.2, 0, 0, 1] as [number, number, number, number],
    enter: [0, 0, 0.2, 1] as [number, number, number, number],
    exit: [0.4, 0, 1, 1] as [number, number, number, number],
  },
  spring: { type: "spring" as const, stiffness: 300, damping: 36, mass: 1 },
  stagger: { step: 0.04, maxItems: 8 },
};

export function staggerDelay(index: number, reduced?: boolean): number {
  if (reduced || index < 0 || index >= PS_MOTION.stagger.maxItems) return 0;
  return index * PS_MOTION.stagger.step;
}

export const fadeEnter = (reduced?: boolean) =>
  reduced
    ? { opacity: 1 }
    : {
        opacity: 0,
        y: PS_MOTION.distance.medium,
      };

export const fadeEnterAnimate = {
  opacity: 1,
  y: 0,
  transition: {
    duration: PS_MOTION.duration.normal,
    ease: PS_MOTION.easing.enter,
  },
};

export const sheetTransition = {
  type: "spring" as const,
  stiffness: PS_MOTION.spring.stiffness,
  damping: PS_MOTION.spring.damping,
  mass: PS_MOTION.spring.mass,
};

/** Browser prefers-reduced-motion (safe for SSR). */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
