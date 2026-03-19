"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Download, Smartphone, Monitor, Apple } from "lucide-react";
import { APP_STORE_URL } from "@/lib/constants";

type Platform = "ios" | "android" | "desktop" | "detecting";

function detectPlatform(): Platform {
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

export default function DownloadPage() {
  const [platform, setPlatform] = useState<Platform>("detecting");

  useEffect(() => {
    const detected = detectPlatform();
    setPlatform(detected);

    if (detected === "ios") {
      window.location.replace(APP_STORE_URL);
    }
  }, []);

  return (
    <div className="min-h-screen bg-stadium-navy flex flex-col items-center justify-center px-4">
      {/* Header */}
      <Link href="/" className="font-bebas text-4xl tracking-wider text-floodlight mb-12">
        FOOTBALL IQ
      </Link>

      {platform === "detecting" && <DetectingState />}
      {platform === "ios" && <IOSRedirectState />}
      {platform === "android" && <AndroidState />}
      {platform === "desktop" && <DesktopState />}

      {/* Footer link */}
      <Link
        href="/"
        className="mt-12 text-sm text-slate-400 hover:text-floodlight transition-colors"
      >
        Back to Football IQ
      </Link>
    </div>
  );
}

function DetectingState() {
  return (
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-pitch-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-slate-400 text-sm">Detecting your device...</p>
    </div>
  );
}

function IOSRedirectState() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center backdrop-blur-sm">
      <Apple className="w-12 h-12 text-pitch-green mx-auto mb-4" />
      <h1 className="font-bebas text-2xl text-floodlight tracking-wide mb-2">
        Redirecting to App Store...
      </h1>
      <p className="text-slate-400 text-sm mb-6">
        If you&apos;re not redirected automatically:
      </p>
      <a
        href={APP_STORE_URL}
        className="inline-flex items-center gap-2 bg-pitch-green text-stadium-navy font-bold px-6 py-3 rounded-full hover:bg-pitch-green/90 transition-colors"
      >
        <Download className="w-4 h-4" />
        Download on the App Store
      </a>
    </div>
  );
}

function AndroidState() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center backdrop-blur-sm">
      <Smartphone className="w-12 h-12 text-card-yellow mx-auto mb-4" />
      <h1 className="font-bebas text-2xl text-floodlight tracking-wide mb-2">
        Coming Soon to Android
      </h1>
      <p className="text-slate-400 text-sm mb-6">
        Football IQ is currently available on iOS. We&apos;re working hard to bring it to Android.
      </p>
      <p className="text-slate-400 text-sm">
        In the meantime, play free quizzes at{" "}
        <Link href="/" className="text-pitch-green hover:underline">
          football-iq.app
        </Link>
      </p>
    </div>
  );
}

function DesktopState() {
  return (
    <div className="max-w-md w-full space-y-6">
      {/* iOS card */}
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/10 transition-colors group"
      >
        <div className="w-12 h-12 bg-pitch-green/10 rounded-xl flex items-center justify-center">
          <Apple className="w-6 h-6 text-pitch-green" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Download on the</p>
          <p className="font-bebas text-xl text-floodlight tracking-wide">App Store</p>
        </div>
        <Download className="w-5 h-5 text-pitch-green opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>

      {/* Android card */}
      <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm opacity-60">
        <div className="w-12 h-12 bg-card-yellow/10 rounded-xl flex items-center justify-center">
          <Smartphone className="w-6 h-6 text-card-yellow" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Coming Soon to</p>
          <p className="font-bebas text-xl text-floodlight tracking-wide">Google Play</p>
        </div>
        <span className="text-xs text-card-yellow font-semibold bg-card-yellow/10 px-2 py-1 rounded-full">
          Soon
        </span>
      </div>

      {/* Web play CTA */}
      <div className="text-center pt-2">
        <p className="text-slate-400 text-sm mb-3">Or play free quizzes in your browser</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 border border-pitch-green/30 text-pitch-green px-5 py-2.5 rounded-full hover:bg-pitch-green/10 transition-colors text-sm font-semibold"
        >
          <Monitor className="w-4 h-4" />
          Play on Web
        </Link>
      </div>
    </div>
  );
}
