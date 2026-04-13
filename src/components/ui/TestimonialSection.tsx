"use client";

import { Star } from "lucide-react";
import SectionHeading from "./SectionHeading";
import { useTranslation } from "@/context/TranslationContext";

interface Testimonial {
  name: string;
  role: string;
  text: string;
  rating: number;
}

interface TestimonialSectionProps {
  testimonials: Testimonial[];
}

export default function TestimonialSection({
  testimonials,
}: TestimonialSectionProps) {
  const { t } = useTranslation();
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[150px]">
        <SectionHeading
          title={t("testimonialSection.title")}
          highlight={t("testimonialSection.highlight")}
        />
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((tm, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 shadow-[0px_5px_16px_0px_rgba(8,15,52,0.06)] hover:shadow-[0px_10px_30px_0px_rgba(8,15,52,0.1)] transition-shadow duration-300"
            >
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, si) => (
                  <Star
                    key={si}
                    className={`w-5 h-5 ${
                      si < tm.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-gray-200 text-gray-200"
                    }`}
                  />
                ))}
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-purple/20 mb-4 flex items-center justify-center">
                <span className="font-heading text-xl font-bold text-primary">
                  {tm.name.charAt(0)}
                </span>
              </div>
              <h4 className="font-heading text-lg font-semibold text-dark mb-1">
                {tm.name}
              </h4>
              <p className="font-body text-sm text-primary mb-4">{tm.role}</p>
              <p className="font-body text-gray-text text-sm leading-relaxed">
                {tm.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
