import { AppScreenshot } from "./AppScreenshot";

export function MarketingHero() {
  return (
    <section className="relative w-full pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Single subtle background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-pitch-green/10 rounded-full blur-[150px] -translate-y-1/3 translate-x-1/3" />
      </div>

      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left z-10">
            <h1 className="font-bebas text-6xl md:text-7xl lg:text-8xl text-floodlight tracking-wide leading-[0.9] mb-6 animate-in slide-in-from-bottom-4 fade-in duration-700">
              WHAT&apos;S YOUR <br />
              <span className="text-pitch-green">FOOTBALL IQ?</span>
            </h1>

            <p className="font-sans text-lg md:text-xl text-slate-400 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-in slide-in-from-bottom-8 fade-in duration-700 delay-150">
              10 game modes. 10 tiers. From Trialist to GOAT.
              <span className="text-floodlight font-medium"> Find out where you rank.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300">
              <a
                href="#demo"
                className="inline-block px-8 py-4 bg-pitch-green text-stadium-navy font-bebas text-2xl tracking-wider rounded-lg shadow-[0_4px_0_0_#46A302] hover:shadow-[0_6px_0_0_#46A302] hover:-translate-y-[2px] active:translate-y-[2px] active:shadow-none transition-all text-center"
              >
                PLAY FREE DEMO
              </a>
              <a
                href="#modes"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 border-2 border-white/20 text-floodlight font-bebas text-xl tracking-wider rounded-lg hover:border-pitch-green hover:text-pitch-green transition-colors text-center"
              >
                SEE ALL MODES
              </a>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative flex-1 animate-in slide-in-from-right-8 fade-in duration-1000 delay-500">
             <div className="relative z-10 animate-float">
                <AppScreenshot
                  src="/images/app-screens/hero.png"
                  alt="Football IQ App Screen"
                  priority
                />
             </div>
          </div>

        </div>
      </div>
    </section>
  );
}
