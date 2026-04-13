"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/context/TranslationContext";

const names = [
  { name: "Alex", city: "Paris", actionKey: "toast.action1" },
  { name: "Sarah", city: "London", actionKey: "toast.action2" },
  { name: "Marco", city: "Milan", actionKey: "toast.action3" },
  { name: "Emily", city: "New York", actionKey: "toast.action1" },
  { name: "Yuki", city: "Tokyo", actionKey: "toast.action2" },
  { name: "Lucas", city: "Berlin", actionKey: "toast.action3" },
  { name: "Sofia", city: "Madrid", actionKey: "toast.action1" },
  { name: "James", city: "Sydney", actionKey: "toast.action2" },
  { name: "Léa", city: "Montreal", actionKey: "toast.action3" },
  { name: "Omar", city: "Dubai", actionKey: "toast.action1" },
];

export default function LiveActivityToast() {
  const { t } = useTranslation();
  const [current, setCurrent] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const initialDelay = setTimeout(() => {
      showNext(0);
    }, 6000);

    return () => clearTimeout(initialDelay);
  }, []);

  const showNext = (index: number) => {
    setCurrent(index);
    setVisible(true);

    setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        const next = (index + 1) % names.length;
        showNext(next);
      }, 8000 + Math.random() * 7000);
    }, 4000);
  };

  const activity = current !== null ? names[current] : null;

  return (
    <AnimatePresence>
      {visible && activity && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-20 md:bottom-6 left-4 z-30 max-w-[280px] hidden md:block"
        >
          <div className="bg-zinc-900/90 backdrop-blur-xl rounded-2xl border border-white/[0.08] shadow-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/[0.08] flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-white">
                {activity.name[0]}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-white truncate">
                {activity.name} {t("toast.from")} {activity.city}
              </p>
              <p className="text-[11px] text-zinc-400 truncate">
                {t(activity.actionKey)}
              </p>
              <p className="text-[10px] text-zinc-600 mt-0.5">{t("toast.justNow")}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
