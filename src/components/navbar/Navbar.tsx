"use client";
import React, { useState, useSyncExternalStore } from "react";
import { useRouter, usePathname } from "next/navigation";
import ThemeToggleButton from "./ThemeToggleButton";
import ReportBug from "./ReportBug";
import EnterHandle from "./EnterHandle";
import { updateVisitStreak } from "@/utils/streakTracker";
import { useAppContext, ActiveTab } from "@/context/AppContext";

interface NavbarProps {
  handle?: string;
  onHandleSubmit: (handle: string) => Promise<void>;
  onHandleClear: () => void;
  userLoading?: boolean;
}

const NAV_LINKS: { tab: ActiveTab; label: string; icon: string }[] = [
  { tab: "contests", label: "Contests", icon: "fa-trophy" },
  { tab: "topics", label: "Topics", icon: "fa-tags" },
  { tab: "stats", label: "Stats", icon: "fa-chart-line" },
];

const Navbar: React.FC<NavbarProps> = ({
  handle,
  onHandleSubmit,
  onHandleClear,
  userLoading = false,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { activeTab, setActiveTab } = useAppContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [visitStreak, setVisitStreak] = useState(0);

  React.useEffect(() => {
    setVisitStreak(updateVisitStreak().currentStreak);
  }, []);

  const handleTabClick = (tab: ActiveTab) => {
    // If we're not on the home page, navigate there first
    if (pathname !== "/") {
      router.push("/");
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogoClick = () => {
    if (pathname !== "/") {
      router.push("/");
    }
    setActiveTab("solrise");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header
      className="glass sticky top-0 z-50 animate-slide-down"
      suppressHydrationWarning
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <button
              className="flex items-center gap-2.5 group"
              onClick={handleLogoClick}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all">
                <i className="fa-solid fa-bolt-lightning text-white text-sm" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-500 bg-clip-text text-transparent">
                Solrise
              </span>
            </button>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = activeTab === link.tab;
                return (
                  <button
                    key={link.tab}
                    onClick={() => handleTabClick(link.tab)}
                    className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      isActive
                        ? "text-[var(--accent)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                    }`}
                  >
                    <i className={`fa-solid ${link.icon} text-xs`} />
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-[var(--accent)] nav-active-indicator" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Handle area */}
            <div className="hidden sm:block">
              {mounted && handle ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                  <button
                    onClick={() => onHandleSubmit(handle)}
                    className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors flex items-center gap-2"
                    disabled={userLoading}
                  >
                    <i className="fa-solid fa-user text-xs text-[var(--accent)]" />
                    {handle}
                    {userLoading && (
                      <i className="fa-solid fa-spinner fa-spin text-xs text-[var(--text-muted)]" />
                    )}
                  </button>
                  {visitStreak > 0 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                      <i className="fa-solid fa-fire text-orange-500 text-xs" />
                      <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                        {visitStreak}
                      </span>
                    </div>
                  )}
                  <button
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-all text-xs"
                    onClick={onHandleClear}
                    title="Clear handle"
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>
              ) : (
                <EnterHandle
                  onSubmitHandle={onHandleSubmit}
                  onClear={onHandleClear}
                  isLoading={userLoading}
                />
              )}
            </div>

            <ThemeToggleButton />
            <ReportBug />

            {/* Mobile menu button */}
            <button
              className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[var(--bg-tertiary)] transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              title="Toggle menu"
            >
              <i
                className={`fa-solid ${mobileOpen ? "fa-xmark" : "fa-bars"} text-[var(--text-secondary)]`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border-color)] animate-slide-down">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => {
              const isActive = activeTab === link.tab;
              return (
                <button
                  key={link.tab}
                  onClick={() => {
                    handleTabClick(link.tab);
                    setMobileOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-3 ${
                    isActive
                      ? "bg-[var(--accent-bg)] text-[var(--accent)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                  }`}
                >
                  <i className={`fa-solid ${link.icon} text-xs w-4`} />
                  {link.label}
                </button>
              );
            })}
            {/* Mobile handle input */}
            <div className="pt-2 sm:hidden">
              {mounted && handle ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)]">
                  <i className="fa-solid fa-user text-xs text-[var(--accent)]" />
                  <span className="text-sm font-semibold">{handle}</span>
                  <button
                    onClick={onHandleClear}
                    className="ml-auto text-[var(--danger)]"
                    title="Clear handle"
                  >
                    <i className="fa-solid fa-xmark text-xs" />
                  </button>
                </div>
              ) : (
                <EnterHandle
                  onSubmitHandle={onHandleSubmit}
                  onClear={onHandleClear}
                  isLoading={userLoading}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
