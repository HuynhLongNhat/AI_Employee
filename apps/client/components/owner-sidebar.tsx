'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { useBusinessContext } from '@/lib/business-context';
import { Bot, Store, Package, Tag, FileText, HelpCircle, Cpu, MessageSquare, Inbox  } from 'lucide-react';

const NAV = [{ href: '/dashboard', label: 'Danh sách Bot', icon: Bot }];

const BOT_NAV = [
  { href: '/dashboard/business', label: 'Thông tin doanh nghiệp', icon: Store },
  { href: '/dashboard/products', label: 'Sản phẩm / Dịch vụ', icon: Package },
  { href: '/dashboard/promotions', label: 'Khuyến mãi', icon: Tag },
  { href: '/dashboard/policies', label: 'Chính sách', icon: FileText },
  { href: '/dashboard/faq', label: 'FAQ / Knowledge', icon: HelpCircle },
  { href: '/dashboard/ai', label: 'AI Employee', icon: Cpu },
  { href: '/dashboard/test-chat', label: 'Test Chat', icon: MessageSquare },
  { href: '/dashboard/inbox', label: 'Hộp thư (Inbox)', icon: Inbox },// ← THÊM DÒNG NÀY
];

export function OwnerSidebar() {
  const pathname = usePathname();
  const { businesses, activeId, switchBusiness } = useBusinessContext();

  return (
    <aside className="w-64 shrink-0 border-r bg-muted/30 min-h-screen p-4 flex flex-col">
      <div className="mb-6">
        <Link href="/dashboard" className="text-lg font-semibold flex items-center gap-2">
          <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center text-white text-xs">AI</div>
          AI Employee
        </Link>
        <p className="text-xs text-muted-foreground mt-1">Owner Dashboard</p>
      </div>

      <div className="mb-4 space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Bot đang chọn</label>
        <select
          className="w-full border rounded-md px-2 py-1.5 text-sm bg-background"
          value={activeId ?? ''}
          onChange={(e) => switchBusiness(e.target.value)}
        >
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        {/* ĐÃ XÓA NÚT PROMPT Ở ĐÂY */}
      </div>

      <nav className="space-y-1 flex-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-4 pb-1">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Cấu hình Bot
          </p>
        </div>

        {BOT_NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 pt-4 border-t space-y-3">
        <Link href="/" className="block text-sm text-muted-foreground hover:text-foreground">
          ← Về trang chủ
        </Link>
        <UserButton showName />
      </div>
    </aside>
  );
}