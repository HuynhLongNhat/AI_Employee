'use client';

import { useAuth } from '@clerk/nextjs';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { apiGet, apiPost, apiPatch, apiDelete, setActiveBusinessId } from '@/lib/api';

export type Business = {
  id: string;
  ownerUserId: string;
  name: string;
  industry: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

type Ctx = {
  businesses: Business[];
  activeId: string | null;
  loading: boolean;
  switchBusiness: (id: string) => void;
  createBusiness: (data: { name: string; industry?: string }) => Promise<Business>;
  updateBusiness: (id: string, data: { name?: string; industry?: string }) => Promise<Business>;
  deleteBusiness: (id: string) => Promise<void>;
};

const BusinessContext = createContext<Ctx | null>(null);
const STORAGE_KEY = 'activeBusinessId';

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      queueMicrotask(() => {
        setBusinesses([]);
        setActiveId(null);
        setActiveBusinessId(null);
        setLoading(false);
      });
      return;
    }

    let cancelled = false;

    apiGet<Business[]>('/businesses/me')
      .then((data) => {
        if (cancelled) return;
        setBusinesses(data);

        const stored = window.localStorage.getItem(STORAGE_KEY);
        const valid = data.find((b) => b.id === stored);
        const next = valid ? stored : data[0]?.id ?? null;

        if (next) window.localStorage.setItem(STORAGE_KEY, next);
        setActiveId(next);
        setActiveBusinessId(next);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setActiveId(e.newValue);
        setActiveBusinessId(e.newValue);
      }
    };

    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [isLoaded, isSignedIn]);

  const switchBusiness = useCallback((id: string) => {
    window.localStorage.setItem(STORAGE_KEY, id);
    setActiveBusinessId(id);
    setActiveId(id);
  }, []);

  const createBusiness = useCallback(
    async (data: { name: string; industry?: string }) => {
      const biz = await apiPost<Business>('/businesses', data);
      setBusinesses((prev) => [...prev, biz]);
      window.localStorage.setItem(STORAGE_KEY, biz.id);
      setActiveBusinessId(biz.id);
      setActiveId(biz.id);
      return biz;
    },
    [],
  );

  const updateBusiness = useCallback(
    async (id: string, data: { name?: string; industry?: string }) => {
      const updated = await apiPatch<Business>(`/businesses/${id}`, data);
      setBusinesses((prev) => prev.map((b) => (b.id === id ? updated : b)));
      return updated;
    },
    [],
  );

  const deleteBusiness = useCallback(
    async (id: string) => {
      await apiDelete(`/businesses/${id}`);
      setBusinesses((prev) => {
        const next = prev.filter((b) => b.id !== id);
        // Nếu xóa trúng business đang active, tự động chuyển sang business khác
        if (activeId === id && next.length > 0) {
          window.localStorage.setItem(STORAGE_KEY, next[0].id);
          setActiveBusinessId(next[0].id);
          setActiveId(next[0].id);
        }
        return next;
      });
    },
    [activeId],
  );

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        activeId,
        loading,
        switchBusiness,
        createBusiness,
        updateBusiness,
        deleteBusiness,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusinessContext() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error('useBusinessContext must be inside BusinessProvider');
  return ctx;
}