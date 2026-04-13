"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import SectionHeading from "./SectionHeading";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title?: string;
  subtitle?: string;
  items: FAQItem[];
}

export default function FAQSection({
  title = "General FAQs",
  subtitle,
  items,
}: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[150px]">
        <SectionHeading title={title} subtitle={subtitle} />
        <div className="mt-12 max-w-[896px] mx-auto space-y-4">
          {items.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-[18px] shadow-[0px_5px_16px_0px_rgba(8,15,52,0.06)] overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left gap-4"
              >
                <span className="font-heading text-lg md:text-[22px] font-medium text-dark leading-7">
                  {item.question}
                </span>
                <ChevronDown
                  className={`w-6 h-6 text-gray-text flex-shrink-0 transition-transform duration-300 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === i ? "max-h-[500px] pb-6" : "max-h-0"
                }`}
              >
                <p className="px-6 font-body text-gray-text text-base leading-relaxed">
                  {item.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
