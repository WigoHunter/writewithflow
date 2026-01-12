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
 * 取得今天相對於昨天的字數變化（today - yesterday）
 */
export async function getTodayWordChange(today: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // 計算昨天的日期
  const todayDate = new Date(today);
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  // 取得今天和昨天的總字數
  const [todayTotal, yesterdayTotal] = await Promise.all([
    getTodayTotalWords(today),
    getTodayTotalWords(yesterday),
  ]);

  return todayTotal - yesterdayTotal;
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
