"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";

export default function StatsPage() {
  const router = useRouter();
  const { setActiveTab } = useAppContext();

  useEffect(() => {
    setActiveTab("stats");
    router.replace("/");
  }, [router, setActiveTab]);

  return null;
}
