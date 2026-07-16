import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { config } from '@/lib/config'

// GET /api/admin/orders - Get all orders
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const outletSlug = searchParams.get('outlet') || config.outletSlug
    const status = searchParams.get('status') // filter by status
    const search = searchParams.get('search') // search by orderNumber
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '0')

    const outlet = await prisma.outlet.findUnique({
      where: { slug: outletSlug },
    })

    if (!outlet) {
      return NextResponse.json({ error: 'Outlet not found' }, { status: 404 })
    }

    const where: any = { outletId: outlet.id }
    if (status && status !== 'all') {
      where.status = status
    }
    if (search) {
      where.orderNumber = { contains: search, mode: 'insensitive' }
    }

    // Get total count for pagination
    const total = await prisma.order.count({ where })

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: page * limit,
      include: {
        table: {
          select: { tableNumber: true },
        },
        items: {
          include: {
            menuItem: {
              select: { name: true },
            },
          },
        },
      },
    })

    // Calculate stats from all orders for the outlet (ignoring search filter)
    const allOrdersWhere: any = { outletId: outlet.id }
    if (status && status !== 'all') {
      allOrdersWhere.status = status
    }

    const stats = await prisma.order.groupBy({
      by: ['status'],
      where: allOrdersWhere,
      _count: { status: true },
    })

    const statsResult = {
      total: stats.reduce((sum, s) => sum + s._count.status, 0),
      pending: stats.find(s => s.status === 'PENDING')?._count.status || 0,
      processing: stats.find(s => s.status === 'PROCESSING')?._count.status || 0,
      ready: stats.find(s => s.status === 'READY')?._count.status || 0,
      completed: stats.find(s => s.status === 'COMPLETED')?._count.status || 0,
    }

    return NextResponse.json({ orders, stats: statsResult, total })
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
