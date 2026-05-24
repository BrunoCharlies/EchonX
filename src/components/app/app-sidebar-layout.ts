import {
  AUDIOPOST_BOTTOM_BAR_HEIGHT_PX,
  AUDIOPOST_BOTTOM_BAR_LIFT_PX,
} from "@/components/app/audiopost-bottom-bar-layout";

/** Sidebar width — keep in sync with `AppShell` `--app-sidebar-width`. */
export const APP_SIDEBAR_WIDTH_EXPANDED_PX = 232;
export const APP_SIDEBAR_WIDTH_COLLAPSED_PX = 68;

/** Matches `AppTopBar` (`h-16`) — logo row border aligns with main header. */
export const APP_SHELL_HEADER_HEIGHT_PX = 64;

/** Re-export for sidebar footer slot (border aligns with library bottom bar). */
export { AUDIOPOST_BOTTOM_BAR_HEIGHT_PX, AUDIOPOST_BOTTOM_BAR_LIFT_PX };
