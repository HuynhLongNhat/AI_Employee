'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AiPermissions, useAiConfig } from '@/hooks/use-ai-config';

const ROLES = [
  { value: 'consultant', label: 'Nhân viên tư vấn' },
  { value: 'cashier', label: 'Thu ngân' },
  { value: 'support', label: 'Hỗ trợ' },
];

const STYLES = [
  { value: 'friendly', label: 'Thân thiện' },
  { value: 'professional', label: 'Chuyên nghiệp' },
  { value: 'playful', label: 'Vui vẻ' },
];

const PERMISSIONS: { key: keyof AiPermissions; label: string }[] = [
  { key: 'canAdvise', label: 'Tư vấn sản phẩm / dịch vụ' },
  { key: 'canPlaceOrder', label: 'Tạo đơn hàng' },
  { key: 'canHandleIssue', label: 'Xử lý sự cố (khiếu nại, hoàn tiền, chuyển nhân viên)' },
];

export default function AiSettingsPage() {
  const {
    form,
    loading,
    saving,
    error,
    success,
    update,
    togglePermission,
    save,
  } = useAiConfig();

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Cấu hình AI Employee</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        ) : (
          <>
            <div className="space-y-1">
              <label className="text-sm font-medium">Tên AI Employee</label>
              <Input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Ví dụ: Linh, Mộc, An..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Vai trò</label>
              <select
                className="border rounded-md px-3 py-2 w-full bg-background"
                value={form.role}
                onChange={(e) => update('role', e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Phong cách giao tiếp</label>
              <select
                className="border rounded-md px-3 py-2 w-full bg-background"
                value={form.style}
                onChange={(e) => update('style', e.target.value)}
              >
                {STYLES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cho phép</label>
              <div className="space-y-2">
                {PERMISSIONS.map((p) => (
                  <label
                    key={p.key}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={form.permissions[p.key]}
                      onChange={() => togglePermission(p.key)}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <Button onClick={save} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}