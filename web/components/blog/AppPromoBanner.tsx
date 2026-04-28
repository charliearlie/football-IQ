import Link from "next/link";
import Image from "next/image";
import { appStoreUrl } from "@/lib/constants";
import { AndroidNotifyButton } from "@/components/AndroidNotifyButton";

export function AppPromoBanner() {
  return (
    <aside
      className="my-10 bg-white/5 backdrop-blur-[10px] border border-white/10 border-l-4 border-l-pitch-green rounded-xl p-6"
      aria-label="Download the Football IQ app"
    >
      <p className="text-xs text-pitch-green uppercase tracking-wider font-semibold mb-2">
        Test your knowledge
      </p>

      <h2 className="font-bebas text-3xl text-floodlight tracking-wide mb-1">
        THINK YOU KNOW FOOTBALL?
      </h2>

      <p className="text-sm text-slate-400 leading-relaxed mb-6">
        Put it to the test with 11 daily game modes on the Football IQ app.
        Career Path, The Grid, Transfer Guess, Connections and more — new
        puzzles every day, completely free.
      </p>

      <div className="flex flex-wrap gap-3">
        <Link
          href={appStoreUrl('web_blog')}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-all hover:opacity-90 hover:scale-105"
        >
          <Image
            src="/images/app-store.svg"
            alt="Download Football IQ on the App Store"
            width={140}
            height={42}
            className="h-[42px] w-auto"
          />
        </Link>

        <AndroidNotifyButton source="android-notify-blog" size="md" />
      </div>
    </aside>
  );
}
