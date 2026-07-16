import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { config } from '@/lib/config'

// GET /api/admin/floor - Get floor status
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
        orders: {
          where: {
            status: { in: ['PENDING', 'PROCESSING', 'READY'] },
          },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            notes: true,
            createdAt: true,
            items: {
              select: {
                id: true,
                qty: true,
                unitPrice: true,
                itemNotes: true,
                menuItem: {
                  select: { name: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    // Add createdAt from the parent order to each item for display purposes
    const tablesWithItems = tables.map(table => ({
      ...table,
      orders: table.orders.map(order => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
      })),
    }))

    // Stats
    const stats = {
      total: tables.length,
      empty: tables.filter(t => t.status === 'EMPTY').length,
      active: tables.filter(t => t.status === 'ACTIVE').length,
      done: tables.filter(t => t.status === 'DONE').length,
    }

    return NextResponse.json({ tables: tablesWithItems, stats, outlet: { name: outlet.name, slug: outlet.slug } })
  } catch (error) {
    console.error('Failed to fetch floor:', error)
    return NextResponse.json({ error: 'Failed to fetch floor' }, { status: 500 })
  }
}

// POST /api/admin/floor/close - Close a table
export async function POST(request: Request) {
  try {
    const { tableId } = await request.json()

    // If tableId is provided, close that specific table
    if (tableId) {
      // Update table status to EMPTY
      const table = await prisma.table.update({
        where: { id: tableId },
        data: { status: 'EMPTY' },
      })

      // Also complete any remaining orders
      await prisma.order.updateMany({
        where: {
          tableId,
          status: { in: ['PENDING', 'PROCESSING', 'READY'] },
        },
        data: { status: 'COMPLETED' },
      })

      return NextResponse.json({ success: true, table })
    }

    // If no tableId, sync all table statuses
    const { searchParams } = new URL(request.url)
    const outletSlug = searchParams.get('outlet') || config.outletSlug

    const outlet = await prisma.outlet.findUnique({
      where: { slug: outletSlug },
    })

    if (!outlet) {
      return NextResponse.json({ error: 'Outlet not found' }, { status: 404 })
    }

    // Get all tables and sync their statuses
    const tables = await prisma.table.findMany({
      where: { outletId: outlet.id },
    })

    const updatedTables = []
    for (const table of tables) {
      const activeOrders = await prisma.order.count({
        where: {
          tableId: table.id,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      })

      let newStatus = table.status
      if (activeOrders === 0 && table.status === 'ACTIVE') {
        newStatus = 'DONE'
      }

      if (newStatus !== table.status) {
        const updated = await prisma.table.update({
          where: { id: table.id },
          data: { status: newStatus },
        })
        updatedTables.push(updated)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${updatedTables.length} tables`,
      updatedTables
    })
  } catch (error) {
    console.error('Failed to close table:', error)
    return NextResponse.json({ error: 'Failed to close table' }, { status: 500 })
  }
}
