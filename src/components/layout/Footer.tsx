"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/context/TranslationContext";

export default function Footer() {
  const { t } = useTranslation();

  const footerLinks = {
    product: [
      { label: t("footer.tiktokGrowth"), href: "/" },
    ],
    company: [
      { label: t("footer.about"), href: "/about" },
      { label: t("footer.contact"), href: "/contact" },
    ],
    legal: [
      { label: t("footer.privacy"), href: "/privacy" },
      { label: t("footer.terms"), href: "/terms" },
      { label: t("footer.refund"), href: "/refund" },
    ],
  };
  return (
    <footer className="relative z-10 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 lg:gap-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <Image
                src="/logo.png"
                alt="TiktoBoost"
                width={24}
                height={24}
                className="rounded-md"
              />
              <span className="text-[15px] font-semibold text-white tracking-tight">
                TiktoBoost
              </span>
            </Link>
            <p className="text-[13px] text-zinc-500 leading-relaxed max-w-[260px]">
              {t("footer.brandDesc")}
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-5">
              {t("footer.product")}
            </h4>
            <nav className="flex flex-col gap-1">
              {footerLinks.product.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-[13px] text-zinc-400 hover:text-white transition-colors duration-200 py-1.5"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-5">
              {t("footer.company")}
            </h4>
            <nav className="flex flex-col gap-1">
              {footerLinks.company.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-[13px] text-zinc-400 hover:text-white transition-colors duration-200 py-1.5"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-5">
              {t("footer.legal")}
            </h4>
            <nav className="flex flex-col gap-1">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-[13px] text-zinc-400 hover:text-white transition-colors duration-200 py-1.5"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-zinc-600">
            &copy; {new Date().getFullYear()} {t("footer.copyright")}
          </p>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[12px] text-zinc-400 font-medium">€ EUR</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-glow" />
              <span className="text-[11px] text-zinc-600">{t("footer.systemsOk")}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
