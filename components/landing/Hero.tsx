import Link from "next/link";
import WaitlistForm from "./WaitlistForm";

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-3xl mx-auto text-center">
        {/* Closed Beta Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-sans mb-8">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          封閉測試中
        </div>

        {/* Hero Heading */}
        <h1 className="text-5xl md:text-7xl font-bold text-text mb-6 leading-tight">
          作家需要一個家
        </h1>

        {/* Subheading */}
        <p className="text-xl md:text-2xl text-text/70 mb-12 font-sans leading-relaxed">
          追蹤你的寫作歷程，建立你的作品集。
        </p>

        {/* Waitlist Form */}
        <div className="flex justify-center mb-8">
          <WaitlistForm />
        </div>

        {/* Demo Link */}
        <Link
          href="/u/wigo"
          className="inline-flex items-center gap-2 text-text/60 hover:text-primary transition-colors font-sans group"
        >
          看看 wigo 的作家主頁
          <svg
            className="w-4 h-4 group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </Link>
      </div>
    </section>
  );
}
