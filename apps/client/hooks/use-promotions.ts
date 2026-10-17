'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import { useBusinessContext } from '@/lib/business-context';

export type Promotion = {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  condition: string;
  discount: string;
  scope: 'all' | 'product';
  productIds: string[];
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
};

export type PromotionInput = {
  name: string;
  description: string;
  keywords: string[];
  condition: string;
  discount: string;
  scope: 'all' | 'product';
  productIds: string[];
  status: 'active' | 'inactive';
};

export function usePromotions() {
  const { isLoaded, isSignedIn } = useAuth();
  const { activeId } = useBusinessContext();
  const [items, setItems] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    if (!activeId) return;

    let cancelled = false;
    queueMicrotask(() => setLoading(true));

    apiGet<Promotion[]>('/promotions')
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
  }, [reloadKey, isLoaded, isSignedIn, activeId]);

  const reload = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const create = useCallback(
    async (input: PromotionInput) => {
      setSaving(true);
      setError(null);
      setSuccess(null);
      try {
        await apiPost<Promotion>('/promotions', input);
        setSuccess('Đã thêm khuyến mãi.');
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
    async (id: string, input: Partial<PromotionInput>) => {
      setSaving(true);
      setError(null);
      setSuccess(null);
      try {
        await apiPatch<Promotion>(`/promotions/${id}`, input);
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
        await apiDelete(`/promotions/${id}`);
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