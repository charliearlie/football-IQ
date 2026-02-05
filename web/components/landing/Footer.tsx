import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 px-4 border-t border-white/5">
      <div className="max-w-4xl mx-auto text-center">
        {/* Logo */}
        <div className="font-bebas text-2xl tracking-wider text-floodlight/50 mb-4">
          FOOTBALL IQ
        </div>

        {/* Fun tagline */}
        <p className="text-sm text-muted-foreground mb-6">
          Made with <span className="text-pitch-green">⚽</span> for football obsessives everywhere
        </p>

        {/* Legal links */}
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mb-6">
          <Link
            href="/privacy"
            className="hover:text-floodlight transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="hover:text-floodlight transition-colors"
          >
            Terms of Service
          </Link>
        </div>

        {/* Copyright */}
        <p className="text-xs text-muted-foreground">
          &copy; {currentYear} Football IQ. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
