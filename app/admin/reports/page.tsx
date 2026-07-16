'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, RefreshCw, TrendingUp, Clock, DollarSign, ShoppingCart, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { SalesChart, HorizontalBarChart, SimplePie } from '@/components/admin/SalesChart'

interface Stats {
  totalOrders: number
  totalRevenue: number
  avgOrderValue: number
  period: string
}

interface BestSeller {
  menuItemId: string
  name: string
  quantity: number
  revenue: number
}

interface HourlyData {
  hour: string
  orders: number
}

interface TablePerformance {
  tableNumber: number
  orders: number
  revenue: number
}

interface PeakHour {
  hour: string
  orders: number
}

interface StatusDistribution {
  status: string
  count: number
}

export default function ReportsPage() {
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, totalRevenue: 0, avgOrderValue: 0, period: 'today' })
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([])
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([])
  const [tablePerformance, setTablePerformance] = useState<TablePerformance[]>([])
  const [peakHour, setPeakHour] = useState<PeakHour>({ hour: '00:00', orders: 0 })
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('today')

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reports?period=${period}`)
      const data = await res.json()

      if (res.ok) {
        setStats(data.stats || {})
        setBestSellers(data.bestSellers || [])
        setHourlyData(data.hourlyDistribution || [])
        setTablePerformance(data.tablePerformance || [])
        setPeakHour(data.peakHour || { hour: '00:00', orders: 0 })
        setStatusDistribution(data.statusDistribution || [])
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [period])

  const exportCSV = () => {
    const headers = ['Item', 'Quantity Sold', 'Revenue']
    const rows = bestSellers.map(item => [item.name, item.quantity, item.revenue])
    const csvContent = [
      'Best Sellers Report\n',
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '\n\nHourly Distribution\n',
      'Hour,Orders',
      ...hourlyData.map(d => `${d.hour},${d.orders}`),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-report-${period}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const maxHourlyOrders = Math.max(...hourlyData.map(d => d.orders), 1)

  // Prepare pie chart data
  const statusColors: Record<string, string> = {
    COMPLETED: '#16A34A',
    READY: '#22C55E',
    PROCESSING: '#D97706',
    PENDING: '#DC2626',
    CANCELLED: '#6B7280',
  }

  const statusLabels: Record<string, string> = {
    COMPLETED: 'Selesai',
    READY: 'Siap',
    PROCESSING: 'Diproses',
    PENDING: 'Baru',
    CANCELLED: 'Batal',
  }

  const pieData = statusDistribution.map(s => ({
    label: statusLabels[s.status] || s.status,
    value: s.count,
    color: statusColors[s.status] || '#6B7280',
  }))

  const periodLabels: Record<string, string> = {
    today: 'Hari Ini',
    yesterday: 'Kemarin',
    week: '7 Hari',
    month: 'Bulan Ini',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-admin-text-primary">Laporan Penjualan</h1>
          <p className="text-admin-text-secondary">Analytics dan laporan penjualan</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="today">Hari Ini</option>
            <option value="yesterday">Kemarin</option>
            <option value="week">7 Hari</option>
            <option value="month">Bulan Ini</option>
          </select>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={fetchReports} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-admin-primary" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-admin-text-secondary">
                  Total Order ({periodLabels[period]})
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-admin-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-admin-text-primary">{stats.totalOrders}</div>
                <p className="text-xs text-admin-text-secondary mt-1">order selesai</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-admin-text-secondary">
                  Revenue ({periodLabels[period]})
                </CardTitle>
                <DollarSign className="h-4 w-4 text-admin-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-admin-text-primary">
                  {formatCurrency(stats.totalRevenue)}
                </div>
                <p className="text-xs text-admin-text-secondary mt-1">total penjualan</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-admin-text-secondary">
                  Avg. Order Value
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-admin-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-admin-text-primary">
                  {formatCurrency(stats.avgOrderValue)}
                </div>
                <p className="text-xs text-admin-text-secondary mt-1">per order</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-admin-text-secondary">
                  Jam Sibuk
                </CardTitle>
                <Clock className="h-4 w-4 text-admin-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-admin-primary">{peakHour.hour}</div>
                <p className="text-xs text-admin-text-secondary mt-1">{peakHour.orders} order</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Best Sellers */}
            <Card>
              <CardHeader>
                <CardTitle>Menu Terlaris</CardTitle>
                <CardDescription>Item paling banyak terjual</CardDescription>
              </CardHeader>
              <CardContent>
                {bestSellers.length === 0 ? (
                  <div className="text-center py-8 text-admin-text-secondary">
                    Belum ada data penjualan
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bestSellers.map((item, index) => (
                      <div key={item.menuItemId} className="flex items-center gap-4">
                        <span className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-sm font-bold text-admin-primary">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-admin-text-primary">{item.name}</p>
                          <p className="text-sm text-admin-text-secondary">{item.quantity} porsi terjual</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-admin-primary">
                            {formatCurrency(item.revenue)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hourly Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Per Jam</CardTitle>
                <CardDescription>Jumlah order per jam</CardDescription>
              </CardHeader>
              <CardContent>
                {hourlyData.length === 0 ? (
                  <div className="text-center py-8 text-admin-text-secondary">
                    Belum ada data penjualan
                  </div>
                ) : (
                  <HorizontalBarChart data={hourlyData} maxValue={maxHourlyOrders} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Table Performance */}
          {tablePerformance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Performa Meja</CardTitle>
                <CardDescription>Revenue dan order per meja</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {tablePerformance.map((table) => (
                    <div key={table.tableNumber} className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-admin-text-primary">Meja {table.tableNumber}</p>
                      <p className="text-sm text-admin-text-secondary">{table.orders} order</p>
                      <p className="text-lg font-bold text-admin-primary mt-2">
                        {formatCurrency(table.revenue)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Insight</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm text-admin-text-secondary mb-1">Jam Sibuk</p>
                  <p className="text-2xl font-bold text-admin-primary">{peakHour.hour}</p>
                  <p className="text-sm text-admin-text-secondary">{peakHour.orders} order</p>
                </div>
                {bestSellers[0] && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-admin-text-secondary mb-1">Best Seller</p>
                    <p className="text-2xl font-bold text-admin-primary truncate">{bestSellers[0].name}</p>
                    <p className="text-sm text-admin-text-secondary">{bestSellers[0].quantity} porsi terjual</p>
                  </div>
                )}
                {tablePerformance[0] && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-admin-text-secondary mb-1">Meja Paling Aktif</p>
                    <p className="text-2xl font-bold text-admin-primary">Meja {tablePerformance[0].tableNumber}</p>
                    <p className="text-sm text-admin-text-secondary">{tablePerformance[0].orders} order</p>
                  </div>
                )}
                {pieData.length > 0 && (
                  <div className="flex justify-center">
                    <SimplePie data={pieData} size={100} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
