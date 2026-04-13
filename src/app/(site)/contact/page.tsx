"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Clock,
  Send,
  Shield,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Headphones,
  ArrowRight,
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

const ACCENT = "#6366f1";

/* ═══════════════════════════════════════════════════════════════
   CONTACT PAGE — Premium Dark Design (Apple Support Style)
   ═══════════════════════════════════════════════════════════════ */
export default function ContactPage() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    orderId: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.message.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/support-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim() || undefined,
          email: formData.email.trim(),
          orderId: formData.orderId.trim() || undefined,
          message: formData.message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setStatus("success");
      setFormData({ name: "", email: "", orderId: "", message: "" });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  const inputClass =
    "w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[14px] text-white placeholder:text-zinc-600 focus:border-white/[0.2] focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all";

  return (
    <>
      {/* ───────────── HERO ───────────── */}
      <section className="relative pt-24 pb-12 sm:pt-28 sm:pb-14 md:pt-40 md:pb-20 overflow-hidden bg-black">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-indigo-500/8 blur-[120px]" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 mb-4 sm:mb-5">
            {t("contact.badge")}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8, ease: [0.25, 0.4, 0.25, 1] as const }}
            className="text-[clamp(1.75rem,5vw,3.5rem)] font-semibold text-white tracking-tight leading-[1.08]"
          >
            {t("contact.heroTitle1")}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              {t("contact.heroTitle2")}
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-6 text-[15px] sm:text-[17px] text-zinc-400 leading-relaxed max-w-xl mx-auto"
          >
            {t("contact.heroSubtitle")}
          </motion.p>
        </div>
      </section>

      {/* ───────────── MAIN — 2 Columns ───────────── */}
      <section className="py-12 sm:py-16 md:py-24 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
            {/* ── LEFT COLUMN: Support Info (2 cols) ── */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="lg:col-span-2 space-y-4"
            >
              {/* Response Time Card */}
              <motion.div variants={fadeUp} custom={0} className="rounded-2xl p-6 sm:p-7 border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-white">{t("contact.avgResponse")}</p>
                    <p className="text-[24px] font-semibold text-emerald-400 leading-tight">&lt; 15 min</p>
                  </div>
                </div>
                <p className="text-[13px] text-zinc-500 leading-relaxed">
                  {t("contact.avgResponseDesc")}
                </p>
              </motion.div>

              {/* Email Card */}
              <motion.div variants={fadeUp} custom={1} className="rounded-2xl p-6 sm:p-7 border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-white">{t("contact.emailSupport")}</p>
                    <a href="mailto:reachopia@gmail.com" className="text-[14px] text-indigo-400 hover:text-indigo-300 transition-colors">
                      reachopia@gmail.com
                    </a>
                  </div>
                </div>
                <p className="text-[13px] text-zinc-500 leading-relaxed">
                  {t("contact.emailDesc")}
                </p>
              </motion.div>

              {/* Hours Card */}
              <motion.div variants={fadeUp} custom={2} className="rounded-2xl p-6 sm:p-7 border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                    <Headphones className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-white">{t("contact.businessHours")}</p>
                    <p className="text-[14px] text-zinc-300">{t("contact.businessHoursValue")}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-zinc-500">{t("contact.weekendSupport")}</span>
                    <span className="text-zinc-300">{t("contact.weekendHours")}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-zinc-500">{t("contact.emergencyPriority")}</span>
                    <span className="text-emerald-400 font-medium">24/7</span>
                  </div>
                </div>
              </motion.div>

              {/* Status Pill */}
              <motion.div variants={fadeUp} custom={3} className="rounded-2xl p-5 border border-emerald-500/20 bg-emerald-500/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[13px] font-medium text-emerald-400">{t("contact.allSystemsOp")}</span>
                </div>
              </motion.div>
            </motion.div>

            {/* ── RIGHT COLUMN: Contact Form (3 cols) ── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as const }}
              className="lg:col-span-3"
            >
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
                <h2 className="text-[20px] font-semibold text-white mb-1.5 tracking-tight">
                  {t("contact.sendMessage")}
                </h2>
                <p className="text-[13px] text-zinc-500 mb-7">
                  {t("contact.sendMessageDesc")}
                </p>

                {status === "success" ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-10"
                  >
                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                    </div>
                    <h3 className="text-[18px] font-semibold text-white mb-1.5">{t("contact.messageSent")}</h3>
                    <p className="text-[13px] text-zinc-400 mb-6">
                      {t("contact.messageSentDesc")}
                    </p>
                    <button
                      onClick={() => setStatus("idle")}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-[13px] font-semibold text-white hover:bg-white/[0.1] transition-colors"
                    >
                      {t("contact.sendAnother")}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name + Email row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[12px] font-medium text-zinc-400 mb-2">{t("contact.labelName")}</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder={t("contact.placeholderName")}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-medium text-zinc-400 mb-2">
                          {t("contact.labelEmail")} <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="your@email.com"
                          required
                          className={inputClass}
                        />
                      </div>
                    </div>

                    {/* Order ID */}
                    <div>
                      <label className="block text-[12px] font-medium text-zinc-400 mb-2">
                        {t("contact.labelOrderId")} <span className="text-zinc-600">{t("contact.labelOrderIdOptional")}</span>
                      </label>
                      <input
                        type="text"
                        value={formData.orderId}
                        onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                        placeholder="VPX-XXXXXXX"
                        className={inputClass}
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-[12px] font-medium text-zinc-400 mb-2">
                        {t("contact.labelMessage")} <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                        rows={5}
                        placeholder={t("contact.placeholderMessage")}
                        className={`${inputClass} resize-none`}
                      />
                    </div>

                    {/* Error */}
                    {status === "error" && errorMsg && (
                      <p className="text-red-400 text-[13px]">{errorMsg}</p>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={status === "loading" || !formData.email.trim() || !formData.message.trim()}
                      className="shine relative w-full py-4 rounded-2xl text-[14px] font-semibold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2 mt-2"
                      style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #818cf8 100%)` }}
                    >
                      {status === "loading" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          {t("contact.sendButton")}
                        </>
                      )}
                    </button>

                    {/* Trust line */}
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <Shield className="w-3 h-3 text-zinc-600" />
                      <span className="text-[11px] text-zinc-600">
                        {t("contact.trustLine")}
                      </span>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───────────── TRUST SECTION ───────────── */}
      <section className="py-14 sm:py-20 md:py-28 bg-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="text-center">
            <motion.p variants={fadeUp} custom={0} className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 mb-4">
              {t("contact.whyLabel")}
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-[clamp(1.4rem,3vw,2.4rem)] font-semibold text-white tracking-tight mb-12">
              {t("contact.whyTitle")}
            </motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: MessageCircle, title: t("contact.why1Title"), desc: t("contact.why1Desc") },
              { icon: Shield, title: t("contact.why2Title"), desc: t("contact.why2Desc") },
              { icon: Headphones, title: t("contact.why3Title"), desc: t("contact.why3Desc") },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="rounded-2xl p-7 border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 group"
              >
                <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4 group-hover:bg-white/[0.06] transition-colors">
                  <item.icon className="w-5 h-5 text-zinc-300" />
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-[13px] text-zinc-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
