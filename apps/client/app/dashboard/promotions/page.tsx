'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiGet } from '@/lib/api';
import {
  Promotion,
  PromotionInput,
  usePromotions,
} from '@/hooks/use-promotions';

type ProductOption = { id: string; name: string };

type FormState = PromotionInput & { id?: string; keywordsText: string };

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  keywordsText: '',
  keywords: [],
  condition: '',
  discount: '',
  scope: 'all',
  productIds: [],
  status: 'active',
};

export default function PromotionsPage() {
  const { items, loading, saving, error, success, create, update, remove } =
    usePromotions();
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [editing, setEditing] = useState<FormState | null>(null);

  useEffect(() => {
    apiGet<ProductOption[]>('/products-services')
      .then((data) =>
        setProducts(data.map((p) => ({ id: p.id, name: p.name }))),
      )
      .catch(() => setProducts([]));
  }, []);

  async function handleSubmit() {
    if (!editing) return;

    const keywords = editing.keywordsText
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    const payload: PromotionInput = {
      name: editing.name.trim(),
      description: editing.description.trim(),
      keywords,
      condition: editing.condition.trim(),
      discount: editing.discount.trim(),
      scope: editing.scope,
      productIds: editing.scope === 'product' ? editing.productIds : [],
      status: editing.status,
    };

    if (!payload.name) return;

    const ok = editing.id
      ? await update(editing.id, payload)
      : await create(payload);

    if (ok) setEditing(null);
  }

  async function handleDelete(item: Promotion) {
    if (!confirm(`Xóa "${item.name}"?`)) return;
    await remove(item.id);
  }

  function toggleProduct(id: string) {
    if (!editing) return;
    const has = editing.productIds.includes(id);
    setEditing({
      ...editing,
      productIds: has
        ? editing.productIds.filter((x) => x !== id)
        : [...editing.productIds, id],
    });
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Khuyến mãi</h1>
        <Button onClick={() => setEditing({ ...EMPTY_FORM })}>
          + Thêm mới
        </Button>
      </div>

      {editing && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editing.id ? 'Sửa khuyến mãi' : 'Thêm khuyến mãi'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field
              label="Tên"
              value={editing.name}
              onChange={(v) => setEditing({ ...editing, name: v })}
              placeholder="Ví dụ: Sinh nhật giảm 20%"
            />
            <Field
              label="Mô tả"
              value={editing.description}
              onChange={(v) => setEditing({ ...editing, description: v })}
              placeholder="Mô tả ngắn"
            />
            <Field
              label="Từ khóa (phân cách bằng dấu phẩy)"
              value={editing.keywordsText}
              onChange={(v) => setEditing({ ...editing, keywordsText: v })}
              placeholder="Ví dụ: sinh nhật, birthday"
            />
            <Field
              label="Điều kiện"
              value={editing.condition}
              onChange={(v) => setEditing({ ...editing, condition: v })}
              placeholder="Ví dụ: Áp dụng trong tháng sinh nhật"
            />
            <Field
              label="Mức giảm"
              value={editing.discount}
              onChange={(v) => setEditing({ ...editing, discount: v })}
              placeholder="Ví dụ: 20% hoặc 30k"
            />

            <div className="space-y-1">
              <label className="text-sm font-medium">Phạm vi áp dụng</label>
              <select
                className="border rounded-md px-3 py-2 w-full bg-background"
                value={editing.scope}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    scope: e.target.value as 'all' | 'product',
                  })
                }
              >
                <option value="all">Tất cả sản phẩm / dịch vụ</option>
                <option value="product">Sản phẩm / dịch vụ cụ thể</option>
              </select>
            </div>

            {editing.scope === 'product' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Chọn sản phẩm / dịch vụ
                </label>
                {products.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Chưa có sản phẩm/dịch vụ nào. Thêm ở mục &quot;Sản phẩm / Dịch vụ&quot;.
                  </p>
                ) : (
                  <div className="border rounded-md p-3 space-y-2 max-h-60 overflow-y-auto">
                    {products.map((p) => (
                      <label
                        key={p.id}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={editing.productIds.includes(p.id)}
                          onChange={() => toggleProduct(p.id)}
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium">Trạng thái</label>
              <select
                className="border rounded-md px-3 py-2 w-full bg-background"
                value={editing.status}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    status: e.target.value as 'active' | 'inactive',
                  })
                }
              >
                <option value="active">Đang áp dụng</option>
                <option value="inactive">Ngừng áp dụng</option>
              </select>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditing(null)}
                disabled={saving}
              >
                Hủy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!editing && success && (
        <p className="text-sm text-green-600">{success}</p>
      )}
      {!editing && error && <p className="text-sm text-red-600">{error}</p>}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">Đang tải...</p>
          ) : items.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              Chưa có khuyến mãi nào.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="p-3">Tên</th>
                  <th className="p-3">Mức giảm</th>
                  <th className="p-3">Phạm vi</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="p-3">
                      <div className="font-medium">{item.name}</div>
                      {item.condition && (
                        <div className="text-xs text-muted-foreground">
                          {item.condition}
                        </div>
                      )}
                    </td>
                    <td className="p-3">{item.discount || '—'}</td>
                    <td className="p-3">
                      {item.scope === 'all' ? (
                        'Tất cả'
                      ) : (
                        <span>
                          {item.productIds.length} mục
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {item.status === 'active' ? (
                        <span className="text-green-600">Đang áp dụng</span>
                      ) : (
                        <span className="text-muted-foreground">
                          Ngừng áp dụng
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setEditing({
                            id: item.id,
                            name: item.name,
                            description: item.description,
                            keywordsText: item.keywords.join(', '),
                            keywords: item.keywords,
                            condition: item.condition,
                            discount: item.discount,
                            scope: item.scope,
                            productIds: item.productIds,
                            status: item.status,
                          })
                        }
                      >
                        Sửa
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(item)}
                        disabled={saving}
                      >
                        Xóa
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}