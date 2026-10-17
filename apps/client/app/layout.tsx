import { ClerkProvider } from '@clerk/nextjs';
import { shadcn } from '@clerk/ui/themes';
import { BusinessProvider } from '@/lib/business-context';
import { TokenRegistrar } from '@/components/token-registrar';
import './globals.css';
import '@clerk/ui/themes/shadcn.css';
import { Toaster } from 'sonner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <ClerkProvider appearance={{ theme: shadcn }}>
          <TokenRegistrar />
          <BusinessProvider>{children}
             <Toaster position="top-center" richColors />
          </BusinessProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}