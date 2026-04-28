"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Loader2 } from "lucide-react";

interface AndroidNotifyButtonProps {
  /**
   * Subscription source for analytics segmentation.
   * Should be one of the `android-notify-*` variants in /api/email/subscribe.
   */
  source: string;
  /**
   * Visual size — `sm` matches a 36px-tall badge, `md` matches 48px.
   */
  size?: "sm" | "md";
  /** Optional className for the outer container */
  className?: string;
}

/**
 * Compact inline email-capture for the Android launch waitlist.
 *
 * Replaces the dead "Coming Soon" Play Store badges across the site.
 * Default state shows a Play-Store-styled pill with a bell icon. Clicking
 * expands to an inline email field; after submit, settles into a confirmed
 * state. State is local — page refresh resets, intentional (let casual
 * visitors re-engage if they didn't commit the first time).
 */
export function AndroidNotifyButton({
  source,
  size = "sm",
  className = "",
}: AndroidNotifyButtonProps) {
  const [state, setState] = useState<"idle" | "open" | "loading" | "done" | "error">("idle");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state === "open") inputRef.current?.focus();
  }, [state]);

  const heightClass = size === "sm" ? "h-9" : "h-12";
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  const padding = size === "sm" ? "px-3" : "px-4";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/email/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setState("error");
        return;
      }
      setState("done");
      setEmail("");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div
        className={`inline-flex items-center gap-2 ${heightClass} ${padding} rounded-md bg-pitch-green/15 border border-pitch-green/30 text-pitch-green ${textSize} font-semibold ${className}`}
      >
        <Check className="w-4 h-4" />
        We&apos;ll let you know
      </div>
    );
  }

  if (state === "open" || state === "loading" || state === "error") {
    return (
      <form
        onSubmit={handleSubmit}
        className={`inline-flex flex-col items-stretch gap-1 ${className}`}
      >
        <div
          className={`inline-flex items-center gap-1.5 ${heightClass} pl-3 pr-1 rounded-md bg-stadium-navy border border-pitch-green/40 focus-within:border-pitch-green transition-colors`}
        >
          <input
            ref={inputRef}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
            disabled={state === "loading"}
            className={`bg-transparent outline-none ${textSize} text-floodlight placeholder:text-slate-600 w-32 sm:w-44 disabled:opacity-50`}
          />
          <button
            type="submit"
            disabled={state === "loading" || !email}
            className={`inline-flex items-center justify-center ${size === "sm" ? "h-7 px-2.5" : "h-10 px-4"} rounded bg-pitch-green text-stadium-navy font-bold ${textSize} hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-50`}
          >
            {state === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Notify"}
          </button>
        </div>
        {state === "error" && (
          <span className="text-[10px] text-red-400">{errorMsg}</span>
        )}
        <span className="text-[10px] text-slate-500">
          One email when Android launches. No spam.
        </span>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setState("open")}
      className={`inline-flex items-center gap-2 ${heightClass} ${padding} rounded-md bg-stadium-navy border border-white/15 hover:border-pitch-green/40 hover:bg-white/[0.04] transition-all text-slate-200 hover:text-floodlight active:scale-[0.97] ${textSize} font-semibold ${className}`}
      aria-label="Get notified when Android version launches"
    >
      <Bell className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[9px] uppercase tracking-wider text-slate-500">
          Android
        </span>
        <span className={textSize}>Get launch alert</span>
      </span>
    </button>
  );
}
