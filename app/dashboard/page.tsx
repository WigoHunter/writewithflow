import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createDocument } from "@/app/actions/documents";
import Header from "@/components/ui/Header";
import { getTodayWordChange, getStatsDateRange } from "@/app/actions/writing-stats";
import { calculateCurrentStreak } from "@/lib/streak";

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

  // Get stats for streak calculation (last 365 days)
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);
  const startDate = oneYearAgo.toISOString().split('T')[0];

  const yearStats = await getStatsDateRange(startDate, today);
  const currentStreak = calculateCurrentStreak(yearStats);

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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Create New Document */}
          <form action={createDocument}>
            <button
              type="submit"
              className="w-full bg-primary text-white rounded-xl p-8 hover:bg-primary/90 transition-colors text-left group"
            >
              <div className="text-4xl mb-4">✍️</div>
              <h3 className="text-2xl font-bold mb-2">建立新文件</h3>
              <p className="text-white/80 font-sans">
                開始一段新的寫作旅程
              </p>
            </button>
          </form>

          {/* View All Documents */}
          <Link
            href="/documents"
            className="w-full bg-white border-2 border-border rounded-xl p-8 hover:shadow-lg transition-all text-left group"
          >
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-text mb-2">所有文件</h3>
            <p className="text-text/70 font-sans">
              瀏覽和管理你的所有作品
            </p>
          </Link>
        </div>

        {/* Recent Documents */}
        {documents && documents.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold text-text mb-6">最近編輯</h3>
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
          </div>
        )}
      </div>
    </main>
  );
}
