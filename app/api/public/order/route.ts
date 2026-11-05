import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { calculateWaitEstimate } from '@/lib/waitEstimate'
import { validateMenuItemForOrder, validatePublicOrderItems } from '@/lib/orderValidation'

// POST /api/public/order - Create new order
export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid order payload' }, { status: 400 })
    }

    const { items, tableToken, notes } = body as {
      items?: unknown
      tableToken?: unknown
      notes?: unknown
    }

    const validatedItems = validatePublicOrderItems(items)
    if (!validatedItems.valid) {
      return NextResponse.json({ error: validatedItems.error }, { status: 400 })
    }

    if (typeof tableToken !== 'string' || tableToken.length === 0) {
      return NextResponse.json({ error: 'Table token is required' }, { status: 400 })
    }

    if (notes !== undefined && notes !== null && typeof notes !== 'string') {
      return NextResponse.json({ error: 'Order notes must be a string' }, { status: 400 })
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
    const orderItems: Array<{
      menuItemId: string
      variantId: string | null
      qty: number
      unitPrice: number
      itemNotes: string | null
    }> = []

    for (const item of validatedItems.items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
        include: { variants: true },
      })

      if (!menuItem) {
        return NextResponse.json({ error: 'Menu item is invalid' }, { status: 400 })
      }

      const menuItemValidation = validateMenuItemForOrder(menuItem, table.outletId, item.variantId)
      if (!menuItemValidation.valid) {
        return NextResponse.json({ error: menuItemValidation.error }, { status: 400 })
      }

      let unitPrice = Number(menuItem.basePrice)

      // Add variant price if selected
      if (item.variantId) {
        const variant = menuItem.variants.find(({ id }) => id === item.variantId)
        if (!variant) {
          return NextResponse.json({ error: 'Menu variant is invalid' }, { status: 400 })
        }

        unitPrice += Number(variant.additionalPrice)
      }

      totalAmount += unitPrice * item.qty

      orderItems.push({
        menuItemId: item.menuItemId,
        variantId: item.variantId || null,
        qty: item.qty,
        unitPrice,
        itemNotes: item.itemNotes,
      })
    }

    const orderPrefix = table.outlet.slug.toUpperCase().slice(0, 3)

    // Calculate wait estimate
    const newOrderTime = new Date()
    const estimate = await calculateWaitEstimate(table.outletId, newOrderTime)

    const order = await prisma.$transaction(async (tx) => {
      const orderCount = await tx.order.count({
        where: { outletId: table.outletId },
      })

      const orderNumber = `ORD-${orderPrefix}-${String(table.tableNumber).padStart(2, '0')}-${String(orderCount + 1).padStart(3, '0')}`

      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          tableId: table.id,
          outletId: table.outletId,
          status: 'PENDING',
          notes: notes as string | null | undefined,
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

      await tx.table.update({
        where: { id: table.id },
        data: { status: 'ACTIVE' },
      })

      return createdOrder
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
