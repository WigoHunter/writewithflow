import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createProject, getUserProjects } from "@/app/actions/projects";
import Header from "@/components/ui/Header";
import { getStatsDateRange } from "@/app/actions/writing-stats";
import { transformToHeatmapData, transformToCumulativeData } from "@/lib/stats-transform";
import WritingHeatmap from "@/components/dashboard/WritingHeatmap";
import CumulativeChart from "@/components/dashboard/CumulativeChart";
import TodayStats from "@/components/dashboard/TodayStats";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch recent projects
  const allProjects = await getUserProjects();
  const recentProjects = allProjects.slice(0, 5);

  // Get stats for heatmap and charts (current year + last 6 months of previous year)
  const currentYear = new Date().getFullYear();
  const heatmapStartDate = `${currentYear - 1}-07-01`; // Include last 6 months of previous year
  const endOfYear = `${currentYear}-12-31`;

  const stats = await getStatsDateRange(heatmapStartDate, endOfYear);

  // Transform data for charts (heatmap will auto-fill missing dates)
  const heatmapData = transformToHeatmapData(stats);
  const chartData = transformToCumulativeData(stats);

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

          {/* Left: Recent Projects (Main Area - 2/3 width) */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-text">最近編輯</h3>
              <form action={createProject}>
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
                  <span className="font-sans">新作品</span>
                </button>
              </form>
            </div>

            {recentProjects.length > 0 ? (
              <div className="grid gap-3">
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="bg-white rounded-lg border border-border p-5 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h4 className="text-lg font-semibold text-text">
                          {project.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-text/50 font-sans">
                            {project.chapter_count || 0} 章
                          </span>
                          {project.is_public && (
                            <span className="text-xs text-green-600 font-sans">
                              公開
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-text/50 font-sans tabular-nums">
                        {(project.word_count || 0).toLocaleString()} 字
                      </span>
                    </div>
                    <p className="text-sm text-text/50 font-sans">
                      最後編輯 {new Date(project.updated_at).toLocaleDateString("zh-TW", {
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg border-2 border-dashed border-border p-12 text-center">
                <p className="text-text/60 font-sans mb-4">還沒有作品</p>
                <form action={createProject}>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-sans"
                  >
                    建立第一部作品
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right: Stats Sidebar (1/3 width) */}
          <div className="space-y-4">

            {/* Today's Stats - Client Component for correct timezone */}
            <TodayStats />

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
