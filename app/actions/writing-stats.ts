'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * 追蹤寫作統計
 * 記錄某個文件在某天的字數快照
 */
export async function trackWritingStats(
  documentId: string,
  date: string,
  wordCount: number
) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // Call database function
  const { error } = await supabase.rpc('upsert_daily_writing_stats', {
    p_user_id: user.id,
    p_document_id: documentId,
    p_date: date,
    p_word_count: wordCount,
  });

  if (error) {
    console.error('Failed to track writing stats:', error);
    throw error;
  }
}

/**
 * 取得今天的總字數（所有文件）
 */
export async function getTodayTotalWords(date: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('daily_writing_stats')
    .select('word_count')
    .eq('user_id', user.id)
    .eq('date', date);

  if (error) {
    throw error;
  }

  // Sum 所有文件的字數
  const totalWords = data?.reduce((sum, stat) => sum + stat.word_count, 0) || 0;
  return totalWords;
}

/**
 * 取得今天相對於前一次有記錄日期的字數變化
 * 如果今天還沒有記錄，回傳 0 而非負數
 */
export async function getTodayWordChange(today: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // 取得今天的總字數
  const todayTotal = await getTodayTotalWords(today);

  // 如果今天沒有記錄，回傳 0
  if (todayTotal === 0) {
    return 0;
  }

  // 找到今天之前最近一次有記錄的日期
  const previousTotal = await getPreviousDayTotal(today);

  return todayTotal - previousTotal;
}

/**
 * 取得指定日期之前最近一次有記錄的總字數
 * 如果沒有之前的記錄，回傳 0
 */
async function getPreviousDayTotal(beforeDate: string): Promise<number> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // 查詢 beforeDate 之前最近一天的所有文件記錄
  const { data, error } = await supabase
    .from('daily_writing_stats')
    .select('date, word_count')
    .eq('user_id', user.id)
    .lt('date', beforeDate)
    .order('date', { ascending: false });

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return 0;
  }

  // 找到最近的日期
  const latestDate = data[0].date;

  // 加總該日期所有文件的字數
  const total = data
    .filter(stat => stat.date === latestDate)
    .reduce((sum, stat) => sum + stat.word_count, 0);

  return total;
}

/**
 * 取得某個文件的統計
 */
export async function getDocumentStats(
  documentId: string,
  startDate: string,
  endDate: string
) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('daily_writing_stats')
    .select('*')
    .eq('document_id', documentId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * 取得日期範圍內的所有統計（所有文件）
 */
export async function getStatsDateRange(startDate: string, endDate: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('daily_writing_stats')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) throw error;
  return data || [];
}
