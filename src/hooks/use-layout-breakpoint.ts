"use client";

import { useEffect, useState } from "react";
import {
  LAYOUT_MEDIA,
  layoutBreakpointFromWidth,
  type LayoutBreakpoint,
} from "@/lib/layout/breakpoints";

export function useLayoutBreakpoint(): LayoutBreakpoint {
  const [breakpoint, setBreakpoint] = useState<LayoutBreakpoint>("desktop");

  useEffect(() => {
    const mqDesktop = window.matchMedia(LAYOUT_MEDIA.desktop);
    const mqPhone = window.matchMedia(LAYOUT_MEDIA.phone);

    const sync = () => {
      setBreakpoint(layoutBreakpointFromWidth(window.innerWidth));
    };

    sync();
    mqDesktop.addEventListener("change", sync);
    mqPhone.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    return () => {
      mqDesktop.removeEventListener("change", sync);
      mqPhone.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  return breakpoint;
}

export function useIsBelowDesktop(): boolean {
  const bp = useLayoutBreakpoint();
  return bp === "tablet" || bp === "phone";
}
