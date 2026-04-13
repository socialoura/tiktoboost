/* ═══════════════════════════════════════════════════════════════
   CurrencyContext — EUR-only global currency state.
   SSR-safe: renders with EUR.
   ═══════════════════════════════════════════════════════════════ */

"use client";

import { createContext, useContext, useCallback, type ReactNode } from "react";
import {
  CURRENCY_MAP,
  DEFAULT_CURRENCY,
  type CurrencyCode,
  type CurrencyInfo,
} from "@/config/pricing";

interface CurrencyContextValue {
  currency: CurrencyCode;
  symbol: string;
  info: CurrencyInfo;
  setCurrency: (code: CurrencyCode) => void;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: DEFAULT_CURRENCY,
  symbol: CURRENCY_MAP[DEFAULT_CURRENCY].symbol,
  info: CURRENCY_MAP[DEFAULT_CURRENCY],
  setCurrency: () => {},
});

const EUR_INFO = CURRENCY_MAP[DEFAULT_CURRENCY];

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // EUR-only: no switching needed
  const setCurrency = useCallback((_code: CurrencyCode) => {
    // no-op: only EUR is supported
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency: DEFAULT_CURRENCY, symbol: EUR_INFO.symbol, info: EUR_INFO, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
