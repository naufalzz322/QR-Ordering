import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { config } from '@/lib/config'

// GET /api/kitchen/orders - Get pending orders for kitchen display
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const outletSlug = searchParams.get('outlet') || config.outletSlug

    const outlet = await prisma.outlet.findUnique({
      where: { slug: outletSlug },
    })

    if (!outlet) {
      return NextResponse.json({ error: 'Outlet not found' }, { status: 404 })
    }

    const orders = await prisma.order.findMany({
      where: {
        outletId: outlet.id,
        status: { in: ['PENDING', 'PROCESSING', 'READY'] },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        notes: true,
        createdAt: true,
        processedAt: true,
        estimatedDoneAt: true,
        queuePosition: true,
        table: { select: { tableNumber: true } },
        items: {
          select: {
            id: true,
            qty: true,
            itemNotes: true,
            menuItem: { select: { name: true } },
          },
        },
      },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Failed to fetch kitchen orders:', error)
    return NextResponse.json({ error: 'Failed to fetch kitchen orders' }, { status: 500 })
  }
}
