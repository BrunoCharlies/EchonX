"use client";

import { useEffect, useState } from "react";
import { DEFAULT_LOCALE, LOCALE_COOKIE, normalizeLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

const STORAGE_KEY = "echonx:locale";

function readCookieLocale() {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const match = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${LOCALE_COOKIE}=`))
    ?.split("=")[1];
  return normalizeLocale(match ? decodeURIComponent(match) : null);
}

export function setClientLocale(locale: Locale) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(locale)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  document.documentElement.lang = locale;
  window.localStorage.setItem(STORAGE_KEY, locale);
  window.dispatchEvent(new CustomEvent("echonx:locale-change", { detail: locale }));
}

export function useI18n() {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    const initial = storedValue ? normalizeLocale(storedValue) : readCookieLocale();
    setLocale(initial);
    if (initial) setClientLocale(initial);

    function onLocaleChange(event: Event) {
      const next = normalizeLocale((event as CustomEvent<string>).detail);
      setLocale(next);
    }

    window.addEventListener("echonx:locale-change", onLocaleChange);
    return () => window.removeEventListener("echonx:locale-change", onLocaleChange);
  }, []);

  return { locale, dictionary: getDictionary(locale), setLocale: setClientLocale };
}
