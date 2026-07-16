import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/public/menu/[outletSlug] - Get public menu with caching
export async function GET(
  request: Request,
  { params }: { params: Promise<{ outletSlug: string }> }
) {
  try {
    const { outletSlug } = await params

    // Check cache first (60 second cache)
    const cacheKey = `menu-${outletSlug}`
    const cached = await getCachedData(cacheKey)
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      })
    }

    const outlet = await prisma.outlet.findUnique({
      where: { slug: outletSlug },
    })

    if (!outlet) {
      return NextResponse.json({ error: 'Outlet not found' }, { status: 404 })
    }

    const categories = await prisma.category.findMany({
      where: { outletId: outlet.id, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          where: { outletId: outlet.id },
          orderBy: { sortOrder: 'asc' },
          include: {
            variants: true,
          },
        },
      },
    })

    const result = {
      outlet: {
        name: outlet.name,
        slug: outlet.slug,
        logoUrl: outlet.logoUrl,
      },
      categories,
    }

    // Cache the result
    await setCachedData(cacheKey, result, 60)

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (error) {
    console.error('Failed to fetch menu:', error)
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 })
  }
}

// Simple in-memory cache (in production, use Redis)
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 60 * 1000 // 60 seconds

async function getCachedData(key: string): Promise<any | null> {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  cache.delete(key)
  return null
}

async function setCachedData(key: string, data: any, ttlSeconds: number): Promise<void> {
  cache.set(key, { data, timestamp: Date.now() + ttlSeconds * 1000 })
}
