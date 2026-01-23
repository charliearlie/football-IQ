"use client";

import Image from "next/image";
import Link from "next/link";
import { CTAButton } from "./CTAButton";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/constants";

export function Hero() {
  const scrollToDemo = () => {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center px-4 py-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-stadium-navy via-background to-background" />

      <div className="relative z-10 max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Left: Headline + CTA */}
        <div className="text-center md:text-left">
          <h1 className="font-bebas text-5xl sm:text-6xl lg:text-7xl tracking-wide leading-none mb-6">
            <span className="text-floodlight">PROVE YOUR</span>
            <br />
            <span className="text-pitch-green">FOOTBALL IQ</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-md mx-auto md:mx-0">
            Daily puzzles to test your knowledge. Track your stats. Climb the
            leaderboard.
          </p>

          {/* Store badges - following Apple & Google guidelines (min 40px height) */}
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start mb-6">
            <Link
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Download on the App Store"
              className="transition-opacity hover:opacity-80"
            >
              <Image
                src="/images/app-store.svg"
                alt="Download on the App Store"
                width={150}
                height={50}
                className="h-[50px] w-auto"
              />
            </Link>
            <Link
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Get it on Google Play"
              className="transition-opacity hover:opacity-80"
            >
              <Image
                src="/images/play-store.svg"
                alt="Get it on Google Play"
                width={168}
                height={50}
                className="h-[50px] w-auto"
              />
            </Link>
          </div>

          <CTAButton variant="secondary" onClick={scrollToDemo}>
            TRY A PUZZLE
          </CTAButton>
        </div>

        {/* Right: iPhone mockup */}
        <div className="relative h-[600px] lg:h-[700px] hidden md:block">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-72 lg:w-80 h-[550px] lg:h-[650px] animate-float">
              <Image
                src="/app-screen.png"
                alt="Football IQ App"
                fill
                className="object-contain drop-shadow-2xl"
                priority
                sizes="(min-width: 1024px) 320px, 288px"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
