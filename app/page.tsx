'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { config } from '@/lib/config'
import { formatCurrency } from '@/lib/utils'
import { ArrowRight, QrCode, UtensilsCrossed, Smartphone, CreditCard, Zap, CheckCircle } from 'lucide-react'
import { OrderTrackerFloatingButton } from '@/components/OrderTrackerFloatingButton'

interface MenuItem {
  id: string
  name: string
  basePrice: string
  photoUrl: string | null
}

export default function LandingPage() {
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedMenu()
  }, [])

  const fetchFeaturedMenu = async () => {
    try {
      const res = await fetch(`/api/public/menu/${config.outletSlug}`)
      const data = await res.json()

      if (res.ok && data.categories) {
        const items: MenuItem[] = []
        data.categories.slice(0, 2).forEach((cat: { items: MenuItem[] }) => {
          items.push(...cat.items.slice(0, 2))
        })
        setFeaturedItems(items.slice(0, 4))
      }
    } catch (error) {
      console.error('Failed to fetch menu:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Header */}
      <header className="px-4 py-5 border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-700 rounded-lg flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-neutral-900">Warung Nusantara</span>
              <p className="text-xs text-neutral-500 hidden sm:block">QR Table Ordering</p>
            </div>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-20 md:py-28 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
          Pesan makanan tanpa antri
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6 tracking-tight">
          Makan Enak,<br className="hidden sm:block" />
          <span className="text-primary-700">Tanpa Ribet</span>
        </h1>
        <p className="text-lg md:text-xl text-neutral-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Pesan makanan favorit Anda langsung dari meja. Scan QR, pilih menu, dan nikmati tanpa harus ke kasir.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
          <Link href="/scan" className="flex-1">
            <Button size="lg" className="w-full bg-primary-700 hover:bg-primary-800 text-white shadow-lg shadow-primary-700/25 h-14 text-base">
              <QrCode className="w-5 h-5 mr-2" />
              Scan QR Sekarang
            </Button>
          </Link>
          <Link href={`/m/${config.outletSlug}`} className="flex-1">
            <Button variant="outline" size="lg" className="w-full h-14 text-base border-2 border-neutral-300 hover:border-primary-500 hover:bg-primary-50">
              <UtensilsCrossed className="w-5 h-5 mr-2" />
              Lihat Menu
            </Button>
          </Link>
        </div>
      </section>

      {/* Hero Visual */}
      <section className="px-4 pb-20 max-w-4xl mx-auto">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary-100 via-primary-50 to-white border border-primary-200 h-72 md:h-96">
          {/* Decorative grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `linear-gradient(#C2410C 1px, transparent 1px), linear-gradient(90deg, #C2410C 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />

          {/* Central content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-md px-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-xl shadow-primary-700/30">
                <UtensilsCrossed className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-neutral-900 mb-2">Menu Lengkap</h3>
              <p className="text-sm md:text-base text-neutral-600">Makanan dan minuman segar untuk menemani hari Anda</p>
            </div>
          </div>

          {/* Floating cards - Desktop only */}
          <div className="hidden md:block absolute top-6 left-6 bg-white rounded-xl shadow-lg p-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">Order</p>
                <p className="text-xs text-success-600">Confirmed</p>
              </div>
            </div>
          </div>

          <div className="hidden md:block absolute bottom-6 right-6 bg-white rounded-xl shadow-lg p-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">Est. 10 min</p>
                <p className="text-xs text-neutral-500">Waktu tunggu</p>
              </div>
            </div>
          </div>

          {/* Mobile indicators - shown below central content */}
          <div className="absolute bottom-4 left-4 right-4 md:hidden flex justify-between">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success-600" />
              <span className="text-xs font-medium text-neutral-900">Confirmed</span>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary-600" />
              <span className="text-xs font-medium text-neutral-900">10 min</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Menu */}
      <section className="px-4 py-16 bg-white border-t border-neutral-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-3">Menu Favorit</h2>
            <p className="text-neutral-500">Pilihan terlaris dari pelanggan kami</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-neutral-100 rounded-xl h-56 md:h-64 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featuredItems.map((item) => (
                <Link key={item.id} href={`/m/${config.outletSlug}`} className="group">
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-neutral-200">
                    <div className="aspect-square bg-gradient-to-br from-neutral-50 to-neutral-100 relative">
                      {item.photoUrl ? (
                        <Image
                          src={item.photoUrl}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <UtensilsCrossed className="w-12 h-12 text-neutral-300" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-neutral-900 truncate mb-1">{item.name}</h3>
                      <p className="text-primary-700 font-bold">
                        {formatCurrency(parseFloat(item.basePrice))}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link href={`/m/${config.outletSlug}`}>
              <Button variant="link" className="text-primary-700 hover:text-primary-800 text-base gap-2">
                Lihat Semua Menu
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-20 bg-neutral-50 border-y border-neutral-200">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-3">Cara Kerja</h2>
            <p className="text-neutral-500">Tiga langkah mudah untuk memesan</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Step 1 */}
            <div className="text-center relative">
              <div className="w-16 h-16 bg-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-700/20">
                <QrCode className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold md:hidden">
                1
              </div>
              <h3 className="font-bold text-neutral-900 text-lg mb-2">Scan QR</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Scan kode QR yang tersedia di meja Anda menggunakan kamera smartphone
              </p>
            </div>

            {/* Connector */}
            <div className="hidden md:flex absolute left-1/3 top-8 w-[33%] justify-center">
              <div className="w-full h-0.5 bg-gradient-to-r from-primary-300 to-primary-200" />
            </div>

            {/* Step 2 */}
            <div className="text-center relative">
              <div className="w-16 h-16 bg-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-700/20">
                <UtensilsCrossed className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold md:hidden">
                2
              </div>
              <h3 className="font-bold text-neutral-900 text-lg mb-2">Pilih Menu</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Jelajahi menu digital dan pilih makanan serta minuman favorit Anda
              </p>
            </div>

            {/* Connector */}
            <div className="hidden md:flex absolute right-1/3 top-8 w-[33%] justify-center">
              <div className="w-full h-0.5 bg-gradient-to-r from-primary-200 to-primary-100" />
            </div>

            {/* Step 3 */}
            <div className="text-center relative">
              <div className="w-16 h-16 bg-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-700/20">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold md:hidden">
                3
              </div>
              <h3 className="font-bold text-neutral-900 text-lg mb-2">Pesanan Datang</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Tunggu di tempat duduk, pesanan akan diantar langsung ke meja Anda
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center p-4">
              <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-7 h-7 text-primary-700" />
              </div>
              <h4 className="font-semibold text-neutral-900 mb-1">Mobile First</h4>
              <p className="text-neutral-500 text-sm">Akses dari smartphone Anda</p>
            </div>
            <div className="text-center p-4">
              <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-7 h-7 text-primary-700" />
              </div>
              <h4 className="font-semibold text-neutral-900 mb-1">Pembayaran Mudah</h4>
              <p className="text-neutral-500 text-sm">Tunai atau QRIS</p>
            </div>
            <div className="text-center p-4">
              <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-primary-700" />
              </div>
              <h4 className="font-semibold text-neutral-900 mb-1">Real-time</h4>
              <p className="text-neutral-500 text-sm">Lacak status pesanan</p>
            </div>
            <div className="text-center p-4">
              <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-primary-700" />
              </div>
              <h4 className="font-semibold text-neutral-900 mb-1">Tanpa Antri</h4>
              <p className="text-neutral-500 text-sm">Pesan langsung dari meja</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 bg-primary-700">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Siap Memesan?
          </h2>
          <p className="text-primary-100 mb-8 text-lg">
            Scan QR code di meja Anda dan mulai pesan sekarang juga
          </p>
          <Link href="/scan">
            <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50 shadow-xl h-14 px-10 text-base font-semibold">
              <QrCode className="w-5 h-5 mr-2" />
              Scan QR Sekarang
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-12 bg-neutral-900 text-neutral-300">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-700 rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-white">Warung Nusantara</span>
                <p className="text-xs text-neutral-500">QR Table Ordering System</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-neutral-400 text-sm mb-1">
                Jl. Soekarno Hatta No. 123, Surabaya
              </p>
              <p className="text-neutral-500 text-xs">
                2026 Warung Nusantara. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Order Tracker Button */}
      <OrderTrackerFloatingButton />
    </div>
  )
}
