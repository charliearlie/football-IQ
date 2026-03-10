import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 px-4 border-t border-white/5">
      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-3 gap-8 mb-8">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
              Explore
            </p>
            <div className="space-y-2">
              {[
                { href: "/blog", label: "Daily Digest" },
                {
                  href: "/football-trivia-questions",
                  label: "Trivia Questions",
                },
                { href: "/play/career-path", label: "Career Path" },
                { href: "/play/transfer-guess", label: "Transfer Guess" },
                { href: "/play/connections", label: "Connections" },
                { href: "/play/topical-quiz", label: "Topical Quiz" },
                { href: "/play/timeline", label: "Timeline" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-slate-400 hover:text-floodlight transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
              Legal
            </p>
            <div className="space-y-2">
              <Link
                href="/privacy"
                className="block text-sm text-slate-400 hover:text-floodlight transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="block text-sm text-slate-400 hover:text-floodlight transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/support"
                className="block text-sm text-slate-400 hover:text-floodlight transition-colors"
              >
                Support
              </Link>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
              Follow
            </p>
            <div className="space-y-2">
              <a
                href="https://twitter.com/FootballIQApp"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-slate-400 hover:text-floodlight transition-colors"
              >
                Twitter / X
              </a>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <div className="font-bebas text-xl tracking-wider text-floodlight/40">
            FOOTBALL IQ
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} Football IQ
          </p>
        </div>
      </div>
    </footer>
  );
}
