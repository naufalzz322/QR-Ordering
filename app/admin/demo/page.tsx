'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, Coffee, QrCode, Monitor, BarChart3, Clock, Users, Zap, ArrowRight, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { config } from '@/lib/config'

const flowSteps = [
  {
    step: 1,
    title: 'Scan QR',
    description: 'Tamu scan QR code di meja untuk buka menu digital',
    icon: QrCode,
    color: 'bg-primary-100 text-primary-600',
  },
  {
    step: 2,
    title: 'Pilih Menu',
    description: 'Browse menu, tambah ke keranjang, isi catatan jika perlu',
    icon: Coffee,
    color: 'bg-green-100 text-green-600',
  },
  {
    step: 3,
    title: 'Bayar',
    description: 'Pilih metode: Tunai atau QRIS',
    icon: Zap,
    color: 'bg-amber-100 text-amber-600',
  },
  {
    step: 4,
    title: 'Dapur Terima',
    description: 'Order masuk ke Kitchen Display secara real-time',
    icon: Monitor,
    color: 'bg-orange-100 text-orange-600',
  },
  {
    step: 5,
    title: 'Pantau Status',
    description: 'Tamu cek status pesanan dari HP mereka',
    icon: Clock,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    step: 6,
    title: 'Selesai',
    description: 'Pesanan siap, tamu notified untuk mengambil',
    icon: CheckCircle2,
    color: 'bg-emerald-100 text-emerald-600',
  },
]

const quickLinks = [
  {
    title: 'Menu Digital',
    description: 'Lihat tampilan menu di HP tamu',
    href: `/m/${config.outletSlug}`,
    icon: Coffee,
    color: 'bg-primary-100 text-primary-600',
  },
  {
    title: 'Kitchen Display',
    description: 'Monitor pesanan untuk dapur',
    href: `/kitchen/${config.outletSlug}`,
    icon: Monitor,
    color: 'bg-orange-100 text-orange-600',
  },
  {
    title: 'Admin Panel',
    description: 'Kelola menu, meja, dan lihat laporan',
    href: '/admin',
    icon: BarChart3,
    color: 'bg-green-100 text-green-600',
  },
  {
    title: 'Tables & QR',
    description: 'Setup meja dan generate QR code',
    href: '/admin/tables',
    icon: QrCode,
    color: 'bg-purple-100 text-purple-600',
  },
]

const features = [
  {
    title: 'Tanpa Install',
    description: 'Buka langsung di browser HP, tidak perlu download app',
    icon: Users,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Real-time',
    description: 'Update otomatis ke semua layar secara instan',
    icon: Zap,
    color: 'bg-green-50 text-green-600',
  },
  {
    title: 'Estimasi Waktu',
    description: 'Tamu tahu kapan pesanan mereka selesai',
    icon: Clock,
    color: 'bg-amber-50 text-amber-600',
  },
]

export default function DemoGuide() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-admin-text-primary">Demo Guide</h1>
        <p className="text-sm text-admin-text-secondary">Ikuti alur sistem QR Ordering dari awal hingga selesai</p>
      </div>

      {/* Flow Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alur Sistem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {flowSteps.map((step, index) => (
              <div key={step.step} className="relative">
                <div className={cn(
                  'rounded-xl p-4 text-center transition-all',
                  'bg-white border border-neutral-200 hover:border-primary-200 hover:shadow-sm'
                )}>
                  <div className={cn('w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center', step.color)}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-admin-text-secondary mb-1">Step {step.step}</p>
                  <p className="font-semibold text-admin-text-primary text-sm">{step.title}</p>
                  <p className="text-xs text-admin-text-secondary mt-1 hidden lg:block">{step.description}</p>
                </div>
                {index < flowSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight className="w-4 h-4 text-neutral-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Access */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Demo Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className={cn(
                  'rounded-xl p-5 transition-all',
                  'bg-neutral-50 border border-neutral-200',
                  'hover:bg-primary-50 hover:border-primary-200 hover:shadow-sm'
                )}>
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', link.color)}>
                      <link.icon className="w-5 h-5" />
                    </div>
                    <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-primary-600 transition-colors" />
                  </div>
                  <p className="font-semibold text-admin-text-primary">{link.title}</p>
                  <p className="text-sm text-admin-text-secondary mt-1">{link.description}</p>
                </div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((feature) => (
          <div key={feature.title} className={cn(
            'rounded-xl p-4 border border-neutral-200',
            feature.color
          )}>
            <div className="flex items-center gap-3 mb-2">
              <feature.icon className="w-5 h-5" />
              <span className="font-semibold">{feature.title}</span>
            </div>
            <p className="text-sm opacity-80">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
