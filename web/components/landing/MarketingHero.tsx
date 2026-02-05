import { AppScreenshot } from "./AppScreenshot";
import { GeometricParticles } from "./GeometricParticles";
import { StreakBadge } from "./StreakBadge";
import Image from "next/image";

export function MarketingHero() {
  return (
    <section className="relative w-full pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Geometric Particles */}
      <GeometricParticles />

      {/* Background Elements - Multiple colorful shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        {/* Primary green blob */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pitch-green/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse" />
        {/* Yellow accent blob */}
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-card-yellow/15 rounded-full blur-[100px] animate-float-slow" />
        {/* Coral accent blob */}
        <div className="absolute bottom-1/4 right-1/3 w-[250px] h-[250px] bg-coral/10 rounded-full blur-[80px] animate-float-slow" style={{ animationDelay: "2s" }} />
        {/* Navy base */}
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-stadium-navy/40 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
        {/* Teal accent */}
        <div className="absolute top-1/2 right-0 w-[200px] h-[200px] bg-teal/10 rounded-full blur-[60px] animate-float-slow" style={{ animationDelay: "4s" }} />
      </div>

      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left z-10">
            {/* Streak Badge */}
            <div className="mb-6 animate-in slide-in-from-bottom-2 fade-in duration-500">
              <StreakBadge />
            </div>

            <h1 className="font-bebas text-6xl md:text-7xl lg:text-8xl text-floodlight tracking-wide leading-[0.9] mb-6 animate-in slide-in-from-bottom-4 fade-in duration-700 text-shadow-fun">
              PROVE YOU&apos;RE A <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pitch-green via-teal to-card-yellow bg-[length:200%_auto] animate-gradient-shift">FOOTBALL GENIUS</span>
            </h1>

            <p className="font-sans text-lg md:text-xl text-slate-400 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-in slide-in-from-bottom-8 fade-in duration-700 delay-150">
              The daily ritual for football fans. Challenge yourself with Career Paths, Transfers, Lineups, and more.
              <span className="text-floodlight font-medium"> How many can you get right?</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300">
             <a href="#" className="transform hover:scale-105 transition-transform duration-200">
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                  alt="Download on the App Store"
                  width={160}
                  height={53}
                  className="h-[53px] w-auto"
                />
             </a>
             <a href="#" className="transform hover:scale-105 transition-transform duration-200">
               <Image
                 src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                 alt="Get it on Google Play"
                 width={180}
                 height={53}
                 className="h-[53px] w-auto border border-white/10 rounded-lg"
               />
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
                  className="rotate-[-6deg] hover:rotate-0 transition-transform duration-500"
                />
             </div>

             {/* Decorative elements behind phone */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border-2 border-pitch-green/30 rounded-full animate-pulse -z-10" />
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] border border-white/5 rounded-full -z-10" />
             {/* Additional decorative ring with color */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-card-yellow/20 rounded-full -z-10 animate-float-slow" />
          </div>

        </div>
      </div>
    </section>
  );
}
