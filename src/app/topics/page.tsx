"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";

export default function TopicsPage() {
  const router = useRouter();
  const { setActiveTab } = useAppContext();

  useEffect(() => {
    setActiveTab("topics");
    router.replace("/");
  }, [router, setActiveTab]);

  return null;
}
