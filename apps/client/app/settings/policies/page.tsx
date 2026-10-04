'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { usePolicies } from '@/hooks/use-policies';

const FIELDS: { key: 'order' | 'delivery' | 'payment' | 'cancel' | 'refund'; label: string }[] = [
  { key: 'order', label: 'Chính sách đặt món' },
  { key: 'delivery', label: 'Chính sách giao hàng' },
  { key: 'payment', label: 'Chính sách thanh toán' },
  { key: 'cancel', label: 'Chính sách hủy đơn' },
  { key: 'refund', label: 'Chính sách hoàn tiền' },
];

export default function PoliciesPage() {
  const { form, loading, saving, error, success, update, save } = usePolicies();

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Chính sách</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        ) : (
          <>
            {FIELDS.map((f) => (
              <div key={f.key} className="space-y-1">
                <label className="text-sm font-medium">{f.label}</label>
                <textarea
                  className="border rounded-md px-3 py-2 w-full bg-background min-h-[80px] text-sm"
                  value={form[f.key]}
                  onChange={(e) => update(f.key, e.target.value)}
                  placeholder={`Nhập ${f.label.toLowerCase()}`}
                />
              </div>
            ))}

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <Button onClick={save} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}