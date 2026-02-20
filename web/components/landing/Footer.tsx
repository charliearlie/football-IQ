import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 px-4 border-t border-white/5">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-bebas text-xl tracking-wider text-floodlight/40">
            FOOTBALL IQ
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link
              href="/privacy"
              className="hover:text-floodlight transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-floodlight transition-colors"
            >
              Terms
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} Football IQ
          </p>
        </div>
      </div>
    </footer>
  );
}
