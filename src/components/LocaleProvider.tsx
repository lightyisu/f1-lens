"use client";

import { createContext, useContext } from "react";
import {
  dictionaries,
  type Dictionary,
  type Locale,
} from "@/lib/i18n/dictionaries";

const LocaleContext = createContext<{
  locale: Locale;
  t: Dictionary;
}>({
  locale: "zh",
  t: dictionaries.zh,
});

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={{ locale, t: dictionaries[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function useT() {
  return useContext(LocaleContext).t;
}
