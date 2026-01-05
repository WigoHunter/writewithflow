import Link from "next/link";
import Button from "@/components/ui/Button";

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-6xl mx-auto text-center">
        {/* Hero Heading */}
        <h1 className="text-5xl md:text-7xl font-bold text-text mb-6 leading-tight">
          讓 AI 成為你的
          <br />
          <span className="text-primary">編輯夥伴</span>
        </h1>

        {/* Subheading */}
        <p className="text-xl md:text-2xl text-text/70 mb-12 max-w-3xl mx-auto font-sans leading-relaxed">
          專注於創作心流，讓 AI 處理編輯工作。<br />
          每個建議都需要你的明確同意，你始終掌握主導權。
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/register">
            <Button variant="cta" size="lg">
              開始免費使用
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="lg">
              登入
            </Button>
          </Link>
        </div>

        {/* Trust Signal */}
        <p className="mt-8 text-sm text-text/50 font-sans">
          無需信用卡 • 隨時可以取消
        </p>
      </div>
    </section>
  );
}
