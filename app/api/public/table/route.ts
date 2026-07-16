import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/public/table?token=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const table = await prisma.table.findUnique({
      where: { qrToken: token },
      include: {
        outlet: {
          select: { name: true, slug: true },
        },
      },
    })

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    return NextResponse.json({
      table: {
        id: table.id,
        tableNumber: table.tableNumber,
        qrToken: table.qrToken,
        status: table.status,
        outletName: table.outlet.name,
      },
    })
  } catch (error) {
    console.error('Failed to fetch table:', error)
    return NextResponse.json({ error: 'Failed to fetch table' }, { status: 500 })
  }
}
