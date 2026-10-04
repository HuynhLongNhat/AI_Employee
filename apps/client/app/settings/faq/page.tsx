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
import { Faq, FaqInput, useFaqs } from '@/hooks/use-faqs';

type FormState = FaqInput & { id?: string };

const EMPTY_FORM: FormState = {
  question: '',
  answer: '',
  status: 'active',
};

export default function FaqPage() {
  const { items, loading, saving, error, success, create, update, remove } =
    useFaqs();
  const [editing, setEditing] = useState<FormState | null>(null);

  async function handleSubmit() {
    if (!editing) return;

    const payload: FaqInput = {
      question: editing.question.trim(),
      answer: editing.answer.trim(),
      status: editing.status,
    };

    if (!payload.question || !payload.answer) return;

    const ok = editing.id
      ? await update(editing.id, payload)
      : await create(payload);

    if (ok) setEditing(null);
  }

  async function handleDelete(item: Faq) {
    if (!confirm(`Xóa FAQ "${item.question}"?`)) return;
    await remove(item.id);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">FAQ / Knowledge</h1>
        <Button onClick={() => setEditing({ ...EMPTY_FORM })}>
          + Thêm FAQ
        </Button>
      </div>

      {editing && (
        <Card>
          <CardHeader>
            <CardTitle>{editing.id ? 'Sửa FAQ' : 'Thêm FAQ'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Câu hỏi</label>
              <Input
                value={editing.question}
                onChange={(e) =>
                  setEditing({ ...editing, question: e.target.value })
                }
                placeholder="Ví dụ: Quán có giao hàng không?"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Câu trả lời</label>
              <textarea
                className="border rounded-md px-3 py-2 w-full bg-background min-h-[80px] text-sm"
                value={editing.answer}
                onChange={(e) =>
                  setEditing({ ...editing, answer: e.target.value })
                }
                placeholder="Ví dụ: Có, quán giao trong bán kính 5km."
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
              Chưa có FAQ nào.
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-medium">{item.question}</div>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {item.answer}
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
                          question: item.question,
                          answer: item.answer,
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