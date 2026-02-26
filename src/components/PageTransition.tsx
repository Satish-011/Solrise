"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [phase, setPhase] = useState<"enter" | "idle">("enter");
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname;
      setPhase("enter");
      setDisplayChildren(children);
    } else {
      setDisplayChildren(children);
    }
  }, [pathname, children]);

  useEffect(() => {
    if (phase === "enter") {
      const timer = setTimeout(() => setPhase("idle"), 700);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  return (
    <div
      className={phase === "enter" ? "page-transition-enter" : "page-transition-idle"}
      style={{ willChange: phase === "enter" ? "opacity, transform" : "auto" }}
    >
      {displayChildren}
    </div>
  );
}
