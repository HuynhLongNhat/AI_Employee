'use client';

import { useBusinessContext } from '@/lib/business-context';
import { ChatUI } from '@/components/chat-ui';
import { Loader2 } from 'lucide-react';

export default function TestChatPage() {
  const { businesses, activeId, loading } = useBusinessContext();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  const activeBusiness = businesses.find((b) => b.id === activeId);

  if (!activeBusiness) {
    return (
      <div className="flex h-full items-center justify-center p-12 text-center text-muted-foreground">
        <p>Vui lòng chọn hoặc tạo một Bot trước khi test chat.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Test Chat</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bạn đang chat thử nghiệm với tư cách Khách hàng. Bot đang sử dụng: <strong>{activeBusiness.name}</strong>
        </p>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <ChatUI 
          businessId={activeBusiness.id} 
          businessName={activeBusiness.name} 
        />
      </div>
    </div>
  );
}