"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Bot, User, Send, Loader2, Coffee, Settings } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const [conversationId] = useState(() => crypto.randomUUID());
  const [customerId] = useState("customer-002");

  // Ref tới ô input
  const inputRef = useRef<HTMLInputElement>(null);

  // Ref tới cuối danh sách tin nhắn
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tự động scroll xuống cuối mỗi khi messages thay đổi
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  async function sendMessage() {
    if (!message.trim() || loading) return;

    const userMsgText = message;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      text: userMsgText,
    };

    // Hiển thị tin nhắn user ngay lập tức
    setMessages((prev) => [...prev, userMsg]);
    setMessage("");
    setLoading(true);

    // Giữ focus vào ô nhập ngay sau khi gửi
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    try {
      const response = await fetch("http://localhost:8080/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMsgText,
          conversationId,
          customerId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        sender: "ai",
        text: data.reply || "Không nhận được phản hồi.",
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("Error sending message:", error);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: "ai",
          text: "Có lỗi xảy ra khi kết nối tới máy chủ. Vui lòng thử lại!",
        },
      ]);
    } finally {
      setLoading(false);

      // Focus lại input sau khi AI trả lời xong
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 p-4 dark:bg-stone-950">
      <Card className="w-full max-w-lg shadow-lg border-stone-200 dark:border-stone-800">
        {/* Header */}
        <CardHeader className="border-b border-stone-100 dark:border-stone-800 bg-amber-900/5 dark:bg-amber-950/20 rounded-t-lg">
          <CardTitle className="flex items-center justify-between gap-2 text-stone-800 dark:text-stone-100 text-lg font-bold">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-600 text-white rounded-full">
                <Coffee className="h-5 w-5" />
              </div>
              Coffee AI Employee
            </div>

            <Link
              href="/settings/business"
              title="Cài đặt quán"
              className="inline-flex items-center justify-center rounded-md h-9 w-9 text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </CardTitle>
        </CardHeader>

        {/* Khung chat */}
        <CardContent className="p-4">
          <ScrollArea className="h-[400px] pr-4">
            {messages.length === 0 ? (
              <div className="flex h-[350px] flex-col items-center justify-center text-center text-stone-400 gap-2">
                <Coffee className="h-10 w-10 opacity-40" />

                <p className="text-sm">
                  Xin chào! Bạn muốn đặt món gì hôm nay?
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${
                      msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full text-xs font-semibold ${
                        msg.sender === "user"
                          ? "bg-amber-700 text-white"
                          : "bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-200"
                      }`}
                    >
                      {msg.sender === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>

                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-amber-700 text-white rounded-tr-none"
                          : "bg-stone-100 dark:bg-stone-900 text-stone-800 dark:text-stone-200 border border-stone-200/50 dark:border-stone-800 rounded-tl-none"
                      }`}
                    >
                      {msg.sender === "user" ? (
                        <span className="whitespace-pre-wrap">{msg.text}</span>
                      ) : (
                        <div className="prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => (
                                <p className="mb-2 last:mb-0">{children}</p>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc pl-5 mb-2 space-y-1">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal pl-5 mb-2 space-y-1">
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => (
                                <li className="leading-relaxed">{children}</li>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-semibold">
                                  {children}
                                </strong>
                              ),
                              em: ({ children }) => (
                                <em className="italic">{children}</em>
                              ),
                              code: ({ children }) => (
                                <code className="bg-stone-200 dark:bg-stone-800 px-1.5 py-0.5 rounded text-xs">
                                  {children}
                                </code>
                              ),
                              a: ({ href, children }) => (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-amber-700 dark:text-amber-400 underline"
                                >
                                  {children}
                                </a>
                              ),
                            }}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* AI đang trả lời */}
                {loading && (
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-200">
                      <Bot className="h-4 w-4" />
                    </div>

                    <div className="rounded-2xl rounded-tl-none bg-stone-100 dark:bg-stone-900 px-4 py-3 border border-stone-200/50 dark:border-stone-800">
                      <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                    </div>
                  </div>
                )}

                {/* Điểm neo để auto-scroll xuống cuối */}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
        </CardContent>

        {/* Ô nhập liệu */}
        <CardFooter className="border-t border-stone-100 dark:border-stone-800 p-4 gap-2">
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn..."
            disabled={loading}
            className="flex-1 focus-visible:ring-amber-600"
          />

          <Button
            onClick={sendMessage}
            disabled={loading || !message.trim()}
            className="bg-amber-700 hover:bg-amber-800 text-white"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
