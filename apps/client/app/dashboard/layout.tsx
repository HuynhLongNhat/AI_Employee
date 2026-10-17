import { OwnerSidebar } from '@/components/owner-sidebar';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <OwnerSidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}