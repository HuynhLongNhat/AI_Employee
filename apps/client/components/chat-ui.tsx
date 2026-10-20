"use client";

import { useEffect, useRef, useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Send, Loader2, Coffee, Plus, MessageSquare } from "lucide-react";
import { apiPost, apiGet } from "@/lib/api";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  suggestions?: string[];
}

interface ConversationLog {
  id: string;
  message: string;
  reply: string;
  createdAt: string;
}

interface ConversationSession {
  conversationId: string;
  lastMessage: string;
  lastTime: string;
}

export function ChatUI({ businessId, businessName }: { businessId: string; businessName: string }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sessions, setSessions] = useState<ConversationSession[]>([]);

  const { user } = useUser();
  const { isSignedIn, isLoaded } = useAuth();
  
  const [conversationId, setConversationId] = useState<string>(() => {
    if (typeof window === "undefined") return crypto.randomUUID();
    const key = `chat_conv_${businessId}`;
    const stored = localStorage.getItem(key);
    if (stored) return stored;
    const newId = crypto.randomUUID();
    localStorage.setItem(key, newId);
    return newId;
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false); 

  // ===== KHỞI TẠO IDENTITY (GUEST HOẶC CLERK) =====
  useEffect(() => {
    if (!isLoaded) return;

    async function initIdentity() {
      try {
        if (!isSignedIn) {
          // Xin Cookie cho Guest
          await apiPost("/auth/guest", {});
        }
        setIsReady(true);
      } catch (e) {
        console.error("Lỗi khởi tạo Identity:", e);
      }
    }
    initIdentity();
  }, [isLoaded, isSignedIn]);

  // ===== TỰ ĐỘNG CLAIM KHI ĐĂNG NHẬP =====
  useEffect(() => {
    if (isSignedIn && isReady) {
      apiPost("/auth/claim", { businessId })
        .catch((err) => console.error("Lỗi claim history:", err));
    }
  }, [isSignedIn, isReady, businessId]);

  // Load Sidebar
  useEffect(() => {
    if (!isReady) return;
    let ignore = false;
    
    async function loadSessions() {
      try {
        // KHÔNG CÒN customerId TRÊN URL
        const data = await apiGet<ConversationSession[]>(`/chat/conversations?businessId=${businessId}`);
        if (!ignore) setSessions(data || []);
      } catch (e) {}
    }
    loadSessions();
    return () => { ignore = true; };
  }, [businessId, isReady]);

  // Load Lịch sử chat
  useEffect(() => {
    if (!isReady) return;
    let ignore = false;
    
    async function loadHistory() {
      if (!conversationId) return;
      setHistoryLoading(true);
      try {
        // KHÔNG CÒN customerId TRÊN URL
        const logs = await apiGet<ConversationLog[]>(`/chat/history?conversationId=${conversationId}&businessId=${businessId}`);
        if (ignore) return;
        
        const newMsgs: Message[] = [];
        logs.forEach(log => {
          newMsgs.push({ id: `${log.id}-u`, sender: "user", text: log.message });
          newMsgs.push({ id: `${log.id}-a`, sender: "ai", text: log.reply });
        });
        setMessages(newMsgs);
      } catch (e) {
        if (!ignore) setMessages([]); 
      } finally {
        if (!ignore) setHistoryLoading(false);
      }
    }
    loadHistory();
    return () => { ignore = true; };
  }, [conversationId, businessId, isReady]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const handleSelectSession = (id: string) => {
    if (id === conversationId) return;
    setConversationId(id);
    localStorage.setItem(`chat_conv_${businessId}`, id);
  };

  const handleNewChat = () => {
    const newId = crypto.randomUUID();
    setConversationId(newId);
    localStorage.setItem(`chat_conv_${businessId}`, newId);
    setMessages([]);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  async function sendMessageWith(text: string) {
    if (!text.trim() || loading || !isReady) return;

    const userMsg: Message = { id: crypto.randomUUID(), sender: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setMessage("");
    setLoading(true);
    
    try {
      // KHÔNG CÒN customerId TRONG BODY
      const data = await apiPost<{ reply: string; suggestions?: string[] }>(
        "/chat",
        { message: text, conversationId, userName: user?.fullName }, 
        { headers: { "X-Business-Id": businessId } },
      );

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        sender: "ai",
        text: data.reply || "Không nhận được phản hồi.",
        suggestions: data.suggestions,
      };
      setMessages((prev) => [...prev, aiMsg]);
      
      setSessions(prev => {
        const existing = prev.find(s => s.conversationId === conversationId);
        const now = new Date().toISOString();
        if (existing) {
          return prev.map(s => s.conversationId === conversationId
            ? { ...s, lastMessage: text, lastTime: now }
            : s
          ).sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());
        } else {
          return [{ conversationId, lastMessage: text, lastTime: now }, ...prev];
        }
      });

    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), sender: "ai", text: "Có lỗi xảy ra khi kết nối tới máy chủ." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  if (!isReady) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>;
  }

  return (
    <div className="flex w-full max-w-5xl mx-auto mt-10 h-[650px] border rounded-xl shadow-lg overflow-hidden bg-white">
      {/* SIDEBAR */}
      <div className="w-[300px] border-r bg-stone-50 flex flex-col">
        <div className="p-4 border-b bg-white">
          <Button onClick={handleNewChat} className="w-full bg-amber-700 hover:bg-amber-800 text-white gap-2">
            <Plus className="h-4 w-4" /> Chat mới
          </Button>
        </div>
        <ScrollArea className="flex-1 p-3">
          <p className="text-xs font-semibold text-stone-500 mb-2 px-1">LỊCH SỬ GẦN ĐÂY</p>
          {sessions.length === 0 ? (
            <p className="text-sm text-stone-400 text-center mt-5">Chưa có lịch sử.</p>
          ) : (
            <div className="flex flex-col">
              {sessions.map((s) => (
                <button
                  key={s.conversationId}
                  onClick={() => handleSelectSession(s.conversationId)}
                  className={`text-left p-3 rounded-lg border text-sm transition-colors w-full ${
                    conversationId === s.conversationId 
                      ? 'bg-amber-50 border-amber-200 shadow-sm' 
                      : 'border-transparent hover:bg-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                    <p className={`truncate ${conversationId === s.conversationId ? 'font-semibold text-amber-900' : 'text-stone-700'}`}>
                      {s.lastMessage || "Cuộc hội thoại trống"}
                    </p>
                  </div>
                  <p className="text-xs text-stone-400 pl-5">
                    {new Date(s.lastTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(s.lastTime).toLocaleDateString('vi-VN')}
                  </p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* KHUNG CHAT */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="border-b bg-amber-900/5 p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-600 text-white rounded-full">
            <Coffee className="h-5 w-5" />
          </div>
          <h2 className="font-bold text-stone-800 text-lg">{businessName}</h2>
        </div>

        <div className="flex-1 p-4 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            {historyLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-stone-400 gap-2">
                <Coffee className="h-12 w-12 opacity-20" />
                <p>Bắt đầu cuộc trò chuyện mới...</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map((msg, index) => {
                  const isLastAi = msg.sender === "ai" && index === messages.length - 1;
                  const hasChips = isLastAi && msg.suggestions && msg.suggestions.length > 0;

                  return (
                    <div key={msg.id} className="flex flex-col">
                      <div className={`flex items-start gap-2.5 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.sender === "user" ? "bg-amber-700 text-white" : "bg-stone-200 text-stone-700"}`}>
                          {msg.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${msg.sender === "user" ? "bg-amber-700 text-white rounded-tr-none" : "bg-stone-100 rounded-tl-none"}`}>
                          {msg.sender === "user" ? (
                            <span className="whitespace-pre-wrap">{msg.text}</span>
                          ) : (
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                            </div>
                          )}
                        </div>
                      </div>
                      {hasChips && (
                        <div className="flex flex-col gap-1.5 mt-2.5 items-end">
                          {msg.suggestions!.slice(0, 4).map((s) => (
                            <button
                              key={s}
                              onClick={() => sendMessageWith(s)}
                              disabled={loading}
                              className="text-sm px-4 py-2 rounded-full border border-stone-300 bg-white hover:bg-stone-100 disabled:opacity-50"
                            >
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
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-200">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="rounded-2xl rounded-tl-none bg-stone-100 px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="border-t p-4 flex gap-2">
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                sendMessageWith(message);
              }
            }}
            placeholder="Nhập tin nhắn..."
            disabled={loading || historyLoading}
            className="flex-1"
          />
          <Button
            onClick={() => sendMessageWith(message)}
            disabled={loading || historyLoading || !message.trim()}
            className="bg-amber-700 text-white"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}