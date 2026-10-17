"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Send, Loader2, Coffee } from "lucide-react";
import { apiPost } from "@/lib/api";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  suggestions?: string[];
}

export function ChatUI({ businessId, businessName }: { businessId: string; businessName: string }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationId] = useState(() => crypto.randomUUID());
  
  const { user } = useUser();
  const [guestId] = useState(() => crypto.randomUUID());
  const [customerId] = user?.id ? [user.id] : [guestId];

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function sendMessageWith(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), sender: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setMessage("");
    setLoading(true);
    setTimeout(() => inputRef.current?.focus(), 0);

    try {
      // Gọi API chat kèm theo businessId cố định của trang này
      const data = await apiPost<{ reply: string; suggestions?: string[] }>(
        "/chat",
        { message: text, conversationId, customerId },
        { headers: { "X-Business-Id": businessId } } // Ép businessId cho request này
      );

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        sender: "ai",
        text: data.reply || "Không nhận được phản hồi.",
        suggestions: data.suggestions,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), sender: "ai", text: "Có lỗi xảy ra khi kết nối tới máy chủ." }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessageWith(message);
    }
  };

  return (
    <Card className="w-full max-w-lg shadow-lg border-stone-200 dark:border-stone-800 mx-auto mt-10">
      <CardHeader className="border-b border-stone-100 dark:border-stone-800 bg-amber-900/5 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-stone-800 text-lg font-bold">
          <div className="p-2 bg-amber-600 text-white rounded-full"><Coffee className="h-5 w-5" /></div>
          {businessName}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        <ScrollArea className="h-[400px] pr-4">
          {messages.length === 0 ? (
            <div className="flex h-[350px] flex-col items-center justify-center text-stone-400 gap-2">
              <Coffee className="h-10 w-10 opacity-40" />
              <p className="text-sm">Xin chào! Tôi có thể giúp gì cho bạn?</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((msg, index) => {
                const isLastAi = msg.sender === "ai" && index === messages.length - 1;
                const hasChips = isLastAi && msg.suggestions && msg.suggestions.length > 0;
                
                return (
                  <div key={msg.id} className="flex flex-col">
                    <div className={`flex items-start gap-2.5 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.sender === "user" ? "bg-amber-700 text-white" : "bg-stone-200 text-stone-700"}`}>
                        {msg.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.sender === "user" ? "bg-amber-700 text-white rounded-tr-none" : "bg-stone-100 rounded-tl-none"}`}>
                        {msg.sender === "user" ? <span className="whitespace-pre-wrap">{msg.text}</span> : (
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                    {hasChips && (
                      <div className="flex flex-col gap-1.5 mt-2.5 items-end">
                        {msg.suggestions!.slice(0, 4).map((s) => (
                          <button key={s} onClick={() => sendMessageWith(s)} disabled={loading} className="text-sm px-4 py-2 rounded-full border border-stone-300 bg-white hover:bg-stone-100 disabled:opacity-50">
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {loading && (
                <div className="flex items-start gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-200"><Bot className="h-4 w-4" /></div>
                  <div className="rounded-2xl rounded-tl-none bg-stone-100 px-4 py-3"><Loader2 className="h-4 w-4 animate-spin text-amber-600" /></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <CardFooter className="border-t p-4 gap-2">
        <Input ref={inputRef} value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder="Nhập tin nhắn..." disabled={loading} className="flex-1" />
        <Button onClick={() => sendMessageWith(message)} disabled={loading || !message.trim()} className="bg-amber-700 text-white">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  );
}