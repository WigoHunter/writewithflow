import { DailyStats } from './streak';

export type HeatmapData = Array<{
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}>;

export type CumulativeChartData = Array<{
  date: string;
  cumulative: number;
  daily: number;
}>;

/**
 * 將 per-document 資料轉換成 Heatmap 格式
 * 顯示從去年 7/1 到今年 12/31 的日期，填充缺失的日期
 */
export function transformToHeatmapData(stats: DailyStats[]): HeatmapData {
  // 1. 先聚合成 per-day 總字數
  const dailyTotals = new Map<string, number>();

  stats.forEach(stat => {
    const current = dailyTotals.get(stat.date) || 0;
    dailyTotals.set(stat.date, current + stat.word_count);
  });

  // 2. 生成日期範圍（去年 7/1 到今年 12/31）
  const today = new Date();
  const currentYear = today.getFullYear();
  const rangeStart = new Date(currentYear - 1, 6, 1); // 去年 7月1日
  const rangeEnd = new Date(currentYear, 11, 31); // 今年 12月31日

  const allDates: Array<{ date: string; total_words: number }> = [];
  const currentDate = new Date(rangeStart);

  while (currentDate <= rangeEnd) {
    // 使用本地時區格式化日期
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    allDates.push({
      date: dateStr,
      total_words: dailyTotals.get(dateStr) || 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // 3. 計算每日變化
  return allDates.map((stat, index) => {
    const dailyChange = index === 0
      ? stat.total_words // 第一天，就是總字數
      : stat.total_words - allDates[index - 1].total_words;

    return {
      date: stat.date,
      count: Math.max(0, dailyChange), // 只顯示正值
      level: calculateLevel(dailyChange),
    };
  });
}

function calculateLevel(dailyChange: number): 0 | 1 | 2 | 3 | 4 {
  if (dailyChange <= 0) return 0;  // 沒寫字或刪字（灰色）
  if (dailyChange < 100) return 1;  // 1-99 字（最淺綠）
  if (dailyChange < 500) return 2;  // 100-499 字
  if (dailyChange < 1000) return 3; // 500-999 字
  return 4;                         // 1000+ 字（最深綠）
}

/**
 * 將 per-document 資料轉換成累計字數圖表格式
 */
export function transformToCumulativeData(stats: DailyStats[]): CumulativeChartData {
  // 1. 聚合成 per-day 總字數
  const dailyTotals = new Map<string, number>();

  stats.forEach(stat => {
    const current = dailyTotals.get(stat.date) || 0;
    dailyTotals.set(stat.date, current + stat.word_count);
  });

  // 2. 轉換成陣列並排序
  const sortedStats = Array.from(dailyTotals.entries())
    .map(([date, total_words]) => ({ date, total_words }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 3. 計算每日變化
  return sortedStats.map((stat, index) => {
    const dailyChange = index === 0
      ? stat.total_words
      : stat.total_words - sortedStats[index - 1].total_words;

    return {
      date: stat.date,
      cumulative: stat.total_words, // 直接使用聚合後的 total_words
      daily: dailyChange,
    };
  });
}

/**
 * 格式化日期為 MM/DD 格式
 */
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
