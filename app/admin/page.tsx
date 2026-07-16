'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingCart, DollarSign, Clock, TrendingUp, RefreshCw, Loader2, Table2, ListOrdered, BarChart3, ChefHat, Check, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

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

interface TableStatus {
  id: string
  tableNumber: number
  status: 'EMPTY' | 'ACTIVE' | 'DONE'
  orders: { id: string }[]
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardStats | null>(null)
  const [tableStatus, setTableStatus] = useState<TableStatus[]>([])
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

  const fetchTableStatus = async () => {
    try {
      const res = await fetch('/api/admin/floor')
      const json = await res.json()
      if (res.ok) {
        setTableStatus(json.tables || [])
      }
    } catch (error) {
      console.error('Failed to fetch table status:', error)
    }
  }

  useEffect(() => {
    fetchStats()
    fetchTableStatus()
    const interval = setInterval(() => {
      fetchStats()
      fetchTableStatus()
    }, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-red-100 text-red-700 border border-red-200'
      case 'PROCESSING':
        return 'bg-amber-100 text-amber-700 border border-amber-200'
      case 'READY':
        return 'bg-green-100 text-green-700 border border-green-200'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-700 border border-gray-200'
      default:
        return 'bg-neutral-100 text-neutral-700 border border-neutral-200'
    }
  }

  const getStatusBadgeDot = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-red-500'
      case 'PROCESSING':
        return 'bg-amber-500'
      case 'READY':
        return 'bg-green-500'
      case 'COMPLETED':
        return 'bg-gray-400'
      default:
        return 'bg-neutral-400'
    }
  }

  const getTableStatusStyle = (status: string) => {
    switch (status) {
      case 'EMPTY':
        return 'bg-neutral-50 border-neutral-200 text-neutral-600'
      case 'ACTIVE':
        return 'bg-orange-50 border-orange-300 text-orange-700'
      case 'DONE':
        return 'bg-green-50 border-green-300 text-green-700'
      default:
        return 'bg-neutral-50 border-neutral-200'
    }
  }

  const getTableDotStyle = (status: string) => {
    switch (status) {
      case 'EMPTY':
        return 'bg-neutral-400'
      case 'ACTIVE':
        return 'bg-orange-500 animate-pulse'
      case 'DONE':
        return 'bg-green-500'
      default:
        return 'bg-neutral-400'
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-admin-text-primary">Dashboard</h1>
          <p className="text-sm text-admin-text-secondary">Ringkasan aktivitas hari ini</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/tables" className="px-3 py-2 text-sm bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors font-medium">
            Setup Meja
          </Link>
          <button
            onClick={() => { fetchStats(); fetchTableStatus(); }}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-admin-text-secondary" />
          </button>
        </div>
      </div>

      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <Card className="border-l-4 border-l-primary-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-admin-text-secondary font-medium">Total Order</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-bold text-admin-text-primary">{stats.todayOrders}</span>
                  <span className="text-sm text-admin-text-secondary">order</span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {stats.orderChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                  )}
                  <span className={cn(
                    'text-sm font-medium',
                    stats.orderChange >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {stats.orderChange >= 0 ? '+' : ''}{stats.orderChange}%
                  </span>
                  <span className="text-sm text-admin-text-secondary">dari kemarin</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-admin-text-secondary font-medium">Revenue</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold text-admin-text-primary">
                    {stats.todayRevenue >= 1000000
                      ? `Rp ${(stats.todayRevenue / 1000000).toFixed(1)}jt`
                      : formatCurrency(stats.todayRevenue)}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {stats.revenueChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                  )}
                  <span className={cn(
                    'text-sm font-medium',
                    stats.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {stats.revenueChange >= 0 ? '+' : ''}{stats.revenueChange}%
                  </span>
                  <span className="text-sm text-admin-text-secondary">dari kemarin</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Orders */}
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-admin-text-secondary font-medium">Order Aktif</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-bold text-admin-text-primary">{stats.activeOrders}</span>
                  <span className="text-sm text-admin-text-secondary">sedang berjalan</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Best Seller */}
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-admin-text-secondary font-medium">Menu Terlaris</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-bold text-admin-text-primary">{stats.bestSeller.qty || '-'}</span>
                  <span className="text-sm text-admin-text-secondary">porsi</span>
                </div>
                <p className="text-sm text-admin-text-secondary mt-2 truncate max-w-[150px]">{stats.bestSeller.name || '-'}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Orders Feed */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <CardTitle className="text-lg">Order Terbaru</CardTitle>
              </div>
              <Link href="/admin/orders" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Lihat semua
              </Link>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-admin-text-secondary">Belum ada order hari ini</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.slice(0, 5).map((order, index) => (
                    <div
                      key={order.id}
                      className={cn(
                        'flex items-center justify-between p-4 rounded-xl border transition-all',
                        index === 0 && order.status === 'PENDING'
                          ? 'bg-red-50 border-red-200 animate-pulse-subtle'
                          : 'bg-white border-neutral-200 hover:border-primary-200'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg font-bold text-primary-700">{order.tableNumber}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-admin-text-primary">{order.orderNumber}</p>
                          <p className="text-sm text-admin-text-secondary">
                            Meja {order.tableNumber} · {order.timeAgo}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-admin-text-primary">
                            {formatCurrency(order.totalAmount)}
                          </p>
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
                            getStatusBadge(order.status)
                          )}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', getStatusBadgeDot(order.status))} />
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/admin/menu"
                  className="flex flex-col items-center gap-2 p-4 bg-neutral-50 rounded-xl hover:bg-primary-50 hover:border-primary-200 border border-transparent transition-all"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <ListOrdered className="w-6 h-6 text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-admin-text-primary">Menu</span>
                </Link>

                <Link
                  href="/admin/tables"
                  className="flex flex-col items-center gap-2 p-4 bg-neutral-50 rounded-xl hover:bg-primary-50 hover:border-primary-200 border border-transparent transition-all"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Table2 className="w-6 h-6 text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-admin-text-primary">Meja</span>
                </Link>

                <Link
                  href="/admin/orders"
                  className="flex flex-col items-center gap-2 p-4 bg-neutral-50 rounded-xl hover:bg-primary-50 hover:border-primary-200 border border-transparent transition-all"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-admin-text-primary">Orders</span>
                </Link>

                <Link
                  href="/admin/reports"
                  className="flex flex-col items-center gap-2 p-4 bg-neutral-50 rounded-xl hover:bg-primary-50 hover:border-primary-200 border border-transparent transition-all"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-admin-text-primary">Laporan</span>
                </Link>

                <a
                  href="/kitchen/warung-nusantara-sby"
                  target="_blank"
                  className="flex flex-col items-center gap-2 p-4 bg-neutral-50 rounded-xl hover:bg-amber-50 hover:border-amber-200 border border-transparent transition-all col-span-2"
                >
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <ChefHat className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-medium text-admin-text-primary">Kitchen Display</span>
                    <p className="text-xs text-admin-text-secondary">Buka di tab baru</p>
                  </div>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floor Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">Status Lantai</CardTitle>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-neutral-400 rounded-full"></div>
                <span className="text-admin-text-secondary">Kosong ({tableStatus.filter(t => t.status === 'EMPTY').length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-orange-500 rounded-full"></div>
                <span className="text-admin-text-secondary">Aktif ({tableStatus.filter(t => t.status === 'ACTIVE').length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                <span className="text-admin-text-secondary">Selesai ({tableStatus.filter(t => t.status === 'DONE').length})</span>
              </div>
            </div>
          </div>
          <Link href="/admin/floor" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Floor Monitor
          </Link>
        </CardHeader>
        <CardContent>
          {tableStatus.length === 0 ? (
            <div className="text-center py-8">
              <Table2 className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-admin-text-secondary">Belum ada meja. Setup meja terlebih dahulu.</p>
              <Link href="/admin/tables" className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
                Setup Meja
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
              {tableStatus.map((table) => (
                <Link
                  key={table.tableNumber}
                  href="/admin/tables"
                  className={cn(
                    'flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all hover:scale-105',
                    getTableStatusStyle(table.status)
                  )}
                >
                  <span className="text-2xl font-black">{table.tableNumber}</span>
                  <div className={cn('w-2 h-2 rounded-full mt-1', getTableDotStyle(table.status))} />
                  {table.orders.length > 0 && (
                    <span className="text-xs font-medium mt-1">{table.orders.length} order</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
