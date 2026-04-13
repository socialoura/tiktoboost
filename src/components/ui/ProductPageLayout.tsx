"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PricingTier } from "./PricingCard";
import CheckoutModal from "./CheckoutModal";
import type { CheckoutTier } from "./CheckoutModal";
import {
  Shield,
  Clock,
  Users,
  Zap,
  Award,
  HeartHandshake,
  Check,
  Lock,
  ChevronDown,
  Star,
} from "lucide-react";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useTranslation } from "@/context/TranslationContext";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const noAnimation = {
  hidden: { opacity: 1, y: 0 },
  visible: () => ({ opacity: 1, y: 0, transition: { duration: 0 } }),
};

interface FAQItem {
  question: string;
  answer: string;
}

interface Testimonial {
  name: string;
  role: string;
  text: string;
  rating: number;
}

interface ContentBlock {
  title: string;
  paragraphs: string[];
}

interface ProductImages {
  content1: string;
  content2: string;
  content3: string;
}

interface ProductPageLayoutProps {
  platform: "tiktok";
  title: string;
  subtitle: string;
  pricingTiers: PricingTier[];
  whyShouldBuy: ContentBlock;
  howToBuy: ContentBlock;
  whyBuyMore: ContentBlock;
  faqs: FAQItem[];
  testimonials: Testimonial[];
  images: ProductImages;
}

const trustIcons = [Shield, Clock, Users, Zap, Award, HeartHandshake];
const trustKeys = [
  "productPage.trust1",
  "productPage.trust2",
  "productPage.trust3",
  "productPage.trust4",
  "productPage.trust5",
  "productPage.trust6",
];

function FAQAccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 last:border-0">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full py-5 text-left gap-4">
        <span className="text-sm sm:text-base font-semibold text-slate-900">{question}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <motion.div initial={false} animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
        <p className="pb-5 text-sm text-slate-500 leading-relaxed">{answer}</p>
      </motion.div>
    </div>
  );
}

export default function ProductPageLayout({
  platform,
  title,
  subtitle,
  pricingTiers,
  whyShouldBuy,
  howToBuy,
  whyBuyMore,
  faqs,
  testimonials,
}: ProductPageLayoutProps) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const v = isMobile ? noAnimation : fadeUp; // animation variants
  const [selectedTier, setSelectedTier] = useState(2);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutTier, setCheckoutTier] = useState<CheckoutTier | null>(null);

  const handleBuyNow = (tier: PricingTier) => {
    setCheckoutTier({
      label: tier.followers,
      volume: tier.followers,
      price: parseFloat(tier.price),
      originalPrice: tier.originalPrice ? parseFloat(tier.originalPrice) : parseFloat(tier.price),
    });
    setCheckoutOpen(true);
  };

  return (
    <>
      {/* Hero */}
      <section className="relative pt-20 pb-10 sm:pt-24 sm:pb-12 md:pt-32 md:pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-indigo-100/30 blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.p
            initial={isMobile ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={isMobile ? { duration: 0 } : undefined}
            className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-4"
          >
            TikTok Growth
          </motion.p>
          <motion.h1
            initial={isMobile ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={isMobile ? { duration: 0 } : { delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]"
          >
            {title}
          </motion.h1>
          <motion.p
            initial={isMobile ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={isMobile ? { duration: 0 } : { delay: 0.2 }}
            className="mt-5 text-base sm:text-lg text-slate-500 leading-relaxed"
          >
            {subtitle}
          </motion.p>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-10 sm:py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={isMobile ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={isMobile ? { duration: 0 } : undefined}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-10"
          >
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 text-center mb-1">
              {t("productPage.selectGrowthTier")}
            </h2>
            <p className="text-sm text-slate-500 text-center mb-8">
              {t("productPage.chooseCampaignSize")}
            </p>

            {/* Horizontal scroll on mobile */}
            <div className="flex md:grid md:grid-cols-5 gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-2 px-2 md:mx-0 md:px-0 md:overflow-visible scrollbar-hide">
              {pricingTiers.map((tier, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedTier(i)}
                  className={`cursor-pointer flex-shrink-0 w-[140px] min-w-[120px] sm:w-[160px] md:w-auto snap-center rounded-2xl p-4 md:p-5 text-center transition-all duration-300 border-2 ${
                    selectedTier === i
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-600/15 scale-[1.03]"
                      : "border-slate-200 bg-white hover:shadow-md hover:border-slate-300"
                  }`}
                >
                  <p className={`text-2xl md:text-3xl font-extrabold ${selectedTier === i ? "text-white" : "text-slate-900"}`}>
                    {tier.followers}
                  </p>
                  <p className={`text-xs mt-1 ${selectedTier === i ? "text-white/70" : "text-slate-500"}`}>
                    {t("productPage.audienceReach")}
                  </p>
                  <div className="mt-3">
                    {tier.originalPrice && (
                      <span className={`text-xs line-through mr-1 ${selectedTier === i ? "text-white/50" : "text-slate-400"}`}>
                        ${tier.originalPrice}
                      </span>
                    )}
                    <span className={`text-2xl font-extrabold ${selectedTier === i ? "text-white" : "text-slate-900"}`}>
                      ${tier.price}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBuyNow(tier);
                    }}
                    className={`mt-4 w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      selectedTier === i
                        ? "bg-white text-indigo-600 hover:bg-indigo-50"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    {t("productPage.activate")}
                  </button>
                </div>
              ))}
            </div>

            {/* Micro-trust under pricing */}
            <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {t("productPage.safeSecure")}</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {t("productPage.instantDeployment")}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Features Row */}
      <section className="py-8 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
            {trustIcons.map((Icon, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={v} custom={i} className="text-center group">
                <div className="w-11 h-11 mx-auto rounded-xl bg-indigo-50 flex items-center justify-center mb-2 group-hover:bg-indigo-100 transition-colors">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-xs font-medium text-slate-700">{t(trustKeys[i])}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Launch */}
      <section className="py-12 sm:py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}>
            <motion.h2 variants={v} custom={0} className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-5 sm:mb-6">
              {whyShouldBuy.title}
            </motion.h2>
            {whyShouldBuy.paragraphs.map((p, i) => (
              <motion.p key={i} variants={v} custom={i + 1} className="text-sm sm:text-base text-slate-500 leading-relaxed mb-4 max-w-3xl">
                {p}
              </motion.p>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-16 md:py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}>
            <motion.h2 variants={v} custom={0} className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-6 sm:mb-8">
              {howToBuy.title}
            </motion.h2>
            <div className="space-y-4">
              {howToBuy.paragraphs.map((p, i) => (
                <motion.div key={i} variants={v} custom={i + 1} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-white">{i + 1}</span>
                  </div>
                  <p className="text-sm sm:text-base text-slate-500 leading-relaxed">{p}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Scale */}
      <section className="py-12 sm:py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}>
            <motion.h2 variants={v} custom={0} className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-5 sm:mb-6">
              {whyBuyMore.title}
            </motion.h2>
            {whyBuyMore.paragraphs.map((p, i) => (
              <motion.p key={i} variants={v} custom={i + 1} className="text-sm sm:text-base text-slate-500 leading-relaxed mb-4 max-w-3xl">
                {p}
              </motion.p>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 sm:py-16 md:py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="text-center mb-8 sm:mb-12">
            <motion.p variants={v} custom={0} className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-3">{t("productPage.testimonialsLabel")}</motion.p>
            <motion.h2 variants={v} custom={1} className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{t("productPage.testimonialsTitle")}</motion.h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((tm, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={v} custom={i}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
              >
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(tm.rating)].map((_, si) => (
                    <Star key={si} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">&ldquo;{tm.text}&rdquo;</p>
                <div>
                  <p className="text-sm font-bold text-slate-900">{tm.name}</p>
                  <p className="text-xs text-slate-500">{tm.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="text-center mb-8 sm:mb-12">
            <motion.p variants={v} custom={0} className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-3">{t("productPage.faqLabel")}</motion.p>
            <motion.h2 variants={v} custom={1} className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{t("productPage.faqTitle")}</motion.h2>
          </motion.div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-200 px-6">
            {faqs.map((faq, i) => (
              <FAQAccordionItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* Checkout Modal */}
      {checkoutTier && (
        <CheckoutModal
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          platform={platform}
          tier={checkoutTier}
          accentColor="#ee1d52"
          accentGradient="linear-gradient(135deg, #69C9D0 0%, #ee1d52 100%)"
        />
      )}
    </>
  );
}
