"use client";

import { useState, FormEvent } from "react";

type FormState = "idle" | "loading" | "success" | "error";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!email.trim()) return;

    setState("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setState("error");
        setErrorMessage(data.error || "發生錯誤，請稍後再試");
        return;
      }

      setState("success");
      setEmail("");
    } catch {
      setState("error");
      setErrorMessage("網路錯誤，請檢查連線後再試");
    }
  }

  if (state === "success") {
    return (
      <div className="flex items-center gap-2 text-primary font-sans">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <span>已加入等候名單，我們會盡快通知你！</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="flex gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={state === "loading"}
          className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-sans disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="px-6 py-3 bg-text text-white rounded-lg font-medium hover:bg-text/90 transition-colors font-sans disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {state === "loading" ? "加入中..." : "加入等候名單"}
        </button>
      </div>
      {state === "error" && (
        <p className="mt-2 text-sm text-red-600 font-sans">{errorMessage}</p>
      )}
    </form>
  );
}
