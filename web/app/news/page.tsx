import type { Metadata } from "next";
import Link from "next/link";
import { HeroStrip } from "@/components/landing/HeroStrip";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "News | Football IQ",
  description:
    "Product updates and announcements from Football IQ.",
  alternates: {
    canonical: "https://www.football-iq.app/news",
  },
  openGraph: {
    title: "News | Football IQ",
    description:
      "Product updates and announcements from Football IQ.",
    url: "https://www.football-iq.app/news",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "News | Football IQ",
    description:
      "Product updates and announcements from Football IQ.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const articles = [
  {
    slug: "football-iq-now-available-worldwide",
    title: "Football IQ Is Now Available Worldwide",
    excerpt:
      "After launching in the UK and US, Football IQ is now available to download on the App Store and Google Play in every country.",
    date: "2026-03-15",
  },
];

export default function NewsIndexPage() {
  return (
    <main className="min-h-screen bg-stadium-navy text-floodlight selection:bg-pitch-green selection:text-white">
      <HeroStrip />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="font-bebas text-5xl text-floodlight tracking-wide mb-2">
            NEWS
          </h1>
          <p className="text-slate-400">
            Product updates and announcements.
          </p>
        </div>

        <div className="grid gap-6">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/news/${article.slug}`}
              className="block bg-white/5 border border-white/10 rounded-xl p-6 hover:border-pitch-green/30 transition-colors"
            >
              <p className="text-xs text-slate-500 mb-2">
                {new Date(article.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <h2 className="font-bebas text-2xl text-floodlight tracking-wide mb-2">
                {article.title}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                {article.excerpt}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  );
}
