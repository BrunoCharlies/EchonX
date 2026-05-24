"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  applyThemeClasses,
  getStoredTheme,
  persistThemePreference,
  resolveEffectiveTheme,
  type EchonxTheme,
} from "@/lib/theme/echonx-theme";

type ThemeContextValue = {
  /** User preference (saved). */
  preference: EchonxTheme;
  /** What is actually applied on this route. */
  theme: EchonxTheme;
  setTheme: (theme: EchonxTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type Props = {
  children: React.ReactNode;
  userId?: string | null;
  isAdmin?: boolean;
};

export function EchonxThemeProvider({ children, userId = null, isAdmin = false }: Props) {
  const pathname = usePathname();
  const [preference, setPreference] = useState<EchonxTheme>("dark");

  const effective = resolveEffectiveTheme(preference, pathname, isAdmin);

  useEffect(() => {
    const stored = getStoredTheme(userId);
    setPreference(stored);
  }, [userId]);

  useEffect(() => {
    applyThemeClasses(effective);
  }, [effective, pathname]);

  const setTheme = useCallback(
    (next: EchonxTheme) => {
      setPreference(next);
      persistThemePreference(next, userId);
      applyThemeClasses(resolveEffectiveTheme(next, pathname, isAdmin));
    },
    [pathname, isAdmin, userId],
  );

  const value = useMemo(
    () => ({ preference, theme: effective, setTheme }),
    [preference, effective, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useEchonxTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useEchonxTheme must be used within EchonxThemeProvider");
  }
  return ctx;
}
