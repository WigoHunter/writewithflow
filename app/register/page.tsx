import Link from "next/link";
import { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "註冊 - Storyhenge",
  description: "建立你的 Storyhenge 帳號",
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <Link
          href="/"
          className="inline-flex items-center text-primary hover:text-primary/80 mb-8 font-sans"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          返回首頁
        </Link>

        {/* Register Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-border">
          <h1 className="text-3xl font-bold text-text mb-2 text-center">
            註冊帳號
          </h1>
          <p className="text-text/60 font-sans text-center mb-8">
            開始你的寫作旅程
          </p>

          <RegisterForm />

          {/* Terms */}
          <p className="mt-6 text-center text-xs text-text/50 font-sans">
            註冊即表示你同意我們的
            <Link href="/terms" className="underline hover:text-text/70 mx-1">
              服務條款
            </Link>
            和
            <Link href="/privacy" className="underline hover:text-text/70 ml-1">
              隱私政策
            </Link>
          </p>

          {/* Login Link */}
          <p className="mt-4 text-center text-sm text-text/60 font-sans">
            已經有帳號了？
            <Link
              href="/login"
              className="text-primary hover:text-primary/80 font-medium ml-1"
            >
              立即登入
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
