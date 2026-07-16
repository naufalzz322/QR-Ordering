import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { config } from '@/lib/config'

// GET /api/admin/settings - Get outlet settings
export async function GET() {
  try {
    const outlet = await prisma.outlet.findUnique({
      where: { slug: config.outletSlug },
      include: {
        _count: {
          select: { tables: true, orders: true, menuItems: true },
        },
      },
    })

    if (!outlet) {
      return NextResponse.json({ error: 'Outlet not found' }, { status: 404 })
    }

    // Get average prep time from menu items
    const avgPrepResult = await prisma.menuItem.aggregate({
      where: { outletId: outlet.id },
      _avg: { avgPrepTimeMinutes: true },
    })

    return NextResponse.json({
      outlet: {
        id: outlet.id,
        name: outlet.name,
        slug: outlet.slug,
        address: outlet.address,
        logoUrl: outlet.logoUrl,
        avgPrepTimeMinutes: avgPrepResult._avg.avgPrepTimeMinutes || 8,
      },
      counts: outlet._count,
    })
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PUT /api/admin/settings - Update outlet settings
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { name, address, logoUrl, avgPrepTimeMinutes } = body

    const outlet = await prisma.outlet.update({
      where: { slug: config.outletSlug },
      data: {
        name,
        address,
        logoUrl,
      },
    })

    // Update avgPrepTime for all menu items if provided
    if (avgPrepTimeMinutes && typeof avgPrepTimeMinutes === 'number') {
      await prisma.menuItem.updateMany({
        where: { outletId: outlet.id },
        data: { avgPrepTimeMinutes },
      })
    }

    return NextResponse.json({ outlet })
  } catch (error) {
    console.error('Failed to update settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
