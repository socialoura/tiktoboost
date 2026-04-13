"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  Shield,
  Eye,
  Users,
  Target,
  Brain,
  Zap,
  ChevronDown,
  ArrowRight,
  Lock,
  Check,
  Globe,
  BarChart3,
} from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";

/* ─── Animation Variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as const },
  }),
};

/* ─── Animated Counter ─── */
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ─── FAQ Accordion ─── */

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.06] last:border-0">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full py-6 text-left gap-4">
        <span className="text-[15px] font-medium text-white">{q}</span>
        <ChevronDown className={`w-5 h-5 text-zinc-500 flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <motion.div initial={false} animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }} transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] as const }} className="overflow-hidden">
        <p className="pb-6 text-[14px] text-zinc-400 leading-relaxed">{a}</p>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ABOUT PAGE — Premium Dark Design
   ═══════════════════════════════════════════════════════════════ */
export default function AboutPage() {
  const { t } = useTranslation();

  const faqs = [
    { q: t("about.faq1Q"), a: t("about.faq1A") },
    { q: t("about.faq2Q"), a: t("about.faq2A") },
    { q: t("about.faq3Q"), a: t("about.faq3A") },
    { q: t("about.faq4Q"), a: t("about.faq4A") },
  ];

  return (
    <>
      {/* ───────────── HERO ───────────── */}
      <section className="relative pt-24 pb-14 sm:pt-28 sm:pb-18 md:pt-40 md:pb-28 overflow-hidden bg-black">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-indigo-500/8 blur-[120px]" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 mb-4 sm:mb-5">
            {t("about.badge")}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8, ease: [0.25, 0.4, 0.25, 1] as const }}
            className="text-[clamp(1.75rem,5vw,4rem)] font-semibold text-white tracking-tight leading-[1.08]"
          >
            {t("about.heroTitle1")}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400">
              {t("about.heroTitle2")}
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-6 text-[15px] sm:text-[17px] text-zinc-400 leading-relaxed max-w-xl mx-auto"
          >
            {t("about.heroSubtitle")}
          </motion.p>
        </div>
      </section>

      {/* ───────────── OUR TECHNOLOGY — Bento Grid ───────────── */}
      <section className="py-14 sm:py-20 md:py-28 lg:py-32 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="text-center mb-10 sm:mb-14 md:mb-16">
            <motion.p variants={fadeUp} custom={0} className="text-[11px] font-medium uppercase tracking-[0.2em] text-indigo-400 mb-4">
              {t("about.techLabel")}
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-[clamp(1.6rem,4vw,3rem)] font-semibold text-white tracking-tight">
              {t("about.techTitle")}
            </motion.h2>
          </motion.div>

          {/* Bento Grid — 3 large cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {[
              {
                icon: Brain,
                title: t("about.tech1Title"),
                desc: t("about.tech1Desc"),
                accent: "from-indigo-500 to-cyan-500",
              },
              {
                icon: Globe,
                title: t("about.tech2Title"),
                desc: t("about.tech2Desc"),
                accent: "from-emerald-500 to-cyan-500",
              },
              {
                icon: Shield,
                title: t("about.tech3Title"),
                desc: t("about.tech3Desc"),
                accent: "from-amber-500 to-orange-500",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="relative rounded-2xl p-7 sm:p-8 border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 group overflow-hidden"
              >
                <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${item.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-5 group-hover:bg-white/[0.06] transition-colors">
                  <item.icon className="w-6 h-6 text-zinc-300" />
                </div>
                <h3 className="text-[17px] font-semibold text-white mb-2.5 tracking-tight">{item.title}</h3>
                <p className="text-[14px] text-zinc-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Extra detail cards — 2 cols */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mt-4 md:mt-5">
            {[
              { icon: BarChart3, title: t("about.tech4Title"), desc: t("about.tech4Desc") },
              { icon: Zap, title: t("about.tech5Title"), desc: t("about.tech5Desc") },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="rounded-2xl p-7 sm:p-8 border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 group"
              >
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-5 group-hover:bg-white/[0.06] transition-colors">
                  <item.icon className="w-6 h-6 text-zinc-300" />
                </div>
                <h3 className="text-[17px] font-semibold text-white mb-2.5 tracking-tight">{item.title}</h3>
                <p className="text-[14px] text-zinc-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── STATS ───────────── */}
      <section className="py-14 sm:py-20 md:py-28 lg:py-32 bg-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="text-center mb-10 sm:mb-14 md:mb-16">
            <motion.p variants={fadeUp} custom={0} className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 mb-4">
              {t("about.statsLabel")}
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-[clamp(1.6rem,4vw,3rem)] font-semibold text-white tracking-tight">
              {t("about.statsTitle")}
            </motion.h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {[
              { value: 10, suffix: "M+", label: t("about.stat1Label") },
              { value: 99.9, suffix: "%", label: t("about.stat2Label") },
              { value: 5000, suffix: "+", label: t("about.stat3Label") },
              { value: 150, suffix: "+", label: t("about.stat4Label") },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="rounded-2xl p-6 sm:p-8 border border-white/[0.06] bg-white/[0.02] text-center"
              >
                <p className="text-[clamp(1.8rem,4vw,2.8rem)] font-semibold text-white tracking-tight">
                  <Counter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-1 text-[12px] sm:text-[13px] text-zinc-500 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── TEAM ───────────── */}
      <section className="py-14 sm:py-20 md:py-28 lg:py-32 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="text-center mb-10 sm:mb-14 md:mb-16">
            <motion.p variants={fadeUp} custom={0} className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 mb-4">{t("about.teamLabel")}</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-[clamp(1.6rem,4vw,3rem)] font-semibold text-white tracking-tight">
              {t("about.teamTitle")}
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="mt-3 text-[14px] text-zinc-500 max-w-lg mx-auto">
              {t("about.teamSubtitle")}
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
            {[
              { name: t("about.team1Name"), role: t("about.team1Role") },
              { name: t("about.team2Name"), role: t("about.team2Role") },
              { name: t("about.team3Name"), role: t("about.team3Role") },
            ].map((member, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="rounded-2xl p-8 border border-white/[0.06] bg-white/[0.02] text-center hover:bg-white/[0.04] transition-all duration-500 group"
              >
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 mx-auto mb-4 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                  <span className="text-xl font-semibold text-indigo-400">
                    {member.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <h3 className="text-[16px] font-semibold text-white mb-1">{member.name}</h3>
                <p className="text-[13px] text-zinc-500">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── GROWTH SOLUTIONS ───────────── */}
      <section className="py-14 sm:py-20 md:py-28 lg:py-32 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="text-center mb-10 sm:mb-14 md:mb-16">
            <motion.p variants={fadeUp} custom={0} className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 mb-4">{t("about.solutionsLabel")}</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-[clamp(1.6rem,4vw,3rem)] font-semibold text-white tracking-tight">
              {t("about.solutionsTitle")}
            </motion.h2>
          </motion.div>

          <div className="max-w-lg mx-auto">
            {[
              { platform: "TikTok", services: [t("about.ttService1"), t("about.ttService2"), t("about.ttService3"), t("about.ttService4"), t("about.ttService5")], accent: "#69C9D0", gradient: "from-[#69C9D0] to-[#ee1d52]", href: "/" },
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="rounded-2xl p-7 sm:p-8 border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-5`}>
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-[18px] font-semibold text-white mb-4">{item.platform} Growth</h3>
                <ul className="space-y-2.5 mb-6">
                  {item.services.map((service, si) => (
                    <li key={si} className="flex items-center gap-2.5 text-[14px] text-zinc-400">
                      <Check className="w-4 h-4 flex-shrink-0" style={{ color: item.accent }} />
                      {service}
                    </li>
                  ))}
                </ul>
                <Link href={item.href}
                  className="inline-flex items-center gap-2 text-[13px] font-semibold text-white hover:text-zinc-300 transition-colors"
                >
                  {t("about.launchCampaign")}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section className="py-14 sm:py-20 md:py-28 lg:py-32 bg-zinc-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="text-center mb-10 sm:mb-14">
            <motion.p variants={fadeUp} custom={0} className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 mb-4">{t("about.faqLabel")}</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-[clamp(1.6rem,4vw,3rem)] font-semibold text-white tracking-tight">
              {t("about.faqTitle")}
            </motion.h2>
          </motion.div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.06] px-6 sm:px-8">
            {faqs.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── FINAL CTA ───────────── */}
      <section className="relative py-16 sm:py-24 md:py-32 lg:py-36 bg-black overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-indigo-500/8 blur-[120px]" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}>
            <motion.h2 variants={fadeUp} custom={0} className="text-[clamp(1.5rem,4vw,3rem)] font-semibold text-white tracking-tight">
              {t("about.ctaTitle")}
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-5 text-[15px] text-zinc-400 max-w-md mx-auto leading-relaxed">
              {t("about.ctaSubtitle")}
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/"
                className="shine inline-flex items-center justify-center gap-2 px-8 py-4 min-h-[48px] rounded-full bg-gradient-to-r from-[#69C9D0] to-[#ee1d52] text-white text-[14px] font-semibold hover:opacity-90 transition-opacity"
              >
                {t("about.ctaTiktok")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <motion.p variants={fadeUp} custom={3} className="mt-5 text-[11px] text-zinc-600">
              {t("about.ctaSecured")}
            </motion.p>
          </motion.div>
        </div>
      </section>
    </>
  );
}
