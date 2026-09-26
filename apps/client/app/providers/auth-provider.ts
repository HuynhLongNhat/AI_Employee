'use client';

import { AuthProvider } from '@refinedev/core';

export const authProvider: AuthProvider = {
  login: async () => ({ success: true, redirectTo: '/' }),
  logout: async () => ({ success: true, redirectTo: '/login' }),
  check: async () => ({ authenticated: true }),
  getIdentity: async () => ({ id: 1, name: 'Admin' }),
  onError: async (error) => {
    // Xử lý lỗi API — có thể thêm logic refresh token, logout khi 401
    return {};
  },
};