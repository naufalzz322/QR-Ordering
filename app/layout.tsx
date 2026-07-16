import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { ToastClientProvider } from '@/components/toast-client-provider'
import { Toaster } from '@/components/ui/toast'

export const metadata: Metadata = {
  title: 'Warung Nusantara - QR Table Ordering',
  description: 'Pesan makanan dan minuman favorit Anda langsung dari meja',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>
        <Providers>
          <ToastClientProvider>
            {children}
            <Toaster />
          </ToastClientProvider>
        </Providers>
      </body>
    </html>
  )
}
