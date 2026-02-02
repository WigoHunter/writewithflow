'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * 追蹤 Project 寫作統計
 * 自動計算 project 的總字數並記錄到 daily_writing_stats
 */
export async function trackProjectWritingStats(
  projectId: string,
  date: string
) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // Get total project word count using the database function
  const { data: totalWordCount, error: wordCountError } = await supabase.rpc(
    'get_project_word_count',
    { p_project_id: projectId }
  );

  if (wordCountError) {
    console.error('Failed to get project word count:', wordCountError);
    throw wordCountError;
  }

  // Call database function to upsert stats
  const { error } = await supabase.rpc('upsert_project_writing_stats', {
    p_user_id: user.id,
    p_project_id: projectId,
    p_date: date,
    p_word_count: totalWordCount || 0,
  });

  if (error) {
    console.error('Failed to track project writing stats:', error);
    throw error;
  }
}

/**
 * 取得今天的總字數（所有 projects）
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

  // Sum 所有 projects 的字數
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

  // 查詢 beforeDate 之前最近一天的所有 project 記錄
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

  // 加總該日期所有 projects 的字數
  const total = data
    .filter(stat => stat.date === latestDate)
    .reduce((sum, stat) => sum + stat.word_count, 0);

  return total;
}

/**
 * 取得某個 project 的統計
 */
export async function getProjectStats(
  projectId: string,
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
    .eq('project_id', projectId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * 取得日期範圍內的所有統計（所有 projects）
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

/**
 * 取得指定用戶在日期範圍內的所有統計（用於 public profile）
 */
export async function getStatsDateRangeByUserId(
  userId: string,
  startDate: string,
  endDate: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('daily_writing_stats')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) throw error;
  return data || [];
}
