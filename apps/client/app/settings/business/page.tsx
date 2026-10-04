'use client';

import { useBusinessKnowledge } from '@/app/hooks/use-business-knowledge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function BusinessSettingsPage() {
  const { form, loading, saving, error, success, update, save } =
    useBusinessKnowledge();

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Thông tin doanh nghiệp</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        ) : (
          <>
            <Field
              id="businessName"
              label="Tên quán"
              value={form.businessName}
              onChange={(v) => update('businessName', v)}
              placeholder="Nhập tên quán"
            />
            <Field
              id="address"
              label="Địa chỉ"
              value={form.address}
              onChange={(v) => update('address', v)}
              placeholder="Nhập địa chỉ"
            />
            <Field
              id="phone"
              label="Số điện thoại"
              value={form.phone}
              onChange={(v) => update('phone', v)}
              placeholder="Ví dụ: 0901 234 567"
            />
            <Field
              id="openingHours"
              label="Giờ mở cửa"
              value={form.openingHours}
              onChange={(v) => update('openingHours', v)}
              placeholder="Ví dụ: 08:00 - 23:00"
            />
            <Field
              id="wifiName"
              label="Tên WiFi"
              value={form.wifiName}
              onChange={(v) => update('wifiName', v)}
              placeholder="Ví dụ: MocCoffee_5G"
            />
            <Field
              id="wifiPassword"
              label="Mật khẩu WiFi"
              value={form.wifiPassword}
              onChange={(v) => update('wifiPassword', v)}
              placeholder="Nhập mật khẩu wifi"
            />
            <Field
              id="parking"
              label="Tiện ích (Gửi xe, ...)"
              value={form.parking}
              onChange={(v) => update('parking', v)}
              placeholder="Ví dụ: Có, giữ xe máy miễn phí"
            />

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            {success && (
              <p className="text-sm text-green-600">{success}</p>
            )}

            <Button onClick={save} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}