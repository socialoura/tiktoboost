"use client";

import { createContext, useContext, useCallback, useMemo } from "react";
import fr from "@/locales/fr.json";

/**
 * Resolve a dot-notation key like "home.heroTitle1" from a nested JSON object.
 */
function resolve(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return path;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : path;
}

interface TranslationContextValue {
  locale: "fr";
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const TranslationContext = createContext<TranslationContextValue>({
  locale: "fr",
  t: (key, replacements) => {
    let value = resolve(fr as unknown as Record<string, unknown>, key);
    if (replacements) {
      for (const [k, v] of Object.entries(replacements)) {
        value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return value;
  },
});

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
    let value = resolve(fr as unknown as Record<string, unknown>, key);
    if (replacements) {
      for (const [k, v] of Object.entries(replacements)) {
        value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return value;
  }, []);

  const contextValue = useMemo(() => ({ locale: "fr" as const, t }), [t]);

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  return useContext(TranslationContext);
}
