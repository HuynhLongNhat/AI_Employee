"use client";

import { useEffect, useState, useRef } from "react";
import { useBusinessContext } from "@/lib/business-context";
import { apiGet } from "@/lib/api";
import { Loader2, MessageSquare, User, Bot } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type ConversationLog = {
  id: string;
  conversationId: string;
  customerId: string;
  customerName?: string;
  message: string;
  reply: string;
  createdAt: string;
};

type ConversationGroup = {
  conversationId: string;
  customerId: string;
  customerName?: string;
  lastMessage: string;
  lastTime: string;
  logs: ConversationLog[];
};

const getDisplayName = (name?: string, id?: string) => {
  if (name) return name;
  if (id) return `Vãng lai (${id.slice(0, 8)}...)`;
  return "Khách";
};

export default function InboxPage() {
  const { activeId, loading: ctxLoading } = useBusinessContext();
  const [logs, setLogs] = useState<ConversationLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Chỉ lưu những phiên người dùng CHỦ ĐỘNG click chọn
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeId) return;

    let cancelled = false;
    queueMicrotask(() => setLoading(true));

    apiGet<ConversationLog[]>(`/businesses/${activeId}/logs`)
      .then((data) => {
        if (cancelled) return;
        setLogs(data);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeId]);

  const groupedConversations: ConversationGroup[] = [];
  const map = new Map<string, ConversationLog[]>();

  [...logs].reverse().forEach((log) => {
    if (!map.has(log.conversationId)) {
      map.set(log.conversationId, []);
    }
    map.get(log.conversationId)!.push(log);
  });

  map.forEach((convLogs, convId) => {
    const lastLog = convLogs[convLogs.length - 1];
    groupedConversations.push({
      conversationId: convId,
      customerId: lastLog.customerId,
      customerName: lastLog.customerName,
      lastMessage: lastLog.message,
      lastTime: lastLog.createdAt,
      logs: convLogs,
    });
  });

  groupedConversations.sort(
    (a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime(),
  );

  // ===== SỬA LỖI TẠI ĐÂY: DÙNG DERIVED STATE THAY VÌ USEEFFECT =====
  const activeConversation = selectedConvId
    ? groupedConversations.find((c) => c.conversationId === selectedConvId) ||
      groupedConversations[0]
    : groupedConversations[0];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation?.conversationId, logs]); // Dùng activeConversation thay vì selectedConvId

  if (ctxLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-white rounded-lg border shadow-sm m-6">
      {/* CỘT TRÁI */}
      <div className="w-1/3 border-r flex flex-col bg-stone-50 min-w-[280px]">
        <div className="p-4 border-b bg-white">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-amber-600" /> Hộp thư
          </h2>
        </div>

        <ScrollArea className="flex-1"></ScrollArea>
      </div>{" "}
      <ScrollArea className="flex-1">
        {groupedConversations.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Chưa có hội thoại nào.
          </div>
        ) : (
          // THÊM THẺ DIV BAO BỌC Ở ĐÂY
          <div className="flex flex-col">
            {groupedConversations.map((conv) => (
              <button
                key={conv.conversationId}
                onClick={() => setSelectedConvId(conv.conversationId)}
                className={`w-full text-left p-4 border-b transition-colors hover:bg-stone-100 ${
                  activeConversation?.conversationId === conv.conversationId
                    ? "bg-amber-50 border-l-4 border-l-amber-600"
                    : ""
                }`}
              >
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-medium text-sm text-stone-800 truncate">
                    Khách: {getDisplayName(conv.customerName, conv.customerId)}
                  </span>
                  <span className="text-xs text-stone-400">
                    {new Date(conv.lastTime).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-xs text-stone-500 truncate">
                  {conv.lastMessage}
                </p>
              </button>
            ))}
          </div>
          // KẾT THÚC THẺ DIV
        )}
      </ScrollArea>
      {/* CỘT PHẢI */}
      <div className="flex-1 flex flex-col bg-white">
        {activeConversation ? (
          <>
            <div className="p-4 border-b bg-white flex items-center justify-between shadow-sm z-10">
              <div>
                <h3 className="font-semibold text-stone-800">
                  Khách:{" "}
                  {getDisplayName(
                    activeConversation.customerName,
                    activeConversation.customerId,
                  )}
                </h3>
                <p className="text-xs text-stone-500">
                  ID phiên: {activeConversation.conversationId}
                </p>
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto p-4 space-y-6"
              ref={scrollRef}
            >
              {activeConversation.logs.map((log) => (
                <div key={log.id} className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-stone-200 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-stone-500" />
                    </div>
                    <div className="bg-stone-100 rounded-2xl rounded-tl-none px-4 py-2.5 max-w-[75%] text-sm text-stone-800">
                      {log.message}
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 flex-row-reverse">
                    <div className="h-8 w-8 rounded-full bg-amber-600 flex items-center justify-center shrink-0 text-white">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl rounded-tr-none px-4 py-2.5 max-w-[75%] text-sm text-amber-900 whitespace-pre-wrap">
                      {log.reply}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-stone-400">
            <MessageSquare className="h-12 w-12 mb-3 opacity-20" />
            <p>Chọn một hội thoại để xem chi tiết</p>
          </div>
        )}
      </div>
    </div>
  );
}
