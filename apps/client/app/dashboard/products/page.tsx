"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ProductService,
  ProductServiceInput,
  useProductsServices,
} from "@/hooks/use-products-services";

type AttrType = "text" | "number" | "boolean" | "list";

type AttrRow = {
  key: string;
  type: AttrType;
  value: string;
};

type FormState = {
  id?: string;
  name: string;
  price: number;
  description: string;
  category: string;
  status: "active" | "inactive";
  attributes: AttrRow[];
};

const EMPTY_FORM: FormState = {
  name: "",
  price: 0,
  description: "",
  category: "",
  status: "active",
  attributes: [{ key: "", type: "text", value: "" }],
};

function inferType(v: unknown): AttrType {
  if (typeof v === "number") return "number";
  if (typeof v === "boolean") return "boolean";
  if (Array.isArray(v)) return "list";
  return "text";
}

function attributesToRows(
  attrs: Record<string, unknown> | null | undefined,
): AttrRow[] {
  if (!attrs || Object.keys(attrs).length === 0) {
    return [{ key: "", type: "text", value: "" }];
  }
  return Object.entries(attrs).map(([key, value]) => {
    const type = inferType(value);
    let strValue = "";
    if (type === "list" && Array.isArray(value)) {
      strValue = value.join(", ");
    } else if (value !== null && value !== undefined) {
      strValue = String(value);
    }
    return { key, type, value: strValue };
  });
}

function rowsToAttributes(rows: AttrRow[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const row of rows) {
    const key = row.key.trim();
    if (!key) continue;

    switch (row.type) {
      case "number": {
        const n = Number(row.value);
        result[key] = Number.isFinite(n) ? n : 0;
        break;
      }
      case "boolean":
        result[key] = row.value === "true";
        break;
      case "list":
        result[key] = row.value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        break;
      default:
        result[key] = row.value;
    }
  }
  return result;
}

export default function ProductsServicesPage() {
  const { items, loading, saving, error, success, create, update, remove } =
    useProductsServices();
  const [search, setSearch] = useState("");
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
      attributes: rowsToAttributes(editing.attributes),
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

  function updateAttrRow(index: number, patch: Partial<AttrRow>) {
    if (!editing) return;
    const next = [...editing.attributes];
    next[index] = { ...next[index], ...patch };
    setEditing({ ...editing, attributes: next });
  }

  function addAttrRow() {
    if (!editing) return;
    setEditing({
      ...editing,
      attributes: [...editing.attributes, { key: "", type: "text", value: "" }],
    });
  }

  function removeAttrRow(index: number) {
    if (!editing) return;
    const next = editing.attributes.filter((_, i) => i !== index);
    setEditing({
      ...editing,
      attributes:
        next.length > 0 ? next : [{ key: "", type: "text", value: "" }],
    });
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
              {editing.id ? "Sửa sản phẩm/dịch vụ" : "Thêm sản phẩm/dịch vụ"}
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
                    status: e.target.value as "active" | "inactive",
                  })
                }
              >
                <option value="active">Đang bán</option>
                <option value="inactive">Ngừng bán</option>
              </select>
            </div>

            {/* ===== Attributes section ===== */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Thuộc tính (dùng cho AI tư vấn)
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addAttrRow}
                >
                  + Thêm
                </Button>
              </div>

              <div className="space-y-2">
                {editing.attributes.map((row, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <Input
                      placeholder="key"
                      value={row.key}
                      onChange={(e) =>
                        updateAttrRow(index, { key: e.target.value })
                      }
                      className="flex-1"
                    />

                    <select
                      className="border rounded-md px-2 py-2 bg-background text-sm"
                      value={row.type}
                      onChange={(e) =>
                        updateAttrRow(index, {
                          type: e.target.value as AttrType,
                        })
                      }
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="list">List</option>
                    </select>

                    {row.type === "boolean" ? (
                      <select
                        className="border rounded-md px-2 py-2 bg-background text-sm flex-1"
                        value={row.value || "true"}
                        onChange={(e) =>
                          updateAttrRow(index, { value: e.target.value })
                        }
                      >
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    ) : (
                      <Input
                        placeholder={
                          row.type === "list"
                            ? "a, b, c"
                            : row.type === "number"
                              ? "0"
                              : "value"
                        }
                        value={row.value}
                        onChange={(e) =>
                          updateAttrRow(index, { value: e.target.value })
                        }
                        className="flex-1"
                      />
                    )}

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => removeAttrRow(index)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                Gợi ý: dùng key tiếng Việt dễ đọc (VD: <code>Độ ngọt</code>,{" "}
                <code>Thời lượng</code>, <code>Mục tiêu</code>). Ngoài ra, dùng
                key <code>suitableFor</code> / <code>notSuitableFor</code> (type
                List) để AI dùng khi tư vấn.
              </p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu"}
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
                  <th className="p-3">Thuộc tính</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const attrKeys = item.attributes
                    ? Object.keys(item.attributes)
                    : [];
                  return (
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
                        {item.price.toLocaleString("vi-VN")}đ
                      </td>
                      <td className="p-3">
                        {attrKeys.length === 0 ? (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {attrKeys.length} key
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {item.status === "active" ? (
                          <span className="text-green-600">Đang bán</span>
                        ) : (
                          <span className="text-muted-foreground">
                            Ngừng bán
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
                              price: item.price,
                              description: item.description,
                              category: item.category,
                              status: item.status,
                              attributes: attributesToRows(item.attributes),
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
                  );
                })}
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
  type = "text",
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
