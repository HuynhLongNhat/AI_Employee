'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';

export type BusinessKnowledge = {
  businessName: string;
  address: string;
  openingHours: string;
  phone: string;
  wifiName: string;
  wifiPassword: string;
  parking: string;
};

const EMPTY: BusinessKnowledge = {
  businessName: '',
  address: '',
  openingHours: '',
  phone: '',
  wifiName: '',
  wifiPassword: '',
  parking: '',
};

export function useBusinessKnowledge() {
  const [form, setForm] = useState<BusinessKnowledge>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [
          nameRes,
          addressRes,
          hoursRes,
          phoneRes,
          wifiNameRes,
          wifiPasswordRes,
          parkingRes,
        ] = await Promise.all([
          apiGet<{ businessName: string | null }>(
            '/business-knowledge/business-name',
          ),
          apiGet<{ address: string | null }>('/business-knowledge/address'),
          apiGet<{ openingHours: string | null }>(
            '/business-knowledge/opening-hours',
          ),
          apiGet<{ phone: string | null }>('/business-knowledge/phone'),
          apiGet<{ wifiName: string | null }>(
            '/business-knowledge/wifi-name',
          ),
          apiGet<{ wifiPassword: string | null }>(
            '/business-knowledge/wifi-password',
          ),
          apiGet<{ parking: string | null }>('/business-knowledge/parking'),
        ]);

        if (cancelled) return;

        setForm({
          businessName: nameRes.businessName ?? '',
          address: addressRes.address ?? '',
          openingHours: hoursRes.openingHours ?? '',
          phone: phoneRes.phone ?? '',
          wifiName: wifiNameRes.wifiName ?? '',
          wifiPassword: wifiPasswordRes.wifiPassword ?? '',
          parking: parkingRes.parking ?? '',
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Lỗi không xác định.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback(
    <K extends keyof BusinessKnowledge>(
      key: K,
      value: BusinessKnowledge[K],
    ) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await Promise.all([
        apiPost('/business-knowledge/business-name', {
          businessName: form.businessName.trim(),
        }),
        apiPost('/business-knowledge/address', {
          address: form.address.trim(),
        }),
        apiPost('/business-knowledge/opening-hours', {
          openingHours: form.openingHours.trim(),
        }),
        apiPost('/business-knowledge/phone', {
          phone: form.phone.trim(),
        }),
        apiPost('/business-knowledge/wifi-name', {
          wifiName: form.wifiName.trim(),
        }),
        apiPost('/business-knowledge/wifi-password', {
          wifiPassword: form.wifiPassword.trim(),
        }),
        apiPost('/business-knowledge/parking', {
          parking: form.parking.trim(),
        }),
      ]);

      setSuccess('Đã lưu thay đổi.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định.');
    } finally {
      setSaving(false);
    }
  }, [form]);

  return {
    form,
    loading,
    saving,
    error,
    success,
    update,
    save,
  };
}