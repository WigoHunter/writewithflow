"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition-all duration-200 font-sans disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "登入中..." : "登入"}
    </button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useActionState(login, null);

  return (
    <form action={formAction} className="space-y-6">
      {/* Error Message */}
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-sans text-sm">
          <p className="font-medium">登入失敗</p>
          <p className="mt-1">{state.error}</p>
        </div>
      )}

      {/* Email Field */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-text mb-2 font-sans"
        >
          電子郵件
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-sans"
          placeholder="your@email.com"
        />
      </div>

      {/* Password Field */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-text mb-2 font-sans"
        >
          密碼
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-sans"
          placeholder="••••••••"
        />
      </div>

      {/* Submit Button */}
      <SubmitButton />
    </form>
  );
}
