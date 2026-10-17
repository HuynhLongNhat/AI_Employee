"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useBusinessContext, Business } from "@/lib/business-context";
import {
  Copy,
  Settings,
  MessageSquare,
  Plus,
  Loader2,
  Edit,
  Trash2,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const {
    businesses,
    loading,
    switchBusiness,
    createBusiness,
    updateBusiness,
    deleteBusiness,
  } = useBusinessContext();

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // State cho Dialog Tạo/Sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<Business | null>(null);
  const [botName, setBotName] = useState("");
  const [botIndustry, setBotIndustry] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // State cho AlertDialog Xóa
  const [deleteTarget, setDeleteTarget] = useState<Business | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function openCreateModal() {
    setEditingBot(null);
    setBotName("");
    setBotIndustry("");
    setIsModalOpen(true);
  }

  function openEditModal(biz: Business) {
    setEditingBot(biz);
    setBotName(biz.name);
    setBotIndustry(biz.industry || "");
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!botName.trim()) return;

    setIsSaving(true);
    try {
      if (editingBot) {
        await updateBusiness(editingBot.id, {
          name: botName.trim(),
          industry: botIndustry.trim(),
        });
        toast.success("Đã cập nhật thông tin Bot thành công!");
      } else {
        await createBusiness({
          name: botName.trim(),
          industry: botIndustry.trim(),
        });
        toast.success("Tạo Bot mới thành công!");
        router.push("/dashboard/business");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Có lỗi xảy ra khi lưu thông tin.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteBusiness(deleteTarget.id);
      toast.success(`Đã xóa Bot "${deleteTarget.name}".`);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi xóa Bot.");
    } finally {
      setIsDeleting(false);
    }
  }

  function copyLink(slug: string, id: string) {
    const url = `${window.location.origin}/chat/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.info("Đã copy link chat vào bộ nhớ tạm.");
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Employees của bạn</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý các trợ lý ảo cho từng doanh nghiệp.
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-amber-600 hover:bg-amber-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Tạo Bot mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {businesses.map((biz) => (
          <Card key={biz.id} className="flex flex-col">
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2 pr-16">
                <div className="h-8 w-8 rounded bg-amber-100 flex items-center justify-center text-amber-700 font-bold shrink-0">
                  {biz.name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">{biz.name}</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {biz.industry || "Chưa cài đặt ngành"}
              </p>

              {/* Nút Sửa / Xóa dùng icon */}
              <div className="absolute top-4 right-4 flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-stone-400 hover:text-amber-600"
                  onClick={() => openEditModal(biz)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-stone-400 hover:text-red-600"
                  onClick={() => setDeleteTarget(biz)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1">
              <div className="bg-stone-100 p-3 rounded-md flex items-center justify-between border">
                <code className="text-xs text-stone-600 truncate mr-2">
                  /chat/{biz.slug}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2"
                  onClick={() => copyLink(biz.slug!, biz.id)}
                >
                  {copiedId === biz.id ? (
                    <span className="text-green-600 text-xs font-semibold">
                      Copied
                    </span>
                  ) : (
                    <Copy className="h-4 w-4 text-stone-500" />
                  )}
                </Button>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  switchBusiness(biz.id);
                  router.push("/dashboard/business");
                }}
              >
                <Settings className="h-4 w-4 mr-2" /> Cấu hình
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  switchBusiness(biz.id);
                  router.push("/dashboard/test-chat");
                }}
              >
                <MessageSquare className="h-4 w-4 mr-2" /> Test
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* 1. Dialog Tạo / Sửa Bot */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingBot ? "Sửa thông tin Bot" : "Tạo AI Employee mới"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Tên Bot (Doanh nghiệp)
              </label>
              <Input
                placeholder="VD: Mộc Coffee..."
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Ngành nghề (Không bắt buộc)
              </label>
              <Input
                placeholder="VD: coffee, gym..."
                value={botIndustry}
                onChange={(e) => setBotIndustry(e.target.value)}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !botName.trim()}
                className="bg-amber-600 text-white"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingBot ? "Lưu thay đổi" : "Tạo Bot"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. AlertDialog Xác nhận Xóa */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa vĩnh viễn Bot{" "}
              <strong>"{deleteTarget?.name}"</strong> và đường link chat{" "}
              <code>/chat/{deleteTarget?.slug}</code>. Không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Xóa Bot
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
