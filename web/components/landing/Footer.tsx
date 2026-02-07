import Link from "next/link";
import Image from "next/image";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-16 px-4 border-t border-white/5">
      <div className="max-w-4xl mx-auto">
        {/* Final CTA */}
        <div className="text-center mb-12">
          <h2 className="font-bebas text-4xl md:text-5xl text-floodlight mb-4">
            READY TO PROVE YOUR{" "}
            <span className="text-pitch-green">FOOTBALL IQ</span>?
          </h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            Join thousands of football fans testing their knowledge daily. Free
            to download.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/images/app-store.svg"
                alt="Download on the App Store"
                width={150}
                height={50}
                className="h-[50px] w-auto"
              />
            </Link>
            <Link
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/images/play-store.svg"
                alt="Get it on Google Play"
                width={168}
                height={50}
                className="h-[50px] w-auto"
              />
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="font-bebas text-2xl tracking-wider text-floodlight/50">
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
      </div>
    </footer>
  );
}
