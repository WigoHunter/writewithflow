"use client";

import { useEffect, useState } from "react";
import { getTodayWordChange, getStatsDateRange } from "@/app/actions/writing-stats";
import { calculateCurrentStreak } from "@/lib/streak";
import { getTodayDate } from "@/lib/word-count";

export default function TodayStats() {
  const [todayWordChange, setTodayWordChange] = useState<number | null>(null);
  const [currentStreak, setCurrentStreak] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Use client's local timezone to get today's date
        const today = getTodayDate();

        // Fetch today's word change
        const wordChange = await getTodayWordChange(today);
        setTodayWordChange(wordChange);

        // Calculate streak (needs historical data)
        const oneYearAgo = new Date();
        oneYearAgo.setDate(oneYearAgo.getDate() - 365);
        const streakStartDate = (() => {
          const year = oneYearAgo.getFullYear();
          const month = String(oneYearAgo.getMonth() + 1).padStart(2, '0');
          const day = String(oneYearAgo.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        })();

        const streakStats = await getStatsDateRange(streakStartDate, today);
        const streak = calculateCurrentStreak(streakStats, today);
        setCurrentStreak(streak);
      } catch (error) {
        console.error("Failed to fetch today stats:", error);
        setTodayWordChange(0);
        setCurrentStreak(0);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-border p-4">
        <h4 className="text-base font-semibold text-text mb-4">今日寫作</h4>
        <div className="space-y-3 animate-pulse">
          <div>
            <div className="text-xs text-text/50 font-sans mb-1">字數</div>
            <div className="h-9 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="border-t border-border pt-3">
            <div className="text-xs text-text/50 font-sans mb-1">連續寫作</div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-border p-4">
      <h4 className="text-base font-semibold text-text mb-4">今日寫作</h4>
      <div className="space-y-3">
        <div>
          <div className="text-xs text-text/50 font-sans mb-1">字數</div>
          <div className="text-3xl font-bold text-primary tabular-nums">
            {(todayWordChange ?? 0) >= 0 ? '+' : ''}{(todayWordChange ?? 0).toLocaleString()}
          </div>
        </div>
        <div className="border-t border-border pt-3">
          <div className="text-xs text-text/50 font-sans mb-1">連續寫作</div>
          <div className="text-2xl font-bold text-text tabular-nums">
            {currentStreak ?? 0} <span className="text-sm text-text/50 font-normal">天</span>
          </div>
        </div>
      </div>
    </div>
  );
}
