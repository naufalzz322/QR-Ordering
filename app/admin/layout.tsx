'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Menu, Table2, ShoppingCart, BarChart3, Settings, LogOut, Monitor, Play, UtensilsCrossed, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ToastProvider, Toaster } from '@/components/ui/toast'
import { useSession, signOut } from 'next-auth/react'
import { useEffect } from 'react'

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/menu', icon: Menu, label: 'Menu' },
  { href: '/admin/tables', icon: Table2, label: 'Meja & QR' },
  { href: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { href: '/admin/floor', icon: Monitor, label: 'Floor Monitor' },
  { href: '/admin/reports', icon: BarChart3, label: 'Laporan' },
]

function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'unauthenticated' && !pathname.includes('/login')) {
      router.push('/login')
    }
  }, [status, router, pathname])

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-bg">
        <Loader2 className="w-8 h-8 animate-spin text-primary-700" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-admin-bg flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-admin-border flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-admin-border">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-admin-text-primary">QR Ordering</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive(item.href)
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-admin-text-secondary hover:bg-neutral-100'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}

            {/* Demo Guide Link */}
            <Link
              href="/admin/demo"
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border mt-4',
                isActive('/admin/demo')
                  ? 'bg-primary-50 text-primary-700 font-medium border-primary-200'
                  : 'bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100'
              )}
            >
              <Play className="w-5 h-5" />
              <span className="font-medium">Demo Guide</span>
            </Link>
          </nav>

          {/* Bottom section - sticky */}
          <div className="p-4 border-t border-admin-border bg-white space-y-1">
            <Link
              href="/admin/settings"
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive('/admin/settings')
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-admin-text-secondary hover:bg-neutral-100'
              )}
            >
              <Settings className="w-5 h-5" />
              <span>Pengaturan</span>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-error-600 hover:bg-error-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Keluar</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1">
          {/* Header */}
          <header className="bg-white border-b border-admin-border px-8 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-admin-text-primary">
              Admin Warung Nusantara
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-admin-text-secondary">
                {session?.user?.email || 'admin@warungnusantara.com'}
              </span>
            </div>
          </header>

          {/* Page content */}
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </ToastProvider>
  )
}

export default AdminLayout
