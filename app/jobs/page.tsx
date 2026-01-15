"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function JobsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/jobs/bid-board", { scroll: false });
  }, [router]);

  return null; // Minimal render to avoid flash
}
