import { redirect } from "next/navigation";
import { ChatUI } from "@/components/chat-ui"; 
import { apiGet } from "@/lib/api"; 

type Business = {
  id: string;
  name: string;
  slug: string;
};

// 1. Sửa type của params thành Promise
export default async function ChatPage({ params }: { params: Promise<{ slug: string }> }) {
  let business: Business | null = null;

  // 2. Phải await params ra trước khi dùng
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  try {
    console.log(`⏳ Đang gọi API lấy business theo slug: ${slug}`);
    
    business = await apiGet<Business>(`/businesses/public/${slug}`);
    
    console.log(`✅ Dữ liệu Business nhận được:`, business);
  } catch (error) {
    console.error(`❌ Lỗi API lấy business:`, error);
  }

  // NẾU KHÔNG TÌM THẤY BOT -> ĐÁ VỀ TRANG CHỦ
  if (!business || !business.id) {
    console.log("🛑 Business không tồn tại. Đá về trang chủ!");
    redirect("/"); 
  }

  return (
    <div className="min-h-screen bg-stone-50 py-10">
      <ChatUI 
        businessId={business.id} 
        businessName={business.name} 
      />
    </div>
  );
}