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

  // Get stats for past 6 months for heatmap and charts (using local timezone)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);
  const startDate = (() => {
    const year = sixMonthsAgo.getFullYear();
    const month = String(sixMonthsAgo.getMonth() + 1).padStart(2, '0');
    const day = String(sixMonthsAgo.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  const stats = await getStatsDateRange(startDate, today);

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
  const currentStreak = calculateCurrentStreak(streakStats);

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Dashboard Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-text mb-2">
            歡迎回來，{user.email?.split("@")[0]}
          </h2>
          <p className="text-xl text-text/70 font-sans">
            繼續你的創作之旅
          </p>
        </div>

        {/* Writing Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Today's Words */}
          <div className="bg-white rounded-xl border-2 border-border p-8">
            <div className="text-sm font-sans text-text/60 mb-2">今日字數</div>
            <div className="text-5xl font-bold text-primary mb-2">
              {todayWordChange >= 0 ? '+' : ''}{todayWordChange.toLocaleString()}
            </div>
            <p className="text-text/70 font-sans">字</p>
          </div>

          {/* Current Streak */}
          <div className="bg-white rounded-xl border-2 border-border p-8">
            <div className="text-sm font-sans text-text/60 mb-2">連續寫作</div>
            <div className="text-5xl font-bold text-primary mb-2">
              {currentStreak}
            </div>
            <p className="text-text/70 font-sans">天</p>
          </div>
        </div>

        {/* Writing Heatmap */}
        <div className="mb-12">
          <WritingHeatmap data={heatmapData} />
        </div>

        {/* Cumulative Chart */}
        <div className="mb-12">
          <CumulativeChart data={chartData} />
        </div>

        {/* Recent Documents */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-text">最近編輯</h3>
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
            <div className="grid gap-4">
              {documents.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/documents/${doc.id}`}
                  className="bg-white rounded-lg border border-border p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xl font-bold text-text">
                      {doc.title}
                    </h4>
                    <span className="text-sm text-text/60 font-sans">
                      {doc.word_count?.toLocaleString() || 0} 字
                    </span>
                  </div>
                  <p className="text-sm text-text/60 font-sans">
                    最後編輯{" "}
                    {new Date(doc.updated_at).toLocaleDateString("zh-TW", {
                      year: "numeric",
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
      </div>
    </main>
  );
}
