"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import { SUPPORTED_CURRENCIES, CURRENCY_MAP, type CurrencyCode } from "@/config/pricing";

export default function CurrencySelector() {
  const { currency, setCurrency, symbol } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[12px] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
      >
        <span className="font-medium">{symbol} {currency}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 w-40 rounded-lg bg-zinc-900 border border-white/[0.08] shadow-xl overflow-hidden z-50">
          {SUPPORTED_CURRENCIES.map((code) => {
            const info = CURRENCY_MAP[code];
            const isActive = code === currency;
            return (
              <button
                key={code}
                onClick={() => { setCurrency(code); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] transition-colors ${
                  isActive
                    ? "bg-white/[0.08] text-white"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                }`}
              >
                <span className="w-6 text-center font-medium">{info.symbol}</span>
                <span>{info.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
