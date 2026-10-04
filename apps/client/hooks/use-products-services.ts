'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';

export type ProductService = {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
};

export type ProductServiceInput = {
  name: string;
  price: number;
  description: string;
  category: string;
  status: 'active' | 'inactive';
};

export function useProductsServices() {
  const [items, setItems] = useState<ProductService[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Load effect — setState chỉ trong .then/.catch/.finally (async)
  useEffect(() => {
    let cancelled = false;

    apiGet<ProductService[]>('/products-services')
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Load failed');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const reload = useCallback(() => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  const create = useCallback(
    async (input: ProductServiceInput) => {
      setSaving(true);
      setError(null);
      setSuccess(null);
      try {
        await apiPost<ProductService>('/products-services', input);
        setSuccess('Đã thêm sản phẩm/dịch vụ.');
        reload();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Create failed');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  const update = useCallback(
    async (id: string, input: Partial<ProductServiceInput>) => {
      setSaving(true);
      setError(null);
      setSuccess(null);
      try {
        await apiPatch<ProductService>(`/products-services/${id}`, input);
        setSuccess('Đã cập nhật.');
        reload();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Update failed');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  const remove = useCallback(
    async (id: string) => {
      setSaving(true);
      setError(null);
      setSuccess(null);
      try {
        await apiDelete(`/products-services/${id}`);
        setSuccess('Đã xóa.');
        reload();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  return {
    items,
    loading,
    saving,
    error,
    success,
    create,
    update,
    remove,
    reload,
  };
}