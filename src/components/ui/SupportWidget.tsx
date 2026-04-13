"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";

type WidgetState = "idle" | "sending" | "success" | "error";

export default function SupportWidget() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<WidgetState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const resetForm = () => {
    setEmail("");
    setMessage("");
    setState("idle");
    setErrorMsg("");
  };

  const handleClose = () => {
    setOpen(false);
    if (state === "success") resetForm();
  };

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !isValidEmail(email.trim())) {
      setErrorMsg(t("supportWidget.errorInvalidEmail"));
      setState("error");
      return;
    }
    if (!message.trim()) {
      setErrorMsg(t("supportWidget.errorEmptyMessage"));
      setState("error");
      return;
    }

    setState("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/support-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("supportWidget.errorSendFailed"));
      }

      setState("success");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : t("supportWidget.errorGeneric")
      );
      setState("error");
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full bg-gradient-to-r from-primary-dark to-secondary text-white shadow-[0px_8px_24px_rgba(193,53,132,0.4)] flex items-center justify-center hover:opacity-90 transition-opacity"
            aria-label={t("supportWidget.ariaOpen")}
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-[90] w-[360px] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-[0px_12px_48px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-dark to-secondary px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg font-bold text-white">
                  {t("supportWidget.title")}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="font-body text-xs text-white/80">
                    {t("supportWidget.onlineStatus")}
                  </span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                aria-label={t("supportWidget.ariaClose")}
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              {state === "success" ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-6"
                >
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-7 h-7 text-green-600" />
                  </div>
                  <h4 className="font-heading text-xl font-bold text-dark mb-1">
                    {t("supportWidget.successTitle")}
                  </h4>
                  <p className="font-body text-sm text-gray-text mb-4">
                    {t("supportWidget.successDesc")}{" "}
                    <span className="font-medium text-dark">{email}</span>
                  </p>
                  <button
                    onClick={resetForm}
                    className="font-body text-sm text-primary hover:underline"
                  >
                    {t("supportWidget.sendAnother")}
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block font-body text-sm font-medium text-dark mb-1.5">
                      {t("supportWidget.labelEmail")}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (state === "error") setState("idle");
                      }}
                      placeholder={t("supportWidget.placeholderEmail")}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 font-body text-sm text-dark placeholder:text-gray-400 focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block font-body text-sm font-medium text-dark mb-1.5">
                      {t("supportWidget.labelMessage")}
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        if (state === "error") setState("idle");
                      }}
                      placeholder={t("supportWidget.placeholderMessage")}
                      required
                      rows={4}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 font-body text-sm text-dark placeholder:text-gray-400 focus:border-primary focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  {state === "error" && errorMsg && (
                    <p className="text-red-500 text-xs font-body">{errorMsg}</p>
                  )}

                  <button
                    type="submit"
                    disabled={state === "sending"}
                    className="w-full py-3 rounded-full bg-gradient-to-r from-primary-dark to-secondary text-white font-body font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {state === "sending" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t("supportWidget.sending")}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {t("supportWidget.sendButton")}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
