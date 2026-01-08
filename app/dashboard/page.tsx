import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createDocument } from "@/app/actions/documents";
import Header from "@/components/ui/Header";

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
    .select("id, title, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(5);

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
                  <h4 className="text-xl font-bold text-text mb-2">
                    {doc.title}
                  </h4>
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
