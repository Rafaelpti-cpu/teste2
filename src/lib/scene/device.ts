/**
 * Device tiering for WebGL scenes.
 *
 * One module decides what "mobile" means, and every budget — pixel ratio,
 * frame rate, antialiasing, whether the pointer is listened to at all — reads
 * from it, so the values can never drift apart.
 *
 * Read **once at construction**: a device does not change tier mid-session, and
 * rebuilding buffers on resize costs more than the mismatch is worth.
 *
 * 📖 Docs: obsidian/workflows/optimize-3d-scene.md
 */

export type DeviceTier = "mobile" | "tablet" | "desktop";

export interface SceneBudget {
  tier: DeviceTier;
  /** Clamped pixel ratio for both the renderer and any composer targets. */
  pixelRatio: number;
  /** Minimum ms between rendered frames — feeds the shared ticker. */
  frameBudget: number;
  antialias: boolean;
  /** Whether to attach pointer listeners at all. */
  pointer: boolean;
}

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

/** Coarse pointer is what catches tablets and large phones, not width alone. */
const isCoarsePointer = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: none) and (pointer: coarse)").matches;

export const getDeviceTier = (): DeviceTier => {
  if (typeof window === "undefined") return "desktop";
  if (window.innerWidth < MOBILE_BREAKPOINT || isCoarsePointer()) {
    return window.innerWidth < MOBILE_BREAKPOINT ? "mobile" : "tablet";
  }
  return window.innerWidth < TABLET_BREAKPOINT ? "tablet" : "desktop";
};

/** An accessibility promise — honoured on every tier. */
export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface ConstrainedNavigator extends Navigator {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
}

/**
 * The nearest web-exposed proxy for iOS Low Power Mode, which has no API.
 */
export const isEnergySaver = () => {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as ConstrainedNavigator;
  return Boolean(nav.connection?.saveData) || (nav.deviceMemory ?? 8) <= 2;
};

/**
 * Play the entrance, then stop drawing on a settled frame. WebGL keeps the last
 * frame on the canvas, so a frozen scene costs zero.
 */
export const sceneShouldFreeze = (tier: DeviceTier) =>
  prefersReducedMotion() || (tier === "mobile" && isEnergySaver());

const BUDGETS: Record<DeviceTier, Omit<SceneBudget, "tier" | "pixelRatio">> = {
  // The tag has hard edges (text, a printed rule), so mobile clamps to 1.0
  // rather than below it — anything lower aliases visibly.
  mobile: { frameBudget: 1000 / 30 - 1, antialias: false, pointer: false },
  tablet: { frameBudget: 1000 / 45 - 1, antialias: true, pointer: false },
  desktop: { frameBudget: 0, antialias: true, pointer: true },
};

const PIXEL_RATIO: Record<DeviceTier, [min: number, max: number]> = {
  mobile: [0.75, 1],
  tablet: [0.75, 1.25],
  desktop: [0.75, 1.5],
};

export const getSceneBudget = (): SceneBudget => {
  const tier = getDeviceTier();
  const [min, max] = PIXEL_RATIO[tier];
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio;

  return {
    tier,
    pixelRatio: Math.min(Math.max(dpr, min), max),
    ...BUDGETS[tier],
  };
};
