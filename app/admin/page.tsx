'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingCart, DollarSign, Clock, TrendingUp, RefreshCw, Loader2, Table2, ListOrdered, BarChart3 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface DashboardStats {
  stats: {
    todayOrders: number
    orderChange: number
    todayRevenue: number
    revenueChange: number
    avgWaitTime: number
    bestSeller: { name: string; qty: number }
    activeOrders: number
  }
  recentOrders: {
    id: string
    orderNumber: string
    tableNumber: number
    totalAmount: number
    status: string
    timeAgo: string
    itemCount: number
  }[]
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      const json = await res.json()
      if (res.ok) {
        setData(json)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-error-100 text-error-700'
      case 'PROCESSING':
        return 'bg-warning-50 text-warning-700'
      case 'READY':
        return 'bg-primary-100 text-primary-700'
      case 'COMPLETED':
        return 'bg-success-50 text-success-700'
      default:
        return 'bg-neutral-100 text-neutral-700'
    }
  }

  const { stats, recentOrders } = data || {
    stats: { todayOrders: 0, orderChange: 0, todayRevenue: 0, revenueChange: 0, avgWaitTime: 0, bestSeller: { name: '-', qty: 0 }, activeOrders: 0 },
    recentOrders: [],
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-700" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Demo Mode</p>
            <p className="text-sm text-primary-100">Warung Nusantara - QR Table Ordering System</p>
          </div>
          <div className="text-sm text-right">
            <p>{stats.activeOrders} order aktif</p>
            <p className="text-primary-200">real-time data</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-admin-text-secondary">
              Total Order (Hari Ini)
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary-700" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-admin-text-primary">{stats.todayOrders}</div>
            <p className={`text-xs mt-1 ${stats.orderChange >= 0 ? 'text-success-600' : 'text-error-600'}`}>
              {stats.orderChange >= 0 ? '+' : ''}{stats.orderChange}% dari kemarin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-admin-text-secondary">
              Revenue (Hari Ini)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary-700" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-admin-text-primary">
              {stats.todayRevenue >= 1000000
                ? `Rp ${(stats.todayRevenue / 1000000).toFixed(1)}jt`
                : formatCurrency(stats.todayRevenue)}
            </div>
            <p className={`text-xs mt-1 ${stats.revenueChange >= 0 ? 'text-success-600' : 'text-error-600'}`}>
              {stats.revenueChange >= 0 ? '+' : ''}{stats.revenueChange}% dari kemarin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-admin-text-secondary">
              Avg. Waktu Tunggu
            </CardTitle>
            <Clock className="h-4 w-4 text-primary-700" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-admin-text-primary">
              {stats.avgWaitTime > 0 ? `${stats.avgWaitTime}mnt` : '-'}
            </div>
            <p className="text-xs text-admin-text-secondary mt-1">Target: 15mnt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-admin-text-secondary">
              Menu Terlaris
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary-700" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-admin-text-primary">{stats.bestSeller.qty || '-'}</div>
            <p className="text-xs text-admin-text-secondary mt-1 truncate">{stats.bestSeller.name || '-'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/tables">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Table2 className="w-8 h-8 text-primary-700" />
                </div>
                <h3 className="font-semibold text-admin-text-primary mb-2">Meja & QR</h3>
                <p className="text-sm text-admin-text-secondary">
                  Generate & print QR code untuk meja
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/menu">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ListOrdered className="w-8 h-8 text-primary-700" />
                </div>
                <h3 className="font-semibold text-admin-text-primary mb-2">Kelola Menu</h3>
                <p className="text-sm text-admin-text-secondary">
                  Tambah, edit, atau toggle item habis
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/reports">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-primary-700" />
                </div>
                <h3 className="font-semibold text-admin-text-primary mb-2">Laporan</h3>
                <p className="text-sm text-admin-text-secondary">
                  Lihat laporan penjualan & analytics
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Order Terbaru</CardTitle>
          <button
            onClick={fetchStats}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-admin-text-secondary" />
          </button>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-admin-text-secondary">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada order hari ini</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-3 border-b border-neutral-200 last:border-0"
                >
                  <div>
                    <p className="font-medium text-admin-text-primary">{order.orderNumber}</p>
                    <p className="text-sm text-admin-text-secondary">
                      Meja {order.tableNumber} - {order.timeAgo}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-admin-text-primary">
                      {formatCurrency(order.totalAmount)}
                    </p>
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
