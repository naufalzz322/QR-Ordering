import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { config } from '@/lib/config'

// GET /api/admin/categories - Get all categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { outlet: { slug: config.outletSlug } },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { items: true },
        },
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
    console.error('Failed to fetch categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST /api/admin/categories - Create category
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, sortOrder } = body

    const outlet = await prisma.outlet.findUnique({
      where: { slug: config.outletSlug },
    })

    if (!outlet) {
      return NextResponse.json({ error: 'Outlet not found' }, { status: 404 })
    }

    const category = await prisma.category.create({
      data: {
        outletId: outlet.id,
        name,
        sortOrder: sortOrder || 0,
        isActive: true,
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Failed to create category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

// PUT /api/admin/categories - Update category
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    const category = await prisma.category.update({
      where: { id },
      data,
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Failed to update category:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

// DELETE /api/admin/categories - Delete category
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Category ID required' }, { status: 400 })
    }

    await prisma.category.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
