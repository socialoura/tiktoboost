"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/useMediaQuery";

interface AnimateOnScrollProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}

export default function AnimateOnScroll({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: AnimateOnScrollProps) {
  const isMobile = useIsMobile();

  // On mobile: render instantly without Framer Motion overhead
  if (isMobile) {
    return <div className={className}>{children}</div>;
  }

  const directionMap = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { y: 0, x: 40 },
    right: { y: 0, x: -40 },
    none: { y: 0, x: 0 },
  };

  const { x, y } = directionMap[direction];

  return (
    <motion.div
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
