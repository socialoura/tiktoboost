"use client";

import { usePathname } from "next/navigation";
import TopAnnouncementBar from "@/components/ui/TopAnnouncementBar";
import Navbar from "@/components/layout/Navbar";

export default function ConditionalHeader() {
  const pathname = usePathname();
  
  // Hide header on admin pages
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <TopAnnouncementBar />
      <Navbar />
    </>
  );
}
