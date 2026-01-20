// Force dynamic rendering - auth pages should not be prerendered
export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
