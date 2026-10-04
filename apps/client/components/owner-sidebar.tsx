'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/settings/business', label: 'Thông tin doanh nghiệp' },
  { href: '/settings/products', label: 'Sản phẩm / Dịch vụ' },
  { href: '/settings/promotions', label: 'Khuyến mãi' },
  { href: '/settings/policies', label: 'Chính sách' },
  { href: '/settings/faq', label: 'FAQ / Knowledge' },
  { href: '/settings/ai', label: 'AI Employee' },
];

export function OwnerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r bg-muted/30 min-h-screen p-4">
      <div className="mb-6">
        <Link href="/" className="text-lg font-semibold">
          ☕ Coffee AI Employee
        </Link>
        <p className="text-xs text-muted-foreground mt-1">
          Owner Dashboard
        </p>
      </div>

      <nav className="space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? 'block rounded-md px-3 py-2 text-sm font-medium bg-primary text-primary-foreground'
                  : 'block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent'
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 pt-4 border-t">
        <Link
          href="/"
          className="block text-sm text-muted-foreground hover:text-foreground"
        >
          ← Về Chat
        </Link>
      </div>
    </aside>
  );
}