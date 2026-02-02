import Link from "next/link";
import { logout } from "@/app/actions/auth";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/dashboard">
          <h1 className="text-2xl font-bold text-text">Storyhenge</h1>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm font-medium text-text/70 hover:text-text transition-colors font-sans"
          >
            儀表板
          </Link>
          <Link
            href="/projects"
            className="px-4 py-2 text-sm font-medium text-text/70 hover:text-text transition-colors font-sans"
          >
            我的作品
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-text/70 hover:text-text transition-colors font-sans"
            >
              登出
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
