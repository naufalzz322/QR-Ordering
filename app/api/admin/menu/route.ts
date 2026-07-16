import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { config } from '@/lib/config'

// GET /api/admin/menu - Get all menu items
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { outlet: { slug: config.outletSlug } },
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          where: { outlet: { slug: config.outletSlug } },
          orderBy: { sortOrder: 'asc' },
          include: {
            variants: true,
          },
        },
      },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Failed to fetch menu:', error)
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 })
  }
}

// POST /api/admin/menu - Create menu item
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, categoryId, description, basePrice, photoUrl, avgPrepTimeMinutes, variants } = body

    const outlet = await prisma.outlet.findUnique({
      where: { slug: config.outletSlug },
    })

    if (!outlet) {
      return NextResponse.json({ error: 'Outlet not found' }, { status: 404 })
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        outletId: outlet.id,
        categoryId,
        name,
        description,
        basePrice,
        photoUrl,
        avgPrepTimeMinutes: avgPrepTimeMinutes || 8,
        isAvailable: true,
        variants: variants ? {
          create: variants.map((v: { name: string; additionalPrice?: number }) => ({
            name: v.name,
            additionalPrice: v.additionalPrice || 0,
            isDefault: false,
          })),
        } : undefined,
      },
      include: { variants: true },
    })

    return NextResponse.json({ menuItem })
  } catch (error) {
    console.error('Failed to create menu item:', error)
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 })
  }
}

// PUT /api/admin/menu - Update menu item
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data,
      include: { variants: true },
    })

    return NextResponse.json({ menuItem })
  } catch (error) {
    console.error('Failed to update menu item:', error)
    return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 })
  }
}

// DELETE /api/admin/menu - Delete menu item
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Menu item ID required' }, { status: 400 })
    }

    await prisma.menuItem.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete menu item:', error)
    return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 })
  }
}
