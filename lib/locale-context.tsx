"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { type Locale, translations } from "./i18n";

type LocaleContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({
  children,
  defaultLocale = "en",
}: {
  children: ReactNode;
  defaultLocale?: Locale;
}) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  const t = useCallback(
    (key: string): string => {
      const lang = translations[locale] || translations.en;
      return lang[key] || translations.en[key] || key;
    },
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}
