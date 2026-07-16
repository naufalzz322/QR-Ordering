import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { recalculateQueuePositions } from '@/lib/waitEstimate'

// PATCH /api/kitchen/order/[id]/status - Update order status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { status } = await request.json()

    const order = await prisma.order.update({
      where: { id },
      data: {
        status,
        processedAt: status === 'PROCESSING' ? new Date() : undefined,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
      include: {
        items: { include: { menuItem: true } },
        table: { select: { tableNumber: true } },
      },
    })

    // Recalculate queue if order completed or cancelled
    if (status === 'COMPLETED' || status === 'CANCELLED') {
      await recalculateQueuePositions(order.outletId)

      // Check if table should be closed
      const otherActiveOrders = await prisma.order.count({
        where: {
          tableId: order.tableId,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      })

      if (otherActiveOrders === 0) {
        await prisma.table.update({
          where: { id: order.tableId },
          data: { status: 'DONE' },
        })
      }
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Failed to update order status:', error)
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
  }
}
