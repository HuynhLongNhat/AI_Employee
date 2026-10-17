"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { useBusinessContext } from "@/lib/business-context";

export type BusinessKnowledge = {
  businessName: string;
  address: string;
  openingHours: string;
  phone: string;
  wifiName: string;
  wifiPassword: string;
  industry: string;
  businessTerm: string;
  customerTerm: string;
  productTerm: string;
};

const EMPTY: BusinessKnowledge = {
  businessName: "",
  address: "",
  openingHours: "",
  phone: "",
  wifiName: "",
  wifiPassword: "",
  industry: "",
  businessTerm: "",
  customerTerm: "",
  productTerm: "",
};

type BusinessProfileResponse = {
  industry: string | null;
  terminology: {
    businessTerm: string | null;
    customerTerm: string | null;
    productTerm: string | null;
  };
};

export function useBusinessKnowledge() {
  const { isLoaded, isSignedIn } = useAuth();
  const { activeId } = useBusinessContext();

  const [form, setForm] = useState<BusinessKnowledge>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    if (!activeId) return;

    let cancelled = false;
    queueMicrotask(() => {
      setLoading(true);
      setError(null);
    });

    (async () => {
      try {
        const [
          nameRes,
          addressRes,
          hoursRes,
          phoneRes,
          wifiNameRes,
          wifiPasswordRes,
          profileRes,
        ] = await Promise.all([
          apiGet<{ businessName: string | null }>(
            "/business-knowledge/business-name",
          ),
          apiGet<{ address: string | null }>("/business-knowledge/address"),
          apiGet<{ openingHours: string | null }>(
            "/business-knowledge/opening-hours",
          ),
          apiGet<{ phone: string | null }>("/business-knowledge/phone"),
          apiGet<{ wifiName: string | null }>("/business-knowledge/wifi-name"),
          apiGet<{ wifiPassword: string | null }>(
            "/business-knowledge/wifi-password",
          ),
          apiGet<BusinessProfileResponse>(
            "/business-knowledge/business-profile",
          ),
        ]);

        if (cancelled) return;

        setForm({
          businessName: nameRes.businessName ?? "",
          address: addressRes.address ?? "",
          openingHours: hoursRes.openingHours ?? "",
          phone: phoneRes.phone ?? "",
          wifiName: wifiNameRes.wifiName ?? "",
          wifiPassword: wifiPasswordRes.wifiPassword ?? "",
          industry: profileRes.industry ?? "",
          businessTerm: profileRes.terminology.businessTerm ?? "",
          customerTerm: profileRes.terminology.customerTerm ?? "",
          productTerm: profileRes.terminology.productTerm ?? "",
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Lỗi không xác định.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeId, isLoaded, isSignedIn]);

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
        apiPost("/business-knowledge/business-name", {
          businessName: form.businessName.trim(),
        }),
        apiPost("/business-knowledge/address", {
          address: form.address.trim(),
        }),
        apiPost("/business-knowledge/opening-hours", {
          openingHours: form.openingHours.trim(),
        }),
        apiPost("/business-knowledge/phone", {
          phone: form.phone.trim(),
        }),
        apiPost("/business-knowledge/wifi-name", {
          wifiName: form.wifiName.trim(),
        }),
        apiPost("/business-knowledge/wifi-password", {
          wifiPassword: form.wifiPassword.trim(),
        }),
        apiPost("/business-knowledge/business-profile", {
          industry: form.industry.trim(),
          terminology: {
            businessTerm: form.businessTerm.trim(),
            customerTerm: form.customerTerm.trim(),
            productTerm: form.productTerm.trim(),
          },
        }),
      ]);

      setSuccess("Đã lưu thay đổi.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định.");
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