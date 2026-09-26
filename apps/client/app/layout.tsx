'use client';

import './globals.css';
import { Refine } from '@refinedev/core';
import routerProvider from '@refinedev/nextjs-router';
import { dataProvider } from './providers/data-provider';
import { authProvider } from './providers/auth-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <Refine
          routerProvider={routerProvider}
          dataProvider={dataProvider}
          authProvider={authProvider}
          resources={[
            {
              name: 'leads',
              list: '/leads',
              create: '/leads/create',
              edit: '/leads/edit/:id',
              show: '/leads/show/:id',
            },
          ]}
        >
          {children}
        </Refine>
      </body>
    </html>
  );
}