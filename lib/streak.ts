export type DailyStats = {
  date: string;
  document_id: string;
  word_count: number;
};

/**
 * 計算兩個日期字串之間相差的天數
 * @param dateStr1 較新的日期 (YYYY-MM-DD)
 * @param dateStr2 較舊的日期 (YYYY-MM-DD)
 * @returns 天數差異
 */
function getDaysDiff(dateStr1: string, dateStr2: string): number {
  // 解析為本地日期（避免時區問題）
  const [y1, m1, d1] = dateStr1.split('-').map(Number);
  const [y2, m2, d2] = dateStr2.split('-').map(Number);
  const date1 = new Date(y1, m1 - 1, d1);
  const date2 = new Date(y2, m2 - 1, d2);
  return Math.floor((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * 計算連續寫作天數 (streak)
 *
 * Active day 定義：當天所有文件的總字數 > 前一天所有文件的總字數
 *
 * @param stats 每日寫作統計資料
 * @param today 今天的日期字串 (YYYY-MM-DD)，用於確認 streak 是否仍然有效
 */
export function calculateCurrentStreak(stats: DailyStats[], today: string): number {
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

  // 3. 檢查最新記錄是否為今天
  //    如果今天沒有寫作記錄，streak 為 0
  const latestDate = sortedDays[0].date;
  const daysSinceLatest = getDaysDiff(today, latestDate);

  if (daysSinceLatest !== 0) {
    // 今天沒有寫作記錄，streak 中斷
    return 0;
  }

  // 4. 計算 streak
  let streak = 0;

  for (let i = 0; i < sortedDays.length - 1; i++) {
    const current = sortedDays[i];
    const previous = sortedDays[i + 1];

    // 檢查日期是否連續
    const dayDiff = getDaysDiff(current.date, previous.date);

    if (dayDiff !== 1) {
      // 日期不連續，中斷
      break;
    }

    // 檢查是否有寫作（總字數增加）
    if (current.total_words > previous.total_words) {
      streak++;
    } else {
      // 沒寫作，中斷
      break;
    }
  }

  return streak;
}
