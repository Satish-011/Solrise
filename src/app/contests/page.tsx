"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";

export default function ContestsPage() {
  const router = useRouter();
  const { setActiveTab } = useAppContext();

  useEffect(() => {
    setActiveTab("contests");
    router.replace("/");
  }, [router, setActiveTab]);

  return null;
}
