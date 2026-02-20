export default function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stadium-navy text-floodlight">
      {children}
    </div>
  );
}
