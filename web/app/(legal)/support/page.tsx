import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Support | Football IQ",
  description: "Get support for the Football IQ mobile application",
};

export default function SupportPage() {
  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <h1 className="font-bebas text-4xl sm:text-5xl tracking-wide text-floodlight uppercase">
            Support
          </h1>
          <div className="w-24 h-1 bg-pitch-green mt-2" />
        </header>

        {/* Content */}
        <article className="space-y-10">
          <section>
            <h2 className="font-bebas text-2xl tracking-wide text-floodlight uppercase mb-4">
              Get in Touch
            </h2>
            <div className="text-slate-300 leading-relaxed space-y-4">
              <p>
                Have a question, found a bug, or want to share feedback?
                We&pos;d love to hear from you.
              </p>
              <p>
                <a
                  href="mailto:cw5790@gmail.com"
                  className="inline-flex items-center gap-2 text-pitch-green hover:underline transition-colors text-lg"
                >
                  <Mail className="w-5 h-5" />
                  cw5790@gmail.com
                </a>
              </p>
              <p className="text-slate-400 text-sm mt-6">
                We aim to respond to all inquiries within 48 hours.
              </p>
            </div>
          </section>
        </article>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-white/10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-pitch-green transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </footer>
      </div>
    </main>
  );
}
