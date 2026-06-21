// Login sayfası kendi layout'unu kullanır (sidebar olmadan)
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
