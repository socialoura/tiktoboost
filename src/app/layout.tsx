import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist } from "next/font/google";
import "./globals.css";
import ConditionalHeader from "@/components/layout/ConditionalHeader";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { TranslationProvider } from "@/context/TranslationContext";
import { PostHogProvider } from "@/components/PostHogProvider";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TiktoBoost — Boostez votre TikTok avec l'IA",
  description:
    "Accélérez votre présence sur TikTok avec le moteur IA de TiktoBoost. Abonnés réels, amplification algorithmique et croissance mesurable pour les créateurs et marques TikTok.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-black text-white overflow-x-hidden">
        <GoogleAnalytics />
        <PostHogProvider>
          <Suspense fallback={null}>
            <CurrencyProvider>
              <TranslationProvider>
                <ConditionalHeader />
                {children}
              </TranslationProvider>
            </CurrencyProvider>
          </Suspense>
        </PostHogProvider>
      </body>
    </html>
  );
}
