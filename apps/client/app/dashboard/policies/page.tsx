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
import { Policy, PolicyInput, usePolicies } from '@/hooks/use-policies';

type FormState = PolicyInput & { id?: string };

const EMPTY_FORM: FormState = {
  title: '',
  content: '',
  status: 'active',
};

export default function PoliciesPage() {
  const { items, loading, saving, error, success, create, update, remove } =
    usePolicies();
  const [editing, setEditing] = useState<FormState | null>(null);

  async function handleSubmit() {
    if (!editing) return;

    const payload: PolicyInput = {
      title: editing.title.trim(),
      content: editing.content.trim(),
      status: editing.status,
    };

    if (!payload.title || !payload.content) return;

    const ok = editing.id
      ? await update(editing.id, payload)
      : await create(payload);

    if (ok) setEditing(null);
  }

  async function handleDelete(item: Policy) {
    if (!confirm(`Xóa chính sách "${item.title}"?`)) return;
    await remove(item.id);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Chính sách</h1>
        <Button onClick={() => setEditing({ ...EMPTY_FORM })}>
          + Thêm chính sách
        </Button>
      </div>

      {editing && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editing.id ? 'Sửa chính sách' : 'Thêm chính sách'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Tiêu đề</label>
              <Input
                value={editing.title}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
                placeholder="Ví dụ: Chính sách hoàn tiền"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Nội dung</label>
              <textarea
                className="border rounded-md px-3 py-2 w-full bg-background min-h-[120px] text-sm"
                value={editing.content}
                onChange={(e) =>
                  setEditing({ ...editing, content: e.target.value })
                }
                placeholder="Nhập nội dung chính sách"
              />
            </div>

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
                <option value="active">Đang dùng</option>
                <option value="inactive">Ngừng dùng</option>
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

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Chưa có chính sách nào.
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {item.content}
                    </div>
                    <div className="text-xs">
                      {item.status === 'active' ? (
                        <span className="text-green-600">Đang dùng</span>
                      ) : (
                        <span className="text-muted-foreground">Ngừng dùng</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setEditing({
                          id: item.id,
                          title: item.title,
                          content: item.content,
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}