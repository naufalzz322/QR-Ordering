import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { config } from '@/lib/config'

// Verify cron secret
function verifyCronSecret(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true // Skip if not configured

  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${cronSecret}`
}

// POST /api/admin/orders/archive - Archive completed orders from yesterday (end of day)
// Run this daily at end of day via cron-job.org
// Archives all completed/cancelled orders from yesterday (before today 00:00)

export async function POST(request: Request) {
  try {
    // Verify cron secret
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Get outlet from body or config
    let outletSlug = config.outletSlug
    let forceArchive = false

    try {
      const body = await request.json()
      outletSlug = body.outletSlug || outletSlug
      forceArchive = body.force || false // Optional: force archive today's orders too
    } catch {
      // No body provided, use defaults
    }

    // Get outlet
    const outlet = await prisma.outlet.findUnique({
      where: { slug: outletSlug },
    })

    if (!outlet) {
      return NextResponse.json({ error: 'Outlet not found' }, { status: 404 })
    }

    // Calculate cutoff: start of today (archives everything before today)
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    // If force=true, archive everything including today's orders
    const cutoffDate = forceArchive ? new Date() : startOfToday

    // Find completed/cancelled orders before cutoff
    // Include orders with completedAt < cutoff OR completedAt is null (edge case)
    const ordersToArchive = await prisma.order.findMany({
      where: {
        outletId: outlet.id,
        status: { in: ['COMPLETED', 'CANCELLED'] },
        OR: [
          { completedAt: { lt: cutoffDate } },
          { completedAt: null },
        ],
      },
      include: {
        table: true,
        items: true,
      },
    })

    if (ordersToArchive.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No orders to archive',
        archivedCount: 0,
      })
    }

    // Archive each order
    let archivedCount = 0
    const archivedIds: string[] = []

    for (const order of ordersToArchive) {
      // Check if already archived
      const existing = await prisma.orderArchive.findUnique({
        where: { id: order.id },
      })

      if (existing) continue // Skip if already archived

      // Create archive record
      await prisma.orderArchive.create({
        data: {
          id: order.id,
          orderNumber: order.orderNumber,
          tableId: order.tableId,
          tableNumber: order.table.tableNumber,
          outletId: order.outletId,
          status: order.status,
          notes: order.notes,
          totalAmount: order.totalAmount,
          estimatedDoneAt: order.estimatedDoneAt,
          queuePosition: order.queuePosition,
          createdAt: order.createdAt,
          processedAt: order.processedAt,
          completedAt: order.completedAt,
        },
      })

      archivedIds.push(order.id)
      archivedCount++
    }

    // Delete archived orders (cascades to OrderItems)
    await prisma.order.deleteMany({
      where: {
        id: { in: archivedIds },
      },
    })

    return NextResponse.json({
      success: true,
      message: `Archived ${archivedCount} orders`,
      archivedCount,
      archivedIds,
      cutoffDate: cutoffDate.toISOString(),
    })
  } catch (error) {
    console.error('Failed to archive orders:', error)
    return NextResponse.json({ error: 'Failed to archive orders' }, { status: 500 })
  }
}

// GET /api/admin/orders/archive - Get archived orders (for reports)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const outletSlug = searchParams.get('outlet') || config.outletSlug
    const period = searchParams.get('period') || 'all' // today, yesterday, week, month, all
    const tableNumber = searchParams.get('tableNumber')

    // Get outlet
    const outlet = await prisma.outlet.findUnique({
      where: { slug: outletSlug },
    })

    if (!outlet) {
      return NextResponse.json({ error: 'Outlet not found' }, { status: 404 })
    }

    // Build date filter
    const now = new Date()
    let startDate: Date | undefined

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'yesterday':
        const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const archivedYesterday = await prisma.orderArchive.findMany({
          where: {
            outletId: outlet.id,
            status: 'COMPLETED',
            completedAt: { gte: yesterdayStart, lt: yesterdayEnd },
            ...(tableNumber && { tableNumber: parseInt(tableNumber) }),
          },
          orderBy: { completedAt: 'desc' },
        })
        return NextResponse.json({ orders: archivedYesterday, period })
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
    }

    const where: any = {
      outletId: outlet.id,
      status: 'COMPLETED',
      ...(startDate && { completedAt: { gte: startDate } }),
      ...(tableNumber && { tableNumber: parseInt(tableNumber) }),
    }

    const orders = await prisma.orderArchive.findMany({
      where,
      orderBy: { completedAt: 'desc' },
    })

    return NextResponse.json({ orders, period })
  } catch (error) {
    console.error('Failed to fetch archived orders:', error)
    return NextResponse.json({ error: 'Failed to fetch archived orders' }, { status: 500 })
  }
}
