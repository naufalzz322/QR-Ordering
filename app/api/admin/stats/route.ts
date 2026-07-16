import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get outlet ID from session or first outlet
    let outletId = (session.user as any).outletId
    if (!outletId) {
      const outlet = await prisma.outlet.findFirst()
      if (!outlet) {
        return NextResponse.json({ error: 'No outlet found' }, { status: 404 })
      }
      outletId = outlet.id
    }

    // Get today's date range
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const startOfYesterday = new Date(startOfDay)
    startOfYesterday.setDate(startOfYesterday.getDate() - 1)

    // Today's completed orders
    const todayOrders = await prisma.order.findMany({
      where: {
        outletId,
        status: 'COMPLETED',
        createdAt: { gte: startOfDay },
      },
    })

    // Yesterday's orders for comparison
    const yesterdayOrders = await prisma.order.findMany({
      where: {
        outletId,
        status: 'COMPLETED',
        createdAt: { gte: startOfYesterday, lt: startOfDay },
      },
    })

    const todayTotalOrders = todayOrders.length
    const yesterdayTotalOrders = yesterdayOrders.length
    const orderChange = yesterdayTotalOrders > 0
      ? Math.round(((todayTotalOrders - yesterdayTotalOrders) / yesterdayTotalOrders) * 100)
      : todayTotalOrders > 0 ? 100 : 0

    const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0)
    const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0)
    const revenueChange = yesterdayRevenue > 0
      ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
      : todayRevenue > 0 ? 100 : 0

    // Average wait time from processed orders today
    const processedOrders = await prisma.order.findMany({
      where: {
        outletId,
        completedAt: { not: null },
        createdAt: { gte: startOfDay },
      },
    })

    let avgWaitTime = 0
    if (processedOrders.length > 0) {
      const totalWaitTime = processedOrders.reduce((sum, o) => {
        if (o.completedAt && o.createdAt) {
          return sum + (new Date(o.completedAt).getTime() - new Date(o.createdAt).getTime()) / 60000
        }
        return sum
      }, 0)
      avgWaitTime = Math.round(totalWaitTime / processedOrders.length)
    }

    // Best seller today
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          outletId,
          createdAt: { gte: startOfDay },
        },
      },
      include: {
        menuItem: true,
      },
    })

    const itemSales: Record<string, { name: string; qty: number }> = {}
    for (const item of orderItems) {
      if (!itemSales[item.menuItemId]) {
        itemSales[item.menuItemId] = { name: item.menuItem.name, qty: 0 }
      }
      itemSales[item.menuItemId].qty += item.qty
    }

    const bestSeller = Object.values(itemSales).sort((a, b) => b.qty - a.qty)[0]

    // Active orders
    const activeOrders = await prisma.order.count({
      where: {
        outletId,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    })

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      where: { outletId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        table: true,
        items: {
          include: { menuItem: true },
        },
      },
    })

    return NextResponse.json({
      stats: {
        todayOrders: todayTotalOrders,
        orderChange,
        todayRevenue,
        revenueChange,
        avgWaitTime,
        bestSeller: bestSeller || { name: '-', qty: 0 },
        activeOrders,
      },
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        tableNumber: o.table.tableNumber,
        totalAmount: Number(o.totalAmount),
        status: o.status,
        timeAgo: getTimeAgo(o.createdAt),
        itemCount: o.items.length,
      })),
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getTimeAgo(date: Date): string {
  const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (minutes < 1) return 'baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  return `${Math.floor(hours / 24)} hari lalu`
}
