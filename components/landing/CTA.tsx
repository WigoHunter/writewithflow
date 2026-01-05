import Link from "next/link";
import Button from "@/components/ui/Button";

export default function CTA() {
  return (
    <section className="py-24 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-text mb-6">
          準備好開始創作了嗎？
        </h2>
        <p className="text-xl text-text/70 mb-10 font-sans">
          加入 Storyhenge，讓 AI 成為你的編輯夥伴
        </p>
        <Link href="/register">
          <Button variant="cta" size="lg">
            免費開始使用
          </Button>
        </Link>
        <p className="mt-6 text-sm text-text/50 font-sans">
          註冊即表示你同意我們的
          <Link href="/terms" className="underline hover:text-text/70 ml-1">
            服務條款
          </Link>
          和
          <Link href="/privacy" className="underline hover:text-text/70 ml-1">
            隱私政策
          </Link>
        </p>
      </div>
    </section>
  );
}
