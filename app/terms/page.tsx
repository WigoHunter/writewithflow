import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "服務條款 - Storyhenge",
  description: "Storyhenge 服務條款",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center text-primary hover:text-primary/80 mb-8 font-sans"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回首頁
        </Link>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
          服務條款
        </h1>
        <p className="text-text/60 font-sans mb-12">
          最後更新日期：{new Date().toLocaleDateString("zh-TW")}
        </p>

        {/* Placeholder Content */}
        <div className="prose prose-lg max-w-none font-sans text-text/80">
          <p className="text-lg bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
            ⚠️ 這是佔位內容。正式服務條款將在產品正式上線前補充。
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text mb-4 font-serif">
              1. 接受條款
            </h2>
            <p>
              使用 Storyhenge 服務即表示您同意遵守本服務條款。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text mb-4 font-serif">
              2. 服務說明
            </h2>
            <p>
              Storyhenge 提供 AI 驅動的寫作編輯服務，包括文字審閱、建議提供等功能。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text mb-4 font-serif">
              3. 使用者責任
            </h2>
            <p>
              您對自己的內容負責，且保證不會使用本服務進行違法活動。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text mb-4 font-serif">
              4. 智慧財產權
            </h2>
            <p>
              您保留對自己創作內容的所有權利。我們不會聲稱對您的作品擁有版權。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text mb-4 font-serif">
              5. 服務變更與終止
            </h2>
            <p>
              我們保留隨時修改或終止服務的權利。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text mb-4 font-serif">
              6. 聯絡方式
            </h2>
            <p>
              如有任何問題，請聯絡我們：[聯絡信箱待補]
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
