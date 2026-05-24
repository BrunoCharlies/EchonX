/** EchonX responsive layout — official breakpoints (see docs HTML §46). */

/** Desktop layout frozen at this width and above (Tailwind `lg`). */
export const DESKTOP_MIN_PX = 1024;

/** Phone vs tablet split (Tailwind `sm`). */
export const PHONE_MAX_PX = 639;

export const LAYOUT_MEDIA = {
  desktop: `(min-width: ${DESKTOP_MIN_PX}px)`,
  belowDesktop: `(max-width: ${DESKTOP_MIN_PX - 1}px)`,
  phone: `(max-width: ${PHONE_MAX_PX}px)`,
  tablet: `(min-width: 640px) and (max-width: ${DESKTOP_MIN_PX - 1}px)`,
} as const;

export type LayoutBreakpoint = "desktop" | "tablet" | "phone";

export function layoutBreakpointFromWidth(width: number): LayoutBreakpoint {
  if (width >= DESKTOP_MIN_PX) return "desktop";
  if (width > PHONE_MAX_PX) return "tablet";
  return "phone";
}
