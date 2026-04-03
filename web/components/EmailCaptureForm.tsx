"use client";

import { useState } from "react";

interface EmailCaptureFormProps {
  source: string;
  title?: string;
  description?: string;
}

export function EmailCaptureForm({
  source,
  title = "Get weekly football trivia in your inbox",
  description,
}: EmailCaptureFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading" || status === "success") return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/email/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMessage(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
      } else {
        setStatus("success");
        setEmail("");
      }
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
      <p className="font-bebas text-xl tracking-wider text-floodlight mb-1">{title}</p>
      {description && (
        <p className="text-slate-400 text-sm mb-4">{description}</p>
      )}
      {!description && (
        <p className="text-slate-400 text-sm mb-4">
          No spam. Unsubscribe any time.
        </p>
      )}

      {status === "success" ? (
        <p className="text-pitch-green text-sm font-semibold">
          You&apos;re in! Check your inbox for a welcome email.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            disabled={status === "loading"}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-floodlight placeholder:text-slate-600 focus:outline-none focus:border-pitch-green/50 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="bg-pitch-green text-stadium-navy font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-pitch-green/90 transition-colors disabled:opacity-50 shrink-0"
          >
            {status === "loading" ? "Subscribing..." : "Subscribe"}
          </button>
        </form>
      )}

      {status === "error" && (
        <p className="text-red-400 text-xs mt-2">{errorMessage}</p>
      )}
    </div>
  );
}
