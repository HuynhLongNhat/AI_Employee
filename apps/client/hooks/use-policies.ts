'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';

export type PolicyBundle = {
  order: string;
  delivery: string;
  payment: string;
  cancel: string;
  refund: string;
};

const EMPTY: PolicyBundle = {
  order: '',
  delivery: '',
  payment: '',
  cancel: '',
  refund: '',
};

export function usePolicies() {
  const [form, setForm] = useState<PolicyBundle>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    apiGet<Record<string, string | null>>('/business-knowledge/policies')
      .then((data) => {
        if (cancelled) return;
        setForm({
          order: data.order ?? '',
          delivery: data.delivery ?? '',
          payment: data.payment ?? '',
          cancel: data.cancel ?? '',
          refund: data.refund ?? '',
        });
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

  async function save() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await apiPost('/business-knowledge/policies', form);
      setSuccess('Đã lưu thay đổi.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function update<K extends keyof PolicyBundle>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return {
    form,
    loading,
    saving,
    error,
    success,
    update,
    save,
    reload: () => setReloadKey((k) => k + 1),
  };
}