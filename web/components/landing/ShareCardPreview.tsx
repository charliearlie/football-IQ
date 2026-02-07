import { CheckCircle } from "lucide-react";

export function ShareCardPreview() {
  return (
    <section className="py-20 bg-[#080E1A] border-t border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Text side */}
          <div className="flex-1 text-center lg:text-left">
            <h2 className="font-bebas text-5xl md:text-6xl text-floodlight mb-4">
              SHARE YOUR SCORE.{" "}
              <span className="text-pitch-green">START ARGUMENTS.</span>
            </h2>
            <p className="text-slate-400 text-lg mb-6 max-w-md mx-auto lg:mx-0">
              Every result generates a share card. Post it to the group chat, put
              it on your story, or settle debates with proof.
            </p>
            <p className="text-slate-500 text-sm max-w-md mx-auto lg:mx-0">
              One tap to share on WhatsApp, Instagram, X, or anywhere.
            </p>
          </div>

          {/* Mock share card */}
          <div className="flex-1 flex justify-center">
            <div className="w-[260px] rounded-2xl p-5 border border-pitch-green/40 bg-[#1a2744] shadow-lg shadow-pitch-green/5">
              <p className="font-bebas text-xs text-pitch-green tracking-[3px] text-center mb-4">
                FOOTBALL IQ
              </p>

              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-sm">🔍</span>
                <span className="text-xs font-semibold text-floodlight">
                  Career Path
                </span>
              </div>

              <div className="flex justify-center mb-3">
                <div className="w-10 h-10 rounded-full bg-pitch-green flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-stadium-navy" />
                </div>
              </div>

              <p className="font-bebas text-xl text-pitch-green tracking-wide text-center">
                COMPLETE!
              </p>
              <p className="text-floodlight text-sm text-center mt-1">
                3 of 8 clubs revealed
              </p>
              <p className="text-xs text-slate-400 text-center mb-4">
                Feb 6, 2026
              </p>

              <div className="border-t border-white/10 pt-3">
                <div className="flex items-center justify-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-[#FACC15]" />
                  <span className="text-floodlight">Key Player</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400">2,450 IQ</span>
                </div>
                <p className="text-[10px] text-pitch-green text-center mt-2">
                  football-iq.app
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
