'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  ProductService,
  ProductServiceInput,
  useProductsServices,
} from '@/hooks/use-products-services';

type FormState = ProductServiceInput & { id?: string };

const EMPTY_FORM: FormState = {
  name: '',
  price: 0,
  description: '',
  category: '',
  status: 'active',
};

export default function ProductsServicesPage() {
  const { items, loading, saving, error, success, create, update, remove } =
    useProductsServices();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<FormState | null>(null);

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleSubmit() {
    if (!editing) return;

    const payload: ProductServiceInput = {
      name: editing.name.trim(),
      price: Number(editing.price) || 0,
      description: editing.description.trim(),
      category: editing.category.trim(),
      status: editing.status,
    };

    if (!payload.name) return;

    const ok = editing.id
      ? await update(editing.id, payload)
      : await create(payload);

    if (ok) setEditing(null);
  }

  async function handleDelete(item: ProductService) {
    if (!confirm(`Xóa "${item.name}"?`)) return;
    await remove(item.id);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sản phẩm / Dịch vụ</h1>
        <Button onClick={() => setEditing({ ...EMPTY_FORM })}>
          + Thêm mới
        </Button>
      </div>

      {editing && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editing.id ? 'Sửa sản phẩm/dịch vụ' : 'Thêm sản phẩm/dịch vụ'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field
              label="Tên"
              value={editing.name}
              onChange={(v) => setEditing({ ...editing, name: v })}
              placeholder="Ví dụ: Cà phê sữa"
            />
            <Field
              label="Giá"
              type="number"
              value={String(editing.price)}
              onChange={(v) =>
                setEditing({ ...editing, price: Number(v) || 0 })
              }
              placeholder="Ví dụ: 30000"
            />
            <Field
              label="Mô tả"
              value={editing.description}
              onChange={(v) => setEditing({ ...editing, description: v })}
              placeholder="Mô tả ngắn"
            />
            <Field
              label="Danh mục"
              value={editing.category}
              onChange={(v) => setEditing({ ...editing, category: v })}
              placeholder="Ví dụ: Cà phê, Massage, ..."
            />
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
                <option value="active">Đang bán</option>
                <option value="inactive">Ngừng bán</option>
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
      {!editing && error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <Input
        placeholder="Tìm kiếm..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">Đang tải...</p>
          ) : filtered.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              Chưa có sản phẩm/dịch vụ nào.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="p-3">Tên</th>
                  <th className="p-3">Giá</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="p-3">
                      <div className="font-medium">{item.name}</div>
                      {item.category && (
                        <div className="text-xs text-muted-foreground">
                          {item.category}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      {item.price.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="p-3">
                      {item.status === 'active' ? (
                        <span className="text-green-600">Đang bán</span>
                      ) : (
                        <span className="text-muted-foreground">Ngừng bán</span>
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
                            price: item.price,
                            description: item.description,
                            category: item.category,
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
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}