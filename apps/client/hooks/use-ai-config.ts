'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';

export type AiPermissions = {
  canAdvise: boolean;
  canPlaceOrder: boolean;
  canHandleIssue: boolean;
};

export type AiConfigForm = {
  name: string;
  role: string;
  style: string;
  permissions: AiPermissions;
};

const EMPTY: AiConfigForm = {
  name: '',
  role: 'consultant',
  style: 'friendly',
  permissions: {
    canAdvise: true,
    canPlaceOrder: true,
    canHandleIssue: true,
  },
};

type AiConfigResponse = {
  name: string | null;
  role: string | null;
  style: string | null;
  permissions: AiPermissions | null;
};

export function useAiConfig() {
  const [form, setForm] = useState<AiConfigForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    apiGet<AiConfigResponse>('/business-knowledge/ai-config')
      .then((data) => {
        if (cancelled) return;
        setForm({
          name: data.name ?? '',
          role: data.role ?? 'consultant',
          style: data.style ?? 'friendly',
          permissions: data.permissions ?? EMPTY.permissions,
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
      await apiPost('/business-knowledge/ai-config', {
        name: form.name,
        role: form.role,
        style: form.style,
        permissions: form.permissions,
      });
      setSuccess('Đã lưu cấu hình.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function update<K extends keyof AiConfigForm>(key: K, value: AiConfigForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function togglePermission(key: keyof AiPermissions) {
    setForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key],
      },
    }));
  }

  return {
    form,
    loading,
    saving,
    error,
    success,
    update,
    togglePermission,
    save,
    reload: () => setReloadKey((k) => k + 1),
  };
}