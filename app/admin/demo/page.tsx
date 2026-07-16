'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronRight, Play, CheckCircle2, Coffee, QrCode, Clock, BarChart3, Users, Zap, CreditCard } from 'lucide-react'
import { config } from '@/lib/config'

interface GuideStep {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  path: string
  cta: string
}

const guideSteps: GuideStep[] = [
  {
    id: 'scan-qr',
    icon: <QrCode className="w-6 h-6" />,
    title: '1. Scan QR Code',
    description: 'Tamu scan QR code yang terpasang di meja untuk membuka menu digital di browser HP mereka.',
    path: `/m/${config.outletSlug}`,
    cta: 'Lihat Demo Menu',
  },
  {
    id: 'order-flow',
    icon: <Coffee className="w-6 h-6" />,
    title: '2. Pilih & Pesan',
    description: 'Tamu browse menu, pilih item, tambahkan ke keranjang, dan kirim pesanan ke dapur.',
    path: `/m/${config.outletSlug}`,
    cta: 'Lihat Menu Digital',
  },
  {
    id: 'payment',
    icon: <CreditCard className="w-6 h-6" />,
    title: '3. Bayar',
    description: 'Pilih metode pembayaran: Tunai di kasir atau QRIS dengan scan langsung dari HP.',
    path: `/m/${config.outletSlug}/checkout`,
    cta: 'Demo Pembayaran',
  },
  {
    id: 'kitchen',
    icon: <Zap className="w-6 h-6" />,
    title: '4. Dapur Terima Order',
    description: 'Order langsung muncul di Kitchen Display System (KDS) dengan estimasi waktu tunggu.',
    path: `/kitchen/${config.outletSlug}`,
    cta: 'Lihat KDS',
  },
  {
    id: 'status',
    icon: <Clock className="w-6 h-6" />,
    title: '5. Pantau Status',
    description: 'Tamu bisa pantau pesanan mereka dari HP: Diterima → Diproses → Siap → Selesai.',
    path: `/m/${config.outletSlug}/status/demo`,
    cta: 'Demo Tracking',
  },
  {
    id: 'admin',
    icon: <BarChart3 className="w-6 h-6" />,
    title: '6. Monitor & Reports',
    description: 'Admin bisa lihat semua meja, atur menu, dan lihat laporan penjualan.',
    path: '/admin',
    cta: 'Buka Admin Panel',
  },
]

export default function DemoGuide() {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    // Auto-advance steps every 5 seconds
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % guideSteps.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-orange-600" />
            Demo Walkthrough
          </CardTitle>
          <CardDescription>
            Ikuti alur demo untuk melihat semua fitur sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {guideSteps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(index)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  activeStep === index
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${
                  activeStep === index ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {step.icon}
                </div>
                <p className="text-sm font-medium text-gray-900">{step.title}</p>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                {guideSteps[activeStep].icon}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {guideSteps[activeStep].title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {guideSteps[activeStep].description}
                </p>
                <a
                  href={guideSteps[activeStep].path}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    {guideSteps[activeStep].cta}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-semibold">Estimasi Waktu</h4>
            </div>
            <p className="text-sm text-gray-600">
              Tamu tahu berapa lama menunggu dengan estimasi real-time berdasarkan posisi antrean.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-semibold">Tanpa Install</h4>
            </div>
            <p className="text-sm text-gray-600">
              Tamu cukup scan QR - menu terbuka langsung di browser HP, tidak perlu download app.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="font-semibold">Real-time</h4>
            </div>
            <p className="text-sm text-gray-600">
              Update otomatis di semua layar - dapur, kasir, dan HP tamu sinkron secara instan.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold mb-3">Link Cepat Demo</h4>
        <div className="flex flex-wrap gap-2">
          <a href={`/m/${config.outletSlug}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <Coffee className="w-4 h-4 mr-2" />
              Menu Digital
            </Button>
          </a>
          <a href={`/kitchen/${config.outletSlug}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <Zap className="w-4 h-4 mr-2" />
              Kitchen Display
            </Button>
          </a>
          <a href="/admin" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Admin Panel
            </Button>
          </a>
          <a href="/admin/tables" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <QrCode className="w-4 h-4 mr-2" />
              Tables & QR
            </Button>
          </a>
        </div>
      </div>
    </div>
  )
}
