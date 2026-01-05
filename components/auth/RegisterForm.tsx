"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signup } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-cta text-white py-3 rounded-lg font-medium hover:bg-cta/90 transition-all duration-200 font-sans shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "建立中..." : "建立帳號"}
    </button>
  );
}

export default function RegisterForm() {
  const [state, formAction] = useActionState(signup, null);

  return (
    <form action={formAction} className="space-y-6">
      {/* Error Message */}
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-sans text-sm">
          <p className="font-medium">註冊失敗</p>
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
          minLength={6}
          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-sans"
          placeholder="至少 6 個字元"
        />
        <p className="mt-1 text-xs text-text/50 font-sans">
          密碼長度至少需要 6 個字元
        </p>
      </div>

      {/* Submit Button */}
      <SubmitButton />
    </form>
  );
}
