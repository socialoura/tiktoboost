/* ═══════════════════════════════════════════════════════════════
   TopAnnouncementBar — Promotional banner with dismiss functionality
   Displays above navbar, saves state to localStorage
   Settings loaded from admin panel
   ═══════════════════════════════════════════════════════════════ */

"use client";

import { useState, useEffect } from "react";
import { X, Flame } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "promo_bar_closed";

interface AnnouncementBarSettings {
  enabled: boolean;
  text: string;
  highlightText: string;
  ctaText: string;
  ctaLink: string;
}

export default function TopAnnouncementBar() {
  const [isVisible, setIsVisible] = useState(false);
  const [settings, setSettings] = useState<AnnouncementBarSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/announcement-bar");
        if (res.ok) {
          const data: AnnouncementBarSettings = await res.json();
          setSettings(data);
          
          // Only show if enabled and not previously closed
          const isClosed = localStorage.getItem(STORAGE_KEY);
          if (data.enabled && !isClosed) {
            setIsVisible(true);
          }
        }
      } catch (err) {
        console.error("Failed to fetch announcement bar settings:", err);
      }
    };

    fetchSettings();
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  if (!settings) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="w-full bg-zinc-950 border-b border-white/[0.08] overflow-hidden relative z-50"
        >
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="hidden sm:flex items-center justify-center gap-3 py-2.5 sm:py-3">
              {/* Fire emoji with pulse animation */}
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 animate-pulse flex-shrink-0" />
              
              {/* Main message */}
              <p className="text-xs sm:text-sm font-medium text-zinc-200 tracking-wide text-center">
                <span className="font-semibold text-indigo-400">{settings.highlightText}</span> {settings.text}
              </p>

              {/* CTA Link */}
              <Link
                href={settings.ctaLink}
                className="text-xs sm:text-sm font-semibold text-indigo-300 underline underline-offset-2 hover:text-indigo-200 transition-colors whitespace-nowrap flex-shrink-0"
              >
                {settings.ctaText}
              </Link>

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-white/[0.08] transition-colors text-zinc-400 hover:text-zinc-200"
                aria-label="Close announcement"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
