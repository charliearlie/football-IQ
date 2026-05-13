"use client";

import { usePremium } from "@/lib/billing/usePremium";

export function BlogAdSlot() {
  const premium = usePremium();
  if (premium.ready && premium.isPremium) return null;

  return (
    <div className="my-8 flex justify-center">
      <div className="w-full max-w-2xl rounded-lg bg-white/5 border border-white/10 p-4 text-center">
        {/* AdSense in-article ad — Google will auto-fill this */}
        <ins
          className="adsbygoogle"
          style={{ display: "block", textAlign: "center" }}
          data-ad-layout="in-article"
          data-ad-format="fluid"
          data-ad-client="ca-pub-9426782115883407"
          data-ad-slot=""
        />
      </div>
    </div>
  );
}
