"use client";

import type { NextPage } from "next";
import React, { lazy, Suspense } from "react";
import Ladder from "../components/Ladder";
import PersonalInfo from "../components/PersonalInfo";
import Unsolved from "../components/Unsolved";
import UpcomingContestBanner from "../components/UpcomingContestBanner";
import { useAppContext } from "../context/AppContext";

// Lazy load tab content for performance
const ContestsContent = lazy(() => import("../components/ContestsContent"));
const TopicsContent = lazy(() => import("../components/TopicsContent"));
const StatsContent = lazy(() => import("../components/StatsContent"));

const TabSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
    <div className="h-10 w-64 skeleton" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-24 skeleton" />
      ))}
    </div>
  </div>
);

const Home: NextPage = () => {
  const {
    problems,
    userInfo,
    userSolvedSet,
    loadingProblems,
    loadingUser,
    errorProblems,
    activeTab,
  } = useAppContext();

  // Render Solrise (home) tab content
  const renderSolrise = () => (
    <>
      {/* Upcoming Contest Banner */}
      <UpcomingContestBanner />

      {/* Profile Section */}
      {userInfo ? (
        <PersonalInfo
          profileImage={userInfo.titlePhoto}
          handle={userInfo.handle}
          currentRating={userInfo.rating}
          maxRating={userInfo.maxRating}
          isLoading={loadingUser}
        />
      ) : loadingUser ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="h-32 skeleton" />
        </div>
      ) : null}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadingProblems ? (
          <div className="space-y-4">
            <div className="h-12 w-64 skeleton" />
            <div className="flex flex-wrap gap-2">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-8 w-16 skeleton" />
              ))}
            </div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 skeleton" />
              ))}
            </div>
          </div>
        ) : errorProblems ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--danger-bg)] flex items-center justify-center">
              <i className="fa-solid fa-triangle-exclamation text-2xl text-[var(--danger)]" />
            </div>
            <p className="text-sm text-[var(--text-muted)]">{errorProblems}</p>
          </div>
        ) : (
          <>
            <Ladder problems={problems} userSolvedSet={userSolvedSet} />

            {/* Unsolved Section */}
            <section className="mt-10 space-y-4 animate-fade-in-up">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  <i className="fa-solid fa-clock-rotate-left text-orange-500 mr-2" />
                  Unsolved Problems
                </h2>
              </div>
              <Unsolved />
            </section>
          </>
        )}
      </main>
    </>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
      {/* Tab Content */}
      <div className="tab-content-enter" key={activeTab}>
        {activeTab === "solrise" && renderSolrise()}
        {activeTab === "contests" && (
          <Suspense fallback={<TabSkeleton />}>
            <ContestsContent />
          </Suspense>
        )}
        {activeTab === "topics" && (
          <Suspense fallback={<TabSkeleton />}>
            <TopicsContent />
          </Suspense>
        )}
        {activeTab === "stats" && (
          <Suspense fallback={<TabSkeleton />}>
            <StatsContent />
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default Home;
