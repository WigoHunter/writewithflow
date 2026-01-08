import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createDocument } from "@/app/actions/documents";
import Header from "@/components/ui/Header";

export default async function DocumentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's documents
  const { data: documents, error } = await supabase
    .from("documents")
    .select("id, title, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching documents:", error);
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-text">我的文件</h1>
          <form action={createDocument}>
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors font-sans"
            >
              建立新文件
            </button>
          </form>
        </div>

        {/* Documents List */}
        {documents && documents.length > 0 ? (
          <div className="grid gap-4">
            {documents.map((doc) => (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="block bg-white rounded-lg border border-border p-6 hover:shadow-md transition-shadow"
              >
                <h2 className="text-xl font-bold text-text mb-2">
                  {doc.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-text/60 font-sans">
                  <span>
                    建立於{" "}
                    {new Date(doc.created_at).toLocaleDateString("zh-TW")}
                  </span>
                  <span>•</span>
                  <span>
                    最後編輯{" "}
                    {new Date(doc.updated_at).toLocaleDateString("zh-TW")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-text/70 font-sans mb-8">
              還沒有任何文件，開始創作吧！
            </p>
            <form action={createDocument}>
              <button
                type="submit"
                className="px-8 py-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors font-sans text-lg"
              >
                建立第一份文件
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
