import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { config } from '@/lib/config'

// GET /api/admin/reports - Get sales reports (includes both active + archived orders)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const outletSlug = searchParams.get('outlet') || config.outletSlug
    const period = searchParams.get('period') || 'today' // today, yesterday, week, month

    const outlet = await prisma.outlet.findUnique({
      where: { slug: outletSlug },
    })

    if (!outlet) {
      return NextResponse.json({ error: 'Outlet not found' }, { status: 404 })
    }

    // Calculate date range based on period
    const now = new Date()
    let startDate: Date
    let endDate = now

    switch (period) {
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      default: // today
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }

    // Get active completed orders with items
    const activeOrders = await prisma.order.findMany({
      where: {
        outletId: outlet.id,
        status: 'COMPLETED',
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: {
          include: {
            menuItem: {
              select: { name: true, categoryId: true },
            },
          },
        },
      },
    })

    // Get archived completed orders (for revenue totals, no items)
    const archivedOrders = await prisma.orderArchive.findMany({
      where: {
        outletId: outlet.id,
        status: 'COMPLETED',
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    // Combine for totals (archived orders don't have items for best sellers)
    const allOrders = [...activeOrders, ...archivedOrders]

    // Calculate stats
    const totalOrders = allOrders.length
    const totalRevenue = allOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0)
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Best sellers (only from active orders - archived don't have items)
    const itemSales: Record<string, { name: string; quantity: number; revenue: number }> = {}
    for (const order of activeOrders) {
      for (const item of order.items) {
        const key = item.menuItemId
        if (!itemSales[key]) {
          itemSales[key] = {
            name: item.menuItem.name,
            quantity: 0,
            revenue: 0,
          }
        }
        itemSales[key].quantity += item.qty
        itemSales[key].revenue += Number(item.unitPrice) * item.qty
      }
    }

    const bestSellers = Object.entries(itemSales)
      .map(([id, data]) => ({
        menuItemId: id,
        name: data.name,
        quantity: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)

    // Hourly distribution (from all orders)
    const hourlyDistribution: Record<number, number> = {}
    for (let i = 0; i < 24; i++) {
      hourlyDistribution[i] = 0
    }
    for (const order of allOrders) {
      const hour = new Date(order.completedAt || order.createdAt).getHours()
      hourlyDistribution[hour]++
    }

    const hourlyData = Object.entries(hourlyDistribution)
      .map(([hour, count]) => ({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        orders: count,
      }))
      .filter(d => d.orders > 0)

    // Table performance - from all orders (tableNumber stored in archived)
    const tableRevenue: Record<number, number> = {}
    const tableOrders: Record<number, number> = {}

    for (const order of activeOrders) {
      // Active orders have table relation
      const table = await prisma.table.findUnique({ where: { id: order.tableId } })
      if (table) {
        tableRevenue[table.tableNumber] = (tableRevenue[table.tableNumber] || 0) + Number(order.totalAmount)
        tableOrders[table.tableNumber] = (tableOrders[table.tableNumber] || 0) + 1
      }
    }

    for (const order of archivedOrders) {
      // Archived orders have tableNumber stored directly
      tableRevenue[order.tableNumber] = (tableRevenue[order.tableNumber] || 0) + Number(order.totalAmount)
      tableOrders[order.tableNumber] = (tableOrders[order.tableNumber] || 0) + 1
    }

    const tablePerformance = Object.entries(tableRevenue)
      .map(([tableNumber, revenue]) => ({
        tableNumber: parseInt(tableNumber),
        orders: tableOrders[parseInt(tableNumber)] || 0,
        revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Peak hour
    const peakHour = hourlyData.reduce(
      (max, curr) => (curr.orders > max.orders ? curr : max),
      { hour: '00:00', orders: 0 }
    )

    // Status breakdown for pie chart (only from active orders)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      where: {
        outletId: outlet.id,
        createdAt: { gte: todayStart },
      },
      _count: true,
    })

    const statusDistribution = statusCounts.map(s => ({
      status: s.status,
      count: s._count,
    }))

    return NextResponse.json({
      stats: {
        totalOrders,
        totalRevenue,
        avgOrderValue,
        period,
        archivedIncluded: archivedOrders.length > 0,
      },
      bestSellers,
      hourlyDistribution: hourlyData,
      tablePerformance,
      peakHour,
      statusDistribution,
      periodInfo: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    })
  } catch (error) {
    console.error('Failed to fetch reports:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
