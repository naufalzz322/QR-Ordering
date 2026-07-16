import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/public/order/[id]/status - Get order status
// Supports both database ID (UUID) and orderNumber (e.g., ORD-WAR-01-028)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try to find by database ID first, then by orderNumber
    let order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { menuItem: true },
        },
        table: {
          select: { tableNumber: true },
        },
      },
    })

    // If not found by ID, try by orderNumber
    if (!order) {
      order = await prisma.order.findUnique({
        where: { orderNumber: id },
        include: {
          items: {
            include: { menuItem: true },
          },
          table: {
            select: { tableNumber: true },
          },
        },
      })
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Calculate current queue position
    const activeOrdersAhead = await prisma.order.count({
      where: {
        outletId: order.outletId,
        status: { in: ['PENDING', 'PROCESSING'] },
        createdAt: { lt: order.createdAt },
      },
    })

    const currentQueuePosition = activeOrdersAhead + 1

    // Calculate estimated wait time - use original estimate from when order was created
    // NOT remaining time from estimatedDoneAt (which would be wrong if order waited in queue)
    let estimatedWaitMinutes: number
    let isImmediately = false

    if (order.estimatedDoneAt) {
      // Calculate original estimate duration: estimatedDoneAt - createdAt
      const originalEstimateMs = order.estimatedDoneAt.getTime() - new Date(order.createdAt).getTime()
      estimatedWaitMinutes = Math.round(originalEstimateMs / 60000)

      // If somehow that gives 0 or negative, fallback to avg prep time
      if (estimatedWaitMinutes <= 0) {
        const avgPrepResult = await prisma.menuItem.aggregate({
          where: { outletId: order.outletId },
          _avg: { avgPrepTimeMinutes: true },
        })
        const avgPrepTime = avgPrepResult._avg.avgPrepTimeMinutes ?? 8
        estimatedWaitMinutes = avgPrepTime
      }
    } else {
      // Fallback: use queue position based estimate
      const avgPrepResult = await prisma.menuItem.aggregate({
        where: { outletId: order.outletId },
        _avg: { avgPrepTimeMinutes: true },
      })
      const avgPrepTime = avgPrepResult._avg.avgPrepTimeMinutes ?? 8
      estimatedWaitMinutes = currentQueuePosition * avgPrepTime
    }

    // If queue position is 1, it's immediately
    if (currentQueuePosition === 1) {
      isImmediately = true
    }

    return NextResponse.json({
      order,
      estimate: {
        queuePosition: currentQueuePosition,
        estimatedWaitMinutes,
        isImmediately,
      },
    })
  } catch (error) {
    console.error('Failed to fetch order status:', error)
    return NextResponse.json({ error: 'Failed to fetch order status' }, { status: 500 })
  }
}

// PATCH /api/public/order/[id]/status - Update order status
// Supports both database ID (UUID) and orderNumber
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    // Validate status
    const validStatuses = ['PENDING', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Find order by ID or orderNumber
    let order = await prisma.order.findUnique({ where: { id } })

    if (!order) {
      order = await prisma.order.findUnique({ where: { orderNumber: id } })
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Update status (set completedAt when completing)
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    })

    // If order completed or cancelled, check if table should be marked as DONE
    if (status === 'COMPLETED' || status === 'CANCELLED') {
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

    return NextResponse.json({ success: true, order: updatedOrder })
  } catch (error) {
    console.error('Failed to update order status:', error)
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
  }
}
