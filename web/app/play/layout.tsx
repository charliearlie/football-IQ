import Script from "next/script";

export default function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stadium-navy text-floodlight">
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9426782115883407"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      {children}
    </div>
  );
}
