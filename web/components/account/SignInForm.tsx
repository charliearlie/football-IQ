"use client";

import { useState } from "react";
import { sendMagicLink } from "@/lib/auth/magic-link";

export interface SignInFormProps {
  redirectPath: string;
  source: string;
}

export function SignInForm({ redirectPath, source }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setError(null);

    const result = await sendMagicLink(email, source, redirectPath);

    if (result.ok) {
      setStatus("sent");
    } else {
      setStatus("idle");
      setError(result.error ?? "Something went wrong. Try again.");
    }
  }

  if (status === "sent") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-xl border border-pitch-green/30 bg-pitch-green/10 p-6 text-center space-y-2"
      >
        <p className="font-bebas text-2xl tracking-wider text-pitch-green">
          Check your email
        </p>
        <p className="text-sm text-slate-300 leading-relaxed">
          We&apos;ve sent a sign-in link to{" "}
          <span className="font-semibold text-floodlight">{email}</span>. Click
          it to finish signing in.
        </p>
        <button
          type="button"
          onClick={() => {
            setEmail("");
            setStatus("idle");
          }}
          className="text-xs text-slate-400 underline hover:text-slate-200 mt-2"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-slate-300"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-floodlight placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-pitch-green/50 focus:border-pitch-green/40"
        />
      </div>

      {error ? (
        <div
          role="alert"
          className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2"
        >
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={status === "loading" || email.length === 0}
        className="w-full rounded-lg bg-pitch-green text-stadium-navy font-semibold py-3 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {status === "loading" ? "Sending…" : "Send magic link"}
      </button>
    </form>
  );
}
