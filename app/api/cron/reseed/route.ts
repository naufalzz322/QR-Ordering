import { NextResponse } from 'next/server'
import { seedDemoData } from '@/prisma/seed'
import { isCronAuthorized } from '@/lib/cronAuth'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// POST /api/cron/reseed - Destructively recreate the portfolio demo data.
// Requires Authorization: Bearer <CRON_SECRET>.
export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await seedDemoData()

    return NextResponse.json({
      ok: true,
      message: 'Demo data reseeded successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Demo reseed failed:', error)
    return NextResponse.json({ error: 'Demo reseed failed' }, { status: 500 })
  }
}

export function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405, headers: { Allow: 'POST' } }
  )
}
