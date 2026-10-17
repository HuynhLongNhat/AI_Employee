'use client';

import Link from 'next/link';
import { SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Bot, Coffee, MessageSquare, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-600 text-white rounded-full">
            <Coffee className="h-5 w-5" />
          </div>
          <span className="font-bold text-stone-800 dark:text-stone-100">
            AI Employee
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="outline">Đăng nhập</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button>Đăng ký</Button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <Link href="/dashboard/business">
              <Button variant="outline">Dashboard</Button>
            </Link>
            <UserButton />
          </Show>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-sm">
          <Sparkles className="h-4 w-4" />
          AI Employee cho mọi ngành
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-stone-900 dark:text-stone-50 leading-tight">
          Nhân viên AI hiểu nghiệp vụ
          <br />
          <span className="text-amber-600">của doanh nghiệp bạn</span>
        </h1>

        <p className="text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
          Cà phê, Gym, Spa, Retail — cùng một AI Employee. Cấu hình một lần,
          hoạt động ngay. Không cần biết code.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Link href="/chat">
            <Button size="lg" className="bg-amber-600 hover:bg-amber-700">
              <MessageSquare className="h-5 w-5 mr-2" />
              Thử chat ngay
            </Button>
          </Link>

          <Show when="signed-out">
            <SignUpButton mode="modal">
              <Button size="lg" variant="outline">
                Tạo tài khoản Owner
              </Button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <Link href="/dashboard/business">
              <Button size="lg" variant="outline">
                Vào Dashboard
              </Button>
            </Link>
          </Show>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Bot className="h-6 w-6" />}
            title="Hiểu ngôn ngữ tự nhiên"
            desc="Khách hỏi tự nhiên, AI hiểu đúng ý — không cần gõ đúng từ khóa."
          />
          <FeatureCard
            icon={<Coffee className="h-6 w-6" />}
            title="Đa ngành"
            desc="Cùng Core AI, chỉ đổi dữ liệu. Coffee → Gym → Spa không cần code lại."
          />
          <FeatureCard
            icon={<Sparkles className="h-6 w-6" />}
            title="Chủ động tư vấn"
            desc="Gợi ý sản phẩm phù hợp nhu cầu khách — dựa trên dữ liệu bạn cung cấp."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 py-8 text-center text-sm text-stone-500">
        AI Employee · MVP Prototype
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="p-6 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3">
      <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 inline-flex">
        {icon}
      </div>
      <h3 className="font-semibold text-stone-900 dark:text-stone-50">
        {title}
      </h3>
      <p className="text-sm text-stone-600 dark:text-stone-400">{desc}</p>
    </div>
  );
}