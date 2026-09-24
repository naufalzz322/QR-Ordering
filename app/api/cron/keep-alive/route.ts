import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/cron/keep-alive - Keep Supabase project active (free tier pauses after 7 days of inactivity)
// Trigger via cron-job.org every few hours: https://<app-url>/api/cron/keep-alive
// Authorization header: Bearer <CRON_SECRET>

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret) {
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Real database traffic resets Supabase's inactivity timer
    const result = await prisma.$queryRaw`SELECT 1 AS ok`

    return NextResponse.json({
      ok: true,
      db: result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Keep-alive failed:', error)
    return NextResponse.json({ error: 'Keep-alive failed' }, { status: 500 })
  }
}
