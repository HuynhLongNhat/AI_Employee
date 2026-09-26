'use client';

import nestjsxDataProvider from '@refinedev/nestjsx-crud';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const dataProvider = nestjsxDataProvider(API_URL);