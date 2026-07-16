import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { config } from '@/lib/config'

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

// GET /api/admin/tables - Get all tables
export async function GET() {
  try {
    const tables = await prisma.table.findMany({
      where: { outlet: { slug: config.outletSlug } },
      orderBy: { tableNumber: 'asc' },
      include: {
        orders: {
          where: { status: { in: ['PENDING', 'PROCESSING', 'READY'] } },
          select: { id: true, status: true, orderNumber: true, createdAt: true, totalAmount: true },
        },
      },
    })

    return NextResponse.json({ tables })
  } catch (error) {
    console.error('Failed to fetch tables:', error)
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 })
  }
}

// POST /api/admin/tables - Generate tables
export async function POST(request: Request) {
  try {
    const { count } = await request.json()
    const outletSlug = config.outletSlug

    const outlet = await prisma.outlet.findUnique({
      where: { slug: outletSlug },
    })

    if (!outlet) {
      return NextResponse.json({ error: 'Outlet not found' }, { status: 404 })
    }

    // Get existing table numbers
    const existingTables = await prisma.table.findMany({
      where: { outletId: outlet.id },
      select: { tableNumber: true },
    })

    const existingNumbers = new Set(existingTables.map((t) => t.tableNumber))

    // Find available numbers - fill gaps first, then continue from max
    const maxTableNumber = Math.max(0, ...existingTables.map((t) => t.tableNumber))
    const newTables = []
    const usedNumbers: number[] = []

    for (let i = 1; i <= count; i++) {
      let tableNumber: number | undefined

      // First, find lowest available number (fill gaps)
      for (let n = 1; n <= maxTableNumber; n++) {
        if (!existingNumbers.has(n) && !usedNumbers.includes(n)) {
          tableNumber = n
          break
        }
      }

      // If no gaps found, use next number after max
      if (tableNumber === undefined) {
        tableNumber = maxTableNumber + i
      }

      usedNumbers.push(tableNumber)
      const table = await prisma.table.create({
        data: {
          outletId: outlet.id,
          tableNumber: tableNumber,
          qrToken: generateSecureToken(),
          status: 'EMPTY',
        },
      })
      newTables.push(table)
    }

    // Get all tables
    const allTables = await prisma.table.findMany({
      where: { outletId: outlet.id },
      orderBy: { tableNumber: 'asc' },
    })

    return NextResponse.json({
      message: `Generated ${newTables.length} new tables`,
      tables: allTables,
    })
  } catch (error) {
    console.error('Failed to generate tables:', error)
    return NextResponse.json({ error: 'Failed to generate tables' }, { status: 500 })
  }
}
