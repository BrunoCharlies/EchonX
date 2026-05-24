/** Footer player bar — tweak lift here; dashboard height stays in sync. */
/** Player row; quota strip adds ~36px above (see LibraryBottomBar). */
export const AUDIOPOST_BOTTOM_BAR_HEIGHT_PX = 72;
export const LIBRARY_QUOTA_STRIP_HEIGHT_PX = 36;

/** Gap above OS taskbar / screen edge. Set to `0` to revert May 2026 lift. */
export const AUDIOPOST_BOTTOM_BAR_LIFT_PX = 8;

export const AUDIOPOST_BOTTOM_BAR_RESERVED_PX =
  AUDIOPOST_BOTTOM_BAR_HEIGHT_PX + LIBRARY_QUOTA_STRIP_HEIGHT_PX + AUDIOPOST_BOTTOM_BAR_LIFT_PX;

/** Compact footer on viewports &lt; 1024px (Audiopost mobile stack). */
export const AUDIOPOST_BOTTOM_BAR_MOBILE_HEIGHT_PX = 44;
export const LIBRARY_QUOTA_STRIP_MOBILE_HEIGHT_PX = 28;

export const AUDIOPOST_BOTTOM_BAR_MOBILE_RESERVED_PX =
  AUDIOPOST_BOTTOM_BAR_MOBILE_HEIGHT_PX + LIBRARY_QUOTA_STRIP_MOBILE_HEIGHT_PX + AUDIOPOST_BOTTOM_BAR_LIFT_PX;
