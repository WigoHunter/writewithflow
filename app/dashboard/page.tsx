import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createDocument } from "@/app/actions/documents";
import Header from "@/components/ui/Header";
import { getTodayWordChange, getStatsDateRange } from "@/app/actions/writing-stats";
import { calculateCurrentStreak } from "@/lib/streak";
import { transformToHeatmapData, transformToCumulativeData } from "@/lib/stats-transform";
import WritingHeatmap from "@/components/dashboard/WritingHeatmap";
import CumulativeChart from "@/components/dashboard/CumulativeChart";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch recent documents
  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, updated_at, word_count")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(5);

  // Get today's date (using server's timezone, but this runs on client's browser in practice)
  const today = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  // Get today's word change (today - yesterday)
  const todayWordChange = await getTodayWordChange(today);

  // Get stats for heatmap and charts (current year + last 6 months of previous year)
  const currentYear = new Date().getFullYear();
  const heatmapStartDate = `${currentYear - 1}-07-01`; // Include last 6 months of previous year
  const endOfYear = `${currentYear}-12-31`;

  const stats = await getStatsDateRange(heatmapStartDate, endOfYear);

  // Transform data for charts (heatmap will auto-fill missing dates)
  const heatmapData = transformToHeatmapData(stats);
  const chartData = transformToCumulativeData(stats);

  // Calculate streak (needs more historical data, using local timezone)
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);
  const streakStartDate = (() => {
    const year = oneYearAgo.getFullYear();
    const month = String(oneYearAgo.getMonth() + 1).padStart(2, '0');
    const day = String(oneYearAgo.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();
  const streakStats = await getStatsDateRange(streakStartDate, today);
  const currentStreak = calculateCurrentStreak(streakStats, today);

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-text mb-1">
            歡迎回來，{user.email?.split("@")[0]}
          </h2>
          <p className="text-base text-text/60 font-sans">
            繼續你的創作之旅
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Recent Documents (Main Area - 2/3 width) */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-text">最近編輯</h3>
              <form action={createDocument}>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="font-sans">新文件</span>
                </button>
              </form>
            </div>

            {documents && documents.length > 0 ? (
              <div className="grid gap-3">
                {documents.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/documents/${doc.id}`}
                    className="bg-white rounded-lg border border-border p-5 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-lg font-semibold text-text">
                        {doc.title}
                      </h4>
                      <span className="text-sm text-text/50 font-sans tabular-nums">
                        {doc.word_count?.toLocaleString() || 0} 字
                      </span>
                    </div>
                    <p className="text-sm text-text/50 font-sans">
                      最後編輯 {new Date(doc.updated_at).toLocaleDateString("zh-TW", {
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg border-2 border-dashed border-border p-12 text-center">
                <p className="text-text/60 font-sans mb-4">還沒有文件</p>
                <form action={createDocument}>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-sans"
                  >
                    建立第一個文件
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right: Stats Sidebar (1/3 width) */}
          <div className="space-y-4">

            {/* Today's Stats */}
            <div className="bg-white rounded-lg border border-border p-4">
              <h4 className="text-base font-semibold text-text mb-4">今日寫作</h4>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-text/50 font-sans mb-1">字數</div>
                  <div className="text-3xl font-bold text-primary tabular-nums">
                    {todayWordChange >= 0 ? '+' : ''}{todayWordChange.toLocaleString()}
                  </div>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="text-xs text-text/50 font-sans mb-1">連續寫作</div>
                  <div className="text-2xl font-bold text-text tabular-nums">
                    {currentStreak} <span className="text-sm text-text/50 font-normal">天</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Heatmap */}
            <WritingHeatmap data={heatmapData} />

            {/* Chart */}
            <CumulativeChart data={chartData} />
          </div>
        </div>
      </div>
    </main>
  );
}
