"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Lock, Shield } from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";

export default function StickyBottomCTA() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isProductPage = pathname === "/";
  const label = isProductPage ? t("stickyCta.choosePackage") : t("stickyCta.startGrowth");

  const handleClick = (e: React.MouseEvent) => {
    if (isProductPage) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const href = "/";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
        >
          <div className="bg-black border-t border-white/[0.08] px-4 py-3 safe-area-bottom">
            <Link
              href={href}
              onClick={handleClick}
              className="shine flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-white text-black text-sm font-semibold active:scale-[0.97] transition-transform"
            >
              {label}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="flex items-center justify-center gap-5 mt-2.5">
              <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                <Shield className="w-3 h-3" />
                {t("stickyCta.stripeSecured")}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
