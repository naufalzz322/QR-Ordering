import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { config } from '@/lib/config'

// GET /api/public/tables?outlet=xxx
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

    const tables = await prisma.table.findMany({
      where: { outletId: outlet.id },
      orderBy: { tableNumber: 'asc' },
      include: {
        _count: {
          select: {
            orders: {
              where: { status: { in: ['PENDING', 'PROCESSING', 'READY'] } },
            },
          },
        },
      },
    })

    return NextResponse.json({ tables })
  } catch (error) {
    console.error('Failed to fetch tables:', error)
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 })
  }
}
