"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ChatUI } from "@/components/chat-ui";
import { API_URL } from "@/lib/api";

export default function PublicChatPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [business, setBusiness] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API_URL}/businesses/public/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Không tìm thấy doanh nghiệp này.");
        return res.json();
      })
      .then((data) => {
        setBusiness({ id: data.id, name: data.name });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>;
  }

  if (error || !business) {
    return <div className="flex min-h-screen items-center justify-center text-red-500 font-medium">{error || "Có lỗi xảy ra"}</div>;
  }

  return (
    <div className="min-h-screen bg-stone-50 p-4">
      <ChatUI businessId={business.id} businessName={business.name} />
    </div>
  );
}