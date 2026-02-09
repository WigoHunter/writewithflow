import Link from "next/link";

export default function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-border bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Brand */}
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold text-text">Storyhenge</h3>
            <p className="text-sm text-text/60 font-sans mt-1">
              GitHub for Writers
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-6 text-sm font-sans">
            <Link
              href="/privacy"
              className="text-text/60 hover:text-text transition-colors"
            >
              隱私政策
            </Link>
            <Link
              href="/terms"
              className="text-text/60 hover:text-text transition-colors"
            >
              服務條款
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-sm text-text/50 font-sans">
            © {new Date().getFullYear()} Storyhenge. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
