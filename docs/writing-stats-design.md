# Writing Stats 技術設計文件

## 概述

Writing Stats 系統負責追蹤用戶每日的寫作活動，包括字數變化、連續寫作天數（streak），並在 Dashboard 提供視覺化的統計資料（heatmap 和累計字數圖表）。

## 設計總結

這個設計採用 **per-user-per-document-per-day** 的資料結構，每個文件每天記錄一次字數快照。

**核心優勢：**
1. ✅ 可以做 document-level 分析（進度圖表、heatmap）
2. ✅ 可以知道「今天主要在寫哪本書」
3. ✅ Dashboard 需要總字數時，簡單 sum 即可
4. ✅ 資料量完全可接受（10 個文件 × 365 天 = 3,650 筆/年）
5. ✅ 未來擴展性極強（多專案比較、焦點分析等）

**資料流：**
```
Editor auto-save
  ↓
記錄當前文件字數快照
  ↓
daily_writing_stats (per document, per day)
  ↓
Dashboard 聚合 (sum by date)
  ↓
Heatmap, Charts, Streak
```

---

## 關鍵設計決策

### 1. Per-Document 追蹤而非 Per-User 總和

記錄每個文件每天的字數快照（`per user, per document, per day`），而非全局總字數。

**優點：**
- ✅ **未來擴展性強**：可以做 document-level 的進度圖表
- ✅ **細緻追蹤**：知道每個文件每天的寫作情況
- ✅ **多專案分析**：可以看到「這週主要在寫哪本書」
- ✅ **準確可驗證**：可對照 `documents.word_count` 驗證正確性
- ✅ **易於除錯**：出問題時可以追蹤到具體文件
- ✅ **資料量可接受**：10 個文件 × 365 天 = 3,650 筆/年

**實作方式：**
- 每次 auto-save 時，只記錄**當前文件**的字數
- 每個文件每天一筆記錄
- Dashboard 需要總字數時，sum 所有文件即可

**對比表格：**

| 特性 | Per-Document 設計 ✅ | Per-User 總和設計 |
|------|---------------------|-------------------|
| 粒度 | 每個文件分開記錄 | 所有文件總和 |
| Dashboard 總字數 | `sum(word_count) where date = today` | 直接用 `total_words` |
| Document 進度圖 | ✅ 可以做 | ❌ 無法做 |
| 多專案分析 | ✅ 可以做 | ❌ 無法做 |
| 資料量 | 稍多（但可接受） | 較少 |
| 易於理解 | ✅ 非常直觀 | 也直觀 |
| 未來擴展 | ✅ 非常靈活 | 受限 |

### 2. 本地時區

使用 browser 的本地時區，不硬編碼特定時區。

### 3. 一致性原則

Heatmap 顯示綠色 ⟺ Streak 的 active day ⟺ `total_words[d] > total_words[d-1]`

### 4. Client 端日期計算

日期由 client 計算後傳給 server，確保時區一致性。

## 設計目標

1. **即時追蹤**：在 auto-save 時自動記錄總字數快照
2. **簡單準確**：記錄當天所有文件的總字數，易於理解和驗證
3. **高效查詢**：Dashboard 需要快速載入統計資料
4. **時區正確**：使用使用者本地時區（browser timezone）計算每日統計
5. **一致性**：Heatmap 顯示綠色的日子 = Streak 計算的 active day
6. **隱私第一**：所有資料都有 RLS 保護

---

## 資料庫設計

### 1. `daily_writing_stats` Table

```sql
create table daily_writing_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  document_id uuid references documents(id) on delete cascade not null,
  date date not null,
  word_count int not null default 0,  -- 這個文件在當天結束時的字數
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(user_id, document_id, date)
);

-- Indexes for performance
create index daily_writing_stats_user_id_idx on daily_writing_stats(user_id);
create index daily_writing_stats_document_id_idx on daily_writing_stats(document_id);
create index daily_writing_stats_date_idx on daily_writing_stats(date desc);
create index daily_writing_stats_user_date_idx on daily_writing_stats(user_id, date desc);
create index daily_writing_stats_doc_date_idx on daily_writing_stats(document_id, date desc);

-- RLS policies
alter table daily_writing_stats enable row level security;

create policy "Users can CRUD own daily_writing_stats" on daily_writing_stats
  for all using (
    document_id in (select id from documents where user_id = auth.uid())
  );

-- Trigger to update updated_at
create trigger update_daily_writing_stats_updated_at
  before update on daily_writing_stats
  for each row
  execute function update_updated_at_column();
```

**欄位說明：**
- `document_id`: 文件 ID（每個文件分開記錄）
- `word_count`: 這個文件在當天結束時的字數快照
- `date`: 使用 client 端的本地日期（browser timezone）
- `unique(user_id, document_id, date)`: 每個用戶的每個文件每天只有一筆記錄

**設計理念：**
- 記錄**每個文件**的字數快照
- 每次 auto-save 時，更新**當前文件**在當天的字數
- Dashboard 需要總字數時，sum 所有文件
- 優點：
  - 可以做 per-document 分析
  - 可以看到每個文件的進度圖表
  - 可以知道「今天主要在寫哪本書」
  - 仍然可以計算全局的 heatmap 和 streak

### 2. `documents` Table 擴充

需要在 `documents` table 加入 `word_count` 欄位來快速追蹤文件字數：

```sql
-- Migration: Add word_count to documents
alter table documents
  add column word_count int not null default 0;

-- Index for aggregation queries
create index documents_user_id_word_count_idx on documents(user_id, word_count);
```

### 3. Database Function: `upsert_daily_writing_stats`

```sql
create or replace function upsert_daily_writing_stats(
  p_user_id uuid,
  p_document_id uuid,
  p_date date,
  p_word_count int
)
returns void as $$
begin
  insert into daily_writing_stats (
    user_id,
    document_id,
    date,
    word_count
  ) values (
    p_user_id,
    p_document_id,
    p_date,
    p_word_count
  )
  on conflict (user_id, document_id, date)
  do update set
    word_count = p_word_count,  -- 直接覆蓋，因為是快照
    updated_at = now();
end;
$$ language plpgsql security definer;
```

**說明：**
- `p_document_id`: 當前文件的 ID
- `p_word_count`: 當前文件的字數（快照）
- 使用 `on conflict (user_id, document_id, date)` 確保每個文件每天只有一筆記錄
- **覆蓋式更新**：同一天多次保存同一文件，直接覆蓋字數

---

## 字數追蹤機制

### 追蹤流程

```
Editor onChange
  → debounce (2s)
  → auto-save document
  → trackWritingStats(documentId, wordCount)
  → upsert_daily_writing_stats()
```

**關鍵點：**
- 每次 auto-save 時，只記錄**當前文件**的字數
- 將當前文件的字數快照存入當天的統計
- 每個文件分開記錄，Dashboard 需要時再 sum
- 簡單、清晰、高效

### 實作架構

#### 1. `lib/word-count.ts` - 字數計算 Utilities

```typescript
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
  // 格式化為 YYYY-MM-DD
  return today.toISOString().split('T')[0];
}
```

**說明：**
- `getTodayDate()` 使用 browser 的本地時區，返回 'YYYY-MM-DD' 格式

#### 2. `app/actions/writing-stats.ts` - Server Actions

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';

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

// 取得今天的總字數（所有文件）
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

// 取得某個文件的統計
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
```

#### 3. Editor 整合

修改 `components/editor/Editor.tsx` 的 `saveDocument` 函數：

```typescript
const saveDocument = async (content: any) => {
  setIsSaving(true);
  try {
    const contentStr = JSON.stringify(content);
    const contentObj = JSON.parse(contentStr);

    // Calculate new word count
    const text = editor.getText();
    const newWordCount = countWords(text);

    // Update document with new word count
    await updateDocument(documentId, {
      content: contentObj,
      word_count: newWordCount
    });

    // Track writing stats (記錄當前文件的字數)
    const today = new Date().toISOString().split('T')[0];
    await trackWritingStats(documentId, today, newWordCount);

    setLastSaved(new Date());
  } catch (error) {
    console.error("Failed to save:", error);
  } finally {
    setIsSaving(false);
  }
};
```

**關鍵點：**
- 只記錄**當前文件**的字數
- 傳入 `documentId` 和 `wordCount`
- 每個文件分開追蹤，Dashboard 需要時再聚合
- 非常簡單、高效

---

## Streak 計算

### 定義

- **Active Day**: 當天所有文件的總字數 > 前一天所有文件的總字數（總字數有增加）視為有效寫作日
- **Current Streak**: 從今天往回計算的連續寫作天數
- **一致性原則**: Heatmap 顯示綠色（level > 0）= Streak 計算的 active day

**計算方式：**
```typescript
// 某一天的總字數
total_words[d] = sum(word_count where date = d)

// Active day 判定
isActiveDay = total_words[d] > total_words[d-1]
```

### 實作

#### Client-Side Streak 計算（推薦）

先將 per-document 資料聚合成 per-day 總字數，再計算 streak：

```typescript
// lib/streak.ts

type DailyStats = {
  date: string;
  document_id: string;
  word_count: number;
};

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
```

**優點：**
- 不需要複雜的 SQL 查詢
- 容易理解和測試
- 可以在 Dashboard 直接使用已載入的資料
- 先聚合再計算，邏輯清晰

#### 或者使用 Database Function（替代方案）

```sql
create or replace function calculate_current_streak(
  p_user_id uuid,
  p_current_date date
)
returns int as $$
declare
  current_streak int := 0;
  check_date date := p_current_date;
  today_words int;
  yesterday_words int;
begin
  loop
    -- 取得今天的字數
    select total_words into today_words
    from daily_writing_stats
    where user_id = p_user_id and date = check_date;

    if not found then
      exit; -- 今天沒資料，中斷
    end if;

    -- 取得昨天的字數
    select total_words into yesterday_words
    from daily_writing_stats
    where user_id = p_user_id and date = check_date - interval '1 day';

    if not found then
      yesterday_words := 0; -- 昨天沒資料，視為 0
    end if;

    -- 檢查是否有增長
    if today_words > yesterday_words then
      current_streak := current_streak + 1;
      check_date := check_date - interval '1 day';
    else
      exit; -- 沒有增長，中斷
    end if;
  end loop;

  return current_streak;
end;
$$ language plpgsql;
```

**重要設計決策：**
- Active day = `total_words[d] > total_words[d-1]`
- 保持與 Heatmap 的一致性：綠色 = active day
- 刪除字數的日子（總字數下降）不算 streak

#### Server Action

```typescript
export async function getCurrentStreak() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase.rpc('calculate_current_streak', {
    p_user_id: user.id,
  });

  if (error) throw error;

  return data as number;
}
```

---

## Dashboard 資料查詢策略

### 需要的資料

1. **Today's Summary**
   - 今日字數（words_added, words_deleted, net_words）
   - Current streak

2. **Recent Documents**
   - 最近編輯的 5 個文件

3. **Writing Heatmap**
   - 過去 365 天的每日統計（for react-activity-calendar）

4. **Cumulative Word Count Chart**
   - 過去 30 天的累計字數變化（for Recharts）

### 查詢優化

#### 1. Dashboard 資料一次載入

```typescript
// app/actions/dashboard.ts

export async function getDashboardData() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // Parallel queries for performance
  const [todayStats, recentDocs, yearStats, streak] = await Promise.all([
    getTodayStats(),
    getRecentDocuments(5),
    getStatsDateRange(
      getDateNDaysAgo(365),
      getTodayDate()
    ),
    getCurrentStreak(),
  ]);

  return {
    today: todayStats,
    recentDocuments: recentDocs,
    yearlyStats: yearStats,
    currentStreak: streak,
  };
}

function getDateNDaysAgo(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().split('T')[0];
}

async function getRecentDocuments(limit: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('documents')
    .select('id, title, updated_at, word_count')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}
```

#### 2. Heatmap 資料格式

react-activity-calendar 需要的資料格式：

```typescript
type HeatmapData = Array<{
  date: string;      // 'YYYY-MM-DD'
  count: number;     // 活動量（每日字數變化）
  level: 0 | 1 | 2 | 3 | 4;  // 顏色深淺
}>;

type DailyStats = {
  date: string;
  document_id: string;
  word_count: number;
};

function transformToHeatmapData(stats: DailyStats[]): HeatmapData {
  // 1. 先聚合成 per-day 總字數
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
      ? stat.total_words // 第一天，就是總字數
      : stat.total_words - sortedStats[index - 1].total_words;

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
```

**一致性保證：**
- `level > 0` (綠色) ⟺ `dailyChange > 0` ⟺ `total_words[d] > total_words[d-1]` ⟺ active day for streak
- Heatmap 和 Streak 永遠保持一致

**Per-Document Heatmap（新功能！）：**

```typescript
function transformToDocumentHeatmap(
  stats: DailyStats[],
  documentId: string
): HeatmapData {
  // 只取該文件的資料
  const docStats = stats
    .filter(s => s.document_id === documentId)
    .sort((a, b) => a.date.localeCompare(b.date));

  return docStats.map((stat, index) => {
    const dailyChange = index === 0
      ? stat.word_count
      : stat.word_count - docStats[index - 1].word_count;

    return {
      date: stat.date,
      count: Math.max(0, dailyChange),
      level: calculateLevel(dailyChange),
    };
  });
}
```

#### 3. 累計字數圖表資料

Recharts 需要的資料格式：

```typescript
type CumulativeChartData = Array<{
  date: string;
  cumulative: number;  // 累計總字數
  daily: number;       // 當日變化
}>;

function transformToCumulativeData(stats: DailyStats[]): CumulativeChartData {
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
```

**優點：**
- 先聚合再計算，邏輯清晰
- 累計字數直接用聚合後的 `total_words`
- 每日變化用 `d - (d-1)` 計算
- 簡單、準確、不會累積誤差

**Per-Document 圖表（新功能！）：**

```typescript
function transformToDocumentCumulativeData(
  stats: DailyStats[],
  documentId: string
): CumulativeChartData {
  // 只取該文件的資料
  const docStats = stats
    .filter(s => s.document_id === documentId)
    .sort((a, b) => a.date.localeCompare(b.date));

  return docStats.map((stat, index) => {
    const dailyChange = index === 0
      ? stat.word_count
      : stat.word_count - docStats[index - 1].word_count;

    return {
      date: stat.date,
      cumulative: stat.word_count, // 該文件的累計字數
      daily: dailyChange,
    };
  });
}
```

---

## 效能考量

### 1. 快取策略

- Dashboard 資料可以使用 Next.js 的 cache
- 使用 `revalidate` 控制快取時間（例如 60 秒）

```typescript
export async function getDashboardData() {
  // ...
}

// 可選：加上 cache 和 revalidate
export const revalidate = 60; // 60 秒快取
```

### 2. 索引優化

已在資料表設計中加入的索引：
- `daily_writing_stats_user_date_idx`: 用於快速查詢用戶的日期範圍統計
- `documents_user_id_word_count_idx`: 用於快速聚合用戶的總字數

### 3. 批次查詢

Dashboard 使用 `Promise.all()` 平行查詢多個資料源，減少等待時間。

---

## 時區處理

使用 **Browser 本地時區**，不硬編碼特定時區：

```typescript
// Client 端（Browser）
export function getTodayDate(): string {
  const today = new Date();
  // 使用 browser 的本地時區
  return today.toISOString().split('T')[0];
}
```

**設計理念：**
- 日期由 **client 端** 計算並傳給 server
- 使用者在 PST 就用 PST，在 JST 就用 JST
- 資料庫中的 `date` 欄位使用 `date` 型別（不含時區資訊）
- Server 端的 `calculate_current_streak` function 使用 `current_date` 會採用 database server 時區，需注意一致性

**Streak 計算的時區考量：**

為了確保 streak 計算的正確性，streak 計算應該也由 client 提供當前日期：

```typescript
export async function getCurrentStreak(currentDate: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // 從 client date 往回計算
  let streak = 0;
  let checkDate = new Date(currentDate);

  // 用 client-side 邏輯計算，或者傳入 current_date 給 database function
  // ...
}
```

**或者**，簡化設計：streak 計算在 client 端完成，從 server 取得所有歷史資料後在 browser 計算。

---

## 測試計畫

### 單元測試

1. **字數計算**
   - 測試中文字數計算
   - 測試英文單詞計算
   - 測試混合內容
   - 測試特殊字符處理

2. **日期處理**
   - 測試本地時區日期格式
   - 測試跨日邊界情況

### 整合測試

1. **追蹤流程**
   - 測試 auto-save 觸發統計追蹤
   - 測試同一天多次保存，total_words 正確更新
   - 測試跨日寫作
   - 測試刪除字數的處理（total_words 下降）
   - 測試多文件總字數計算的準確性

2. **Streak 計算**
   - 測試連續寫作天數（total_words[d] > total_words[d-1]）
   - 測試中斷後重新開始
   - 測試邊界情況（今天還沒寫）
   - 測試刪字的日子不計入 streak（total_words 下降）

3. **Dashboard 查詢**
   - 測試無資料情況
   - 測試大量資料效能
   - 測試日期範圍查詢

4. **一致性測試**
   - 驗證 Heatmap 綠色 ⟺ Streak active day ⟺ total_words 增加
   - 驗證 total_words 與實際 sum(documents.word_count) 一致
   - 驗證不同時區的正確性

5. **資料轉換測試**
   - 測試 Heatmap 資料計算（d - (d-1)）
   - 測試累計圖表資料轉換
   - 測試第一天的特殊處理

---

## Migration 順序

1. `20250111000000_create_daily_writing_stats.sql`
   - 建立 `daily_writing_stats` table
   - 建立索引和 RLS policies
   - 建立 `upsert_daily_writing_stats` function

2. `20250111000001_add_word_count_to_documents.sql`
   - 在 `documents` table 加入 `word_count` 欄位
   - 建立相關索引

3. `20250111000002_create_streak_function.sql`
   - 建立 `calculate_current_streak` function

---

## Per-Document 功能（未來擴展）

Per-document 資料結構已經準備好，未來可以實作以下功能：

### 1. Document 進度頁面

在文件詳情頁顯示該文件的統計：

```typescript
// app/documents/[id]/stats
- 該文件的累計字數圖表
- 該文件的 heatmap
- 最近 30 天的寫作活動
- 平均每天寫作字數
- 最高產的一天
```

### 2. Dashboard 多專案分析

```typescript
// components/dashboard/ActiveProjects.tsx
- 顯示這週最活躍的 5 個文件
- 每個文件的進度條（當前字數 / 目標字數）
- 每個文件的最近更新時間
```

### 3. 比較圖表

```typescript
// 可以選擇多個文件，在同一個圖表上比較進度
- 折線圖：多個文件的累計字數變化
- 堆疊圖：每天在不同文件上的字數分布
```

### 4. 寫作焦點分析

```typescript
// 分析寫作習慣
- 這個月主要在寫哪本書？
- 哪些專案被擱置了？（超過 7 天沒更新）
- 建議：「你已經 5 天沒碰 XXX 小說了」
```

---

## 未來優化方向

1. **即時統計更新**
   - 使用 Supabase Realtime 在多個裝置同步統計資料

2. **目標設定**
   - 允許用戶設定每日字數目標
   - 允許用戶設定每個文件的目標字數
   - 顯示目標達成進度

3. **寫作分析**
   - 分析寫作速度（字/分鐘）
   - 分析寫作習慣（最常寫作的時間）
   - 追蹤寫作時段分布（早上/下午/晚上）

---

## 參考資料

- [react-activity-calendar](https://github.com/grubersjoe/react-activity-calendar)
- [Recharts](https://recharts.org/)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
