import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Simple Header with Logout */}
      <header className="border-b border-border bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-text">Storyhenge</h1>
          <form action={logout}>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-text/70 hover:text-text transition-colors font-sans"
            >
              登出
            </button>
          </form>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-text mb-4">
            歡迎來到 Storyhenge
          </h2>
          <p className="text-xl text-text/70 font-sans mb-8">
            登入成功！你的電子郵件：{user.email}
          </p>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-border max-w-2xl mx-auto">
            <div className="text-left space-y-4">
              <h3 className="text-2xl font-bold text-text mb-4">
                🎉 Week 1 完成！
              </h3>
              <div className="space-y-2 font-sans text-text/80">
                <p className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Landing page 設計完成（極簡風格）
                </p>
                <p className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Next.js 14 專案初始化
                </p>
                <p className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  TypeScript + Tailwind CSS 設定完成
                </p>
                <p className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Supabase 專案建立與整合
                </p>
                <p className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Auth 系統（登入、註冊、登出）
                </p>
                <p className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  隱私政策與服務條款頁面
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <h4 className="font-bold text-text mb-2">下一步：Week 2</h4>
                <p className="text-sm text-text/70 font-sans">
                  建立寫作編輯器、文件管理、章節組織等功能
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
