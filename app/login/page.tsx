import Link from "next/link";
import { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "登入 - Storyhenge",
  description: "登入你的 Storyhenge 帳號",
};

export default function LoginPage() {
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

        {/* Login Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-border">
          <h1 className="text-3xl font-bold text-text mb-2 text-center">
            登入
          </h1>
          <p className="text-text/60 font-sans text-center mb-8">
            歡迎回到 Storyhenge
          </p>

          <LoginForm />
        </div>
      </div>
    </main>
  );
}
