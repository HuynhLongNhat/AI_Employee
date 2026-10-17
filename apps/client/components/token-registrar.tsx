'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { setTokenGetter } from '@/lib/api';

export function TokenRegistrar() {
  const { getToken, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    setTokenGetter(() => getToken());
  }, [getToken, isLoaded]);

  return null;
}