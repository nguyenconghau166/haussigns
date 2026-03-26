export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Register page should NOT show the sidebar or admin layout
  return <>{children}</>;
}
