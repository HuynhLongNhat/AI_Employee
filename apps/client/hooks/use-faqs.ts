'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';

export type Faq = {
  id: string;
  question: string;
  answer: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
};

export type FaqInput = {
  question: string;
  answer: string;
  status: 'active' | 'inactive';
};

export function useFaqs() {
  const [items, setItems] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    apiGet<Faq[]>('/faqs')
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
    async (input: FaqInput) => {
      setSaving(true);
      setError(null);
      setSuccess(null);
      try {
        await apiPost<Faq>('/faqs', input);
        setSuccess('Đã thêm FAQ.');
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
    async (id: string, input: Partial<FaqInput>) => {
      setSaving(true);
      setError(null);
      setSuccess(null);
      try {
        await apiPatch<Faq>(`/faqs/${id}`, input);
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
        await apiDelete(`/faqs/${id}`);
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