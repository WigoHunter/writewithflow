export type DailyStats = {
  date: string;
  document_id: string;
  word_count: number;
};

/**
 * 計算連續寫作天數 (streak)
 *
 * Active day 定義：當天所有文件的總字數 > 前一天所有文件的總字數
 */
export function calculateCurrentStreak(stats: DailyStats[]): number {
  if (stats.length === 0) return 0;

  // 1. 將 per-document 資料聚合成 per-day 總字數
  const dailyTotals = new Map<string, number>();

  stats.forEach(stat => {
    const current = dailyTotals.get(stat.date) || 0;
    dailyTotals.set(stat.date, current + stat.word_count);
  });

  // 2. 轉換成陣列並排序（從新到舊）
  const sortedDays = Array.from(dailyTotals.entries())
    .map(([date, total_words]) => ({ date, total_words }))
    .sort((a, b) => b.date.localeCompare(a.date));

  if (sortedDays.length === 0) return 0;

  // 3. 計算 streak
  let streak = 0;

  for (let i = 0; i < sortedDays.length - 1; i++) {
    const today = sortedDays[i];
    const yesterday = sortedDays[i + 1];

    // 檢查日期是否連續
    const todayDate = new Date(today.date);
    const yesterdayDate = new Date(yesterday.date);
    const dayDiff = Math.floor(
      (todayDate.getTime() - yesterdayDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (dayDiff !== 1) {
      // 日期不連續，中斷
      break;
    }

    // 檢查是否有寫作（總字數增加）
    if (today.total_words > yesterday.total_words) {
      streak++;
    } else {
      // 沒寫作，中斷
      break;
    }
  }

  return streak;
}
