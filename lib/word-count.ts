/**
 * 計算文字的字數（支援中文、英文、數字）
 */
export function countWords(text: string): number {
  if (!text || text.trim().length === 0) return 0;

  // Count all CJK characters (Chinese, Japanese, Korean)
  const cjkChars = text.match(
    /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff\uff00-\uffef]/g
  ) || [];
  const cjkCount = cjkChars.length;

  // Count English words
  const englishWords = text.match(/\b[a-zA-Z]+\b/g) || [];
  const englishCount = englishWords.length;

  // Count numbers
  const numbers = text.match(/\b\d+\b/g) || [];
  const numberCount = numbers.length;

  return cjkCount + englishCount + numberCount;
}

/**
 * 取得今天的日期（使用 browser 的本地時區）
 */
export function getTodayDate(): string {
  const today = new Date();

  // 使用本地時區，不是 UTC
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
