"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/context/TranslationContext";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useTranslation();

  const navLinks = [
    { label: t("nav.pricing"), href: "/" },
    { label: t("nav.tracking"), href: "/dashboard" },
    { label: t("nav.about"), href: "/about" },
    { label: t("nav.contact"), href: "/contact" },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 left-0 right-0 z-40 transition-all duration-500 ${
        scrolled
          ? "bg-black/60 backdrop-blur-2xl border-b border-white/[0.06]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <Image
              src="/logo.png"
              alt="TiktoBoost"
              width={100}
              height={100}
              className="rounded-xl"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-[13px] font-medium text-zinc-400 hover:text-white rounded-full hover:bg-white/[0.06] transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[12px] text-zinc-400 font-medium">€ EUR</span>
            <Link
              href="/"
              className="shine inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-[13px] font-semibold hover:bg-zinc-100 transition-colors"
            >
              {t("nav.startGrowth")}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 text-zinc-400"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden bg-black/80 backdrop-blur-2xl border-b border-white/[0.06]"
          >
            <div className="px-5 py-5 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3.5 text-[15px] font-medium text-zinc-300 hover:text-white hover:bg-white/[0.04] rounded-2xl transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 mt-2 border-t border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between px-4">
                  <span className="text-[13px] text-zinc-500">{t("nav.currency")}</span>
                  <span className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[12px] text-zinc-400 font-medium">€ EUR</span>
                </div>
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="shine block w-full text-center px-5 py-3.5 rounded-2xl bg-white text-black text-sm font-semibold"
                >
                  {t("nav.startGrowth")}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
