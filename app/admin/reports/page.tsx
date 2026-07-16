'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, RefreshCw, TrendingUp, Clock, DollarSign, ShoppingCart, Loader2, Star, Flame, Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { HorizontalBarChart, SimplePie } from '@/components/admin/SalesChart'

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

const periodTabs = [
  { value: 'today', label: 'Hari Ini' },
  { value: 'yesterday', label: 'Kemarin' },
  { value: 'week', label: '7 Hari' },
  { value: 'month', label: 'Bulan Ini' },
]

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
    const now = new Date().toISOString().split('T')[0]
    const periodLabel = periodTabs.find(t => t.value === period)?.label || period

    const csvLines: string[] = []

    // Header
    csvLines.push('LAPORAN PENJUALAN')
    csvLines.push(`Periode: ${periodLabel}`)
    csvLines.push(`Tanggal Export: ${now}`)
    csvLines.push('')

    // Summary Stats
    csvLines.push('RINGKASAN')
    csvLines.push('Total Order,Total Revenue,Avg Order Value')
    csvLines.push(`${stats.totalOrders},${stats.totalRevenue},${stats.avgOrderValue}`)
    csvLines.push('')

    // Best Sellers
    csvLines.push('MENU TERLARIS')
    csvLines.push('Rank,Item,Quantity,Revenue')
    bestSellers.forEach((item, index) => {
      csvLines.push(`${index + 1},"${item.name}",${item.quantity},${item.revenue}`)
    })
    csvLines.push('')

    // Hourly Distribution
    csvLines.push('DISTRIBUSI PER JAM')
    csvLines.push('Jam,Orders')
    hourlyData.forEach(d => {
      csvLines.push(`${d.hour},${d.orders}`)
    })
    csvLines.push('')

    // Table Performance
    if (tablePerformance.length > 0) {
      csvLines.push('PERFORMA MEJA')
      csvLines.push('Meja,Orders,Revenue')
      tablePerformance.forEach(table => {
        csvLines.push(`${table.tableNumber},${table.orders},${table.revenue}`)
      })
      csvLines.push('')
    }

    // Status Distribution
    if (statusDistribution.length > 0) {
      csvLines.push('STATUS ORDER')
      csvLines.push('Status,Count')
      statusDistribution.forEach(s => {
        csvLines.push(`${s.status},${s.count}`)
      })
    }

    const csvContent = csvLines.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-report-${period}-${now}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const maxHourlyOrders = Math.max(...hourlyData.map(d => d.orders), 1)
  const maxBestSellerQty = Math.max(...bestSellers.map(b => b.quantity), 1)

  // Pie chart data
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
          <h1 className="text-2xl font-bold text-admin-text-primary">Laporan Penjualan</h1>
          <p className="text-sm text-admin-text-secondary">Analytics dan laporan penjualan</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={fetchReports} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl w-fit">
        {periodTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setPeriod(tab.value)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              period === tab.value
                ? 'bg-white text-admin-text-primary shadow-sm'
                : 'text-admin-text-secondary hover:text-admin-text-primary'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <Card className="border-l-4 border-l-primary-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-admin-text-secondary font-medium">Total Order</p>
                <p className="text-4xl font-bold text-admin-text-primary mt-1">{stats.totalOrders}</p>
                <p className="text-sm text-admin-text-secondary mt-1">order selesai</p>
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
                <p className="text-3xl font-bold text-admin-text-primary mt-1 truncate">
                  {stats.totalRevenue >= 1000000
                    ? `Rp ${(stats.totalRevenue / 1000000).toFixed(1)}jt`
                    : formatCurrency(stats.totalRevenue)}
                </p>
                <p className="text-sm text-admin-text-secondary mt-1">total penjualan</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avg Order Value */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-admin-text-secondary font-medium">Avg. Order</p>
                <p className="text-3xl font-bold text-admin-text-primary mt-1 truncate">
                  {formatCurrency(stats.avgOrderValue)}
                </p>
                <p className="text-sm text-admin-text-secondary mt-1">per order</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Peak Hour */}
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-admin-text-secondary font-medium">Jam Sibuk</p>
                <p className="text-4xl font-bold text-admin-primary mt-1">{peakHour.hour}</p>
                <p className="text-sm text-admin-text-secondary mt-1">{peakHour.orders} order</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Sellers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Menu Terlaris
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bestSellers.length === 0 ? (
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-admin-text-secondary">Belum ada data penjualan</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bestSellers.slice(0, 5).map((item, index) => (
                  <div key={item.menuItemId}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                          index === 0 ? 'bg-amber-100 text-amber-700' :
                          index === 1 ? 'bg-neutral-200 text-neutral-600' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-neutral-100 text-neutral-500'
                        )}>
                          {index + 1}
                        </span>
                        <span className="font-medium text-admin-text-primary">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-primary-700">{item.quantity}</span>
                        <span className="text-sm text-admin-text-secondary ml-1">porsi</span>
                      </div>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          index === 0 ? 'bg-amber-400' :
                          index === 1 ? 'bg-neutral-400' :
                          index === 2 ? 'bg-orange-400' :
                          'bg-primary-400'
                        )}
                        style={{ width: `${(item.quantity / maxBestSellerQty) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-admin-text-secondary mt-1 text-right">
                      {formatCurrency(item.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hourly Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-600" />
              Distribusi Per Jam
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hourlyData.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-admin-text-secondary">Belum ada data penjualan</p>
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
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              Performa Meja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {tablePerformance.map((table) => (
                <div key={table.tableNumber} className="bg-neutral-50 rounded-xl p-4 text-center border border-neutral-200">
                  <p className="text-xl font-bold text-admin-text-primary">Meja {table.tableNumber}</p>
                  <p className="text-sm text-admin-text-secondary">{table.orders} order</p>
                  <p className="text-base font-bold text-primary-700 mt-1">
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
          <CardTitle className="text-lg">Insight</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Peak Hour Insight */}
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">Jam Sibuk</span>
              </div>
              <p className="text-3xl font-bold text-purple-700">{peakHour.hour}</p>
              <p className="text-sm text-purple-600 mt-1">{peakHour.orders} order masuk</p>
            </div>

            {/* Best Seller Insight */}
            {bestSellers[0] && (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700">Best Seller</span>
                </div>
                <p className="text-lg font-bold text-amber-700 truncate">{bestSellers[0].name}</p>
                <p className="text-sm text-amber-600 mt-1">{bestSellers[0].quantity} porsi terjual</p>
              </div>
            )}

            {/* Most Active Table Insight */}
            {tablePerformance[0] && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Meja Paling Aktif</span>
                </div>
                <p className="text-3xl font-bold text-blue-700">Meja {tablePerformance[0].tableNumber}</p>
                <p className="text-sm text-blue-600 mt-1">{tablePerformance[0].orders} order</p>
              </div>
            )}

            {/* Status Distribution Pie */}
            {pieData.length > 0 && (
              <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 flex items-center justify-center">
                <SimplePie data={pieData} size={100} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
