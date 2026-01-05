import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "隱私政策 - Storyhenge",
  description: "Storyhenge 隱私政策",
};

export default function PrivacyPage() {
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
          隱私政策
        </h1>
        <p className="text-text/60 font-sans mb-12">
          最後更新日期：{new Date().toLocaleDateString("zh-TW")}
        </p>

        {/* Placeholder Content */}
        <div className="prose prose-lg max-w-none font-sans text-text/80">
          <p className="text-lg bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
            ⚠️ 這是佔位內容。正式隱私政策將在產品正式上線前補充。
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text mb-4 font-serif">
              1. 資料收集
            </h2>
            <p>
              我們收集您主動提供的資訊，包括但不限於：帳號資訊、您撰寫的文字內容、使用數據等。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text mb-4 font-serif">
              2. 資料使用
            </h2>
            <p>
              我們使用收集的資料來提供服務、改善產品體驗、進行 AI 編輯審閱等。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text mb-4 font-serif">
              3. 資料保護
            </h2>
            <p>
              我們採用業界標準的安全措施來保護您的資料。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text mb-4 font-serif">
              4. 聯絡方式
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
