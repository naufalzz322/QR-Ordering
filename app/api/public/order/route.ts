import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { calculateWaitEstimate } from '@/lib/waitEstimate'

// POST /api/public/order - Create new order
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { items, tableToken, notes } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 })
    }

    if (!tableToken) {
      return NextResponse.json({ error: 'Table token is required' }, { status: 400 })
    }

    // Find table by token
    const table = await prisma.table.findUnique({
      where: { qrToken: tableToken },
      include: { outlet: true },
    })

    if (!table) {
      return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
    }

    // Calculate total and prepare order items
    let totalAmount = 0
    const orderItems = []

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
      })

      if (!menuItem) {
        continue
      }

      let unitPrice = Number(menuItem.basePrice)

      // Add variant price if selected
      if (item.variantId) {
        const variant = await prisma.menuVariant.findUnique({
          where: { id: item.variantId },
        })
        if (variant) {
          unitPrice += Number(variant.additionalPrice)
        }
      }

      totalAmount += unitPrice * item.qty

      orderItems.push({
        menuItemId: item.menuItemId,
        variantId: item.variantId || null,
        qty: item.qty,
        unitPrice,
        itemNotes: item.itemNotes || null,
      })
    }

    // Generate order number
    const orderCount = await prisma.order.count({
      where: { outletId: table.outletId },
    })

    const orderPrefix = table.outlet.slug.toUpperCase().slice(0, 3)
    const orderNumber = `ORD-${orderPrefix}-${String(table.tableNumber).padStart(2, '0')}-${String(orderCount + 1).padStart(3, '0')}`

    // Calculate wait estimate
    const newOrderTime = new Date()
    const estimate = await calculateWaitEstimate(table.outletId, newOrderTime)

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        tableId: table.id,
        outletId: table.outletId,
        status: 'PENDING',
        notes,
        items: {
          create: orderItems,
        },
        totalAmount,
        estimatedDoneAt: estimate.estimatedDoneAt,
        queuePosition: estimate.queuePosition,
      },
      include: {
        items: {
          include: { menuItem: true },
        },
        table: true,
      },
    })

    // Update table status
    await prisma.table.update({
      where: { id: table.id },
      data: { status: 'ACTIVE' },
    })

    return NextResponse.json({
      order,
      estimate: {
        queuePosition: estimate.queuePosition,
        estimatedWaitMinutes: estimate.estimatedWaitMinutes,
        isImmediately: estimate.isImmediately,
      },
    })
  } catch (error) {
    console.error('Failed to create order:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
