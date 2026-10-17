"use client";

import { useBusinessKnowledge } from "@/app/hooks/use-business-knowledge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
              onChange={(v) => update("businessName", v)}
              placeholder="Nhập tên quán"
            />
            <Field
              id="address"
              label="Địa chỉ"
              value={form.address}
              onChange={(v) => update("address", v)}
              placeholder="Nhập địa chỉ"
            />
            <Field
              id="phone"
              label="Số điện thoại"
              value={form.phone}
              onChange={(v) => update("phone", v)}
              placeholder="Ví dụ: 0901 234 567"
            />
            <Field
              id="openingHours"
              label="Giờ mở cửa"
              value={form.openingHours}
              onChange={(v) => update("openingHours", v)}
              placeholder="Ví dụ: 08:00 - 23:00"
            />
            <Field
              id="wifiName"
              label="Tên WiFi"
              value={form.wifiName}
              onChange={(v) => update("wifiName", v)}
              placeholder="Ví dụ: MocCoffee_5G"
            />
            <Field
              id="wifiPassword"
              label="Mật khẩu WiFi"
              value={form.wifiPassword}
              onChange={(v) => update("wifiPassword", v)}
              placeholder="Nhập mật khẩu wifi"
            />
          
            <div className="border-t pt-4 mt-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Ngành & Thuật ngữ</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Giúp AI Employee dùng đúng từ ngữ của ngành bạn.
                </p>
              </div>

              <Field
                id="industry"
                label="Ngành nghề"
                value={form.industry}
                onChange={(v) => update("industry", v)}
                placeholder="coffee / gym / spa / retail / ..."
              />
              <Field
                id="businessTerm"
                label="Cách gọi doanh nghiệp"
                value={form.businessTerm}
                onChange={(v) => update("businessTerm", v)}
                placeholder="quán / phòng tập / cơ sở / cửa hàng..."
              />
              <Field
                id="customerTerm"
                label="Cách gọi khách"
                value={form.customerTerm}
                onChange={(v) => update("customerTerm", v)}
                placeholder="khách hàng / học viên / bệnh nhân..."
              />
              <Field
                id="productTerm"
                label="Cách gọi sản phẩm/dịch vụ"
                value={form.productTerm}
                onChange={(v) => update("productTerm", v)}
                placeholder="món / gói tập / dịch vụ / sản phẩm..."
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <Button onClick={save} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
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
