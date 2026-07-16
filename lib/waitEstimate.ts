import prisma from './prisma'

/**
 * Calculate queue position and estimated wait time
 * Called when a new order is created
 */
export async function calculateWaitEstimate(
  outletId: string,
  newOrderCreatedAt: Date
): Promise<{
  queuePosition: number
  estimatedWaitMinutes: number
  estimatedDoneAt: Date
  isImmediately: boolean
}> {
  // Count orders ahead in queue
  const aheadCount = await prisma.order.count({
    where: {
      outletId,
      status: { in: ['PENDING', 'PROCESSING'] },
      createdAt: { lt: newOrderCreatedAt },
    },
  })

  const queuePosition = aheadCount + 1
  const isImmediately = queuePosition === 1

  // Get average prep time for this outlet
  const avgPrepResult = await prisma.menuItem.aggregate({
    where: { outletId },
    _avg: { avgPrepTimeMinutes: true },
  })

  const avgPrepTime = avgPrepResult._avg.avgPrepTimeMinutes ?? 8

  // Calculate estimated wait
  const estimatedWaitMinutes = isImmediately ? avgPrepTime : queuePosition * avgPrepTime

  const estimatedDoneAt = new Date(Date.now() + estimatedWaitMinutes * 60_000)

  return {
    queuePosition,
    estimatedWaitMinutes,
    estimatedDoneAt,
    isImmediately,
  }
}

/**
 * Recalculate queue positions when an order is completed/cancelled
 * Called after order status changes to COMPLETED or CANCELLED
 */
export async function recalculateQueuePositions(outletId: string): Promise<void> {
  // Get all active orders sorted by creation time
  const activeOrders = await prisma.order.findMany({
    where: {
      outletId,
      status: { in: ['PENDING', 'PROCESSING'] },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Get outlet avg prep time
  const avgPrepResult = await prisma.menuItem.aggregate({
    where: { outletId },
    _avg: { avgPrepTimeMinutes: true },
  })
  const avgPrepTime = avgPrepResult._avg.avgPrepTimeMinutes ?? 8

  // Batch update queue positions
  const updates = activeOrders.map((order, index) => {
    const newQueuePosition = index + 1
    const isImmediately = newQueuePosition === 1
    const estimatedWaitMinutes = isImmediately ? avgPrepTime : newQueuePosition * avgPrepTime

    return prisma.order.update({
      where: { id: order.id },
      data: {
        queuePosition: newQueuePosition,
        estimatedDoneAt: new Date(Date.now() + estimatedWaitMinutes * 60_000),
      },
    })
  })

  await prisma.$transaction(updates)
}

/**
 * Format wait estimate for display
 */
export function formatWaitEstimate(estimatedMinutes: number, isImmediately: boolean): string {
  if (isImmediately || estimatedMinutes <= 0) {
    return '±Segera'
  }
  return `~±${estimatedMinutes} menit`
}
