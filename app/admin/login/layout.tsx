export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Login page should NOT show the sidebar or admin layout
  return <>{children}</>;
}
