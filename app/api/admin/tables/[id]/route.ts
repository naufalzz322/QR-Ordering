import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Generate random secure token
function generateSecureToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const length = 12
  let token = ''
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

// GET /api/admin/tables/[id] - Get single table
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        orders: {
          where: { status: { in: ['PENDING', 'PROCESSING', 'READY'] } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    return NextResponse.json({ table })
  } catch (error) {
    console.error('Failed to fetch table:', error)
    return NextResponse.json({ error: 'Failed to fetch table' }, { status: 500 })
  }
}

// PATCH /api/admin/tables/[id] - Update table (status, regenerate token)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, tableNumber, regenerateToken } = body

    const updateData: Record<string, unknown> = {}

    if (status) updateData.status = status
    if (tableNumber) updateData.tableNumber = tableNumber

    // Generate new secure token
    if (regenerateToken) {
      // Check if table has active orders
      const activeOrders = await prisma.order.count({
        where: {
          tableId: id,
          status: { in: ['PENDING', 'PROCESSING', 'READY'] },
        },
      })

      if (activeOrders > 0) {
        return NextResponse.json(
          { error: 'Cannot regenerate token while table has active orders' },
          { status: 400 }
        )
      }

      updateData.qrToken = generateSecureToken()
    }

    const table = await prisma.table.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ table })
  } catch (error) {
    console.error('Failed to update table:', error)
    return NextResponse.json({ error: 'Failed to update table' }, { status: 500 })
  }
}

// DELETE /api/admin/tables/[id] - Delete table (archives completed orders first)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if table has active orders
    const activeOrders = await prisma.order.count({
      where: {
        tableId: id,
        status: { in: ['PENDING', 'PROCESSING', 'READY'] },
      },
    })

    if (activeOrders > 0) {
      return NextResponse.json(
        { error: 'Cannot delete table with active orders. Complete or cancel all orders first.' },
        { status: 400 }
      )
    }

    // Get table info before deletion
    const table = await prisma.table.findUnique({
      where: { id },
      include: { orders: { where: { status: { in: ['COMPLETED', 'CANCELLED'] } } } },
    })

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    // Archive completed/cancelled orders before deleting table
    for (const order of table.orders) {
      await prisma.orderArchive.upsert({
        where: { id: order.id },
        update: {},
        create: {
          id: order.id,
          orderNumber: order.orderNumber,
          tableId: order.tableId,
          tableNumber: table.tableNumber,
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
    }

    // Delete orders (cascades to order items)
    await prisma.order.deleteMany({
      where: { tableId: id },
    })

    // Delete table
    await prisma.table.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      archivedCount: table.orders.length,
      message: `Table deleted. ${table.orders.length} orders archived.`,
    })
  } catch (error) {
    console.error('Failed to delete table:', error)
    return NextResponse.json({ error: 'Failed to delete table' }, { status: 500 })
  }
}
