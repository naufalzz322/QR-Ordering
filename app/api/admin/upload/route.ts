import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { createServerSupabaseClient } from '@/lib/supabase'

// Image compression settings
const MAX_WIDTH = 800
const MAX_HEIGHT = 800
const QUALITY = 80
const THUMBNAIL_SIZE = 200

// Generate unique filename
function generateFilename(): string {
  const randomPart = Math.random().toString(36).substring(2, 15)
  return `${Date.now()}-${randomPart}`
}

// POST /api/admin/upload - Upload and compress image to Supabase Storage
export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Process main image
    const mainImage = sharp(buffer)
    const metadata = await mainImage.metadata()

    // Get original dimensions
    const originalWidth = metadata.width || 0
    const originalHeight = metadata.height || 0

    // Calculate new dimensions (maintain aspect ratio, max 800x800)
    let newWidth = originalWidth
    let newHeight = originalHeight

    if (originalWidth > MAX_WIDTH || originalHeight > MAX_HEIGHT) {
      const aspectRatio = originalWidth / originalHeight
      if (aspectRatio > 1) {
        newWidth = MAX_WIDTH
        newHeight = Math.round(MAX_WIDTH / aspectRatio)
      } else {
        newHeight = MAX_HEIGHT
        newWidth = Math.round(MAX_HEIGHT * aspectRatio)
      }
    }

    // Process main image to JPEG
    const processedMainImage = await mainImage
      .resize(newWidth, newHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: QUALITY })
      .toBuffer()

    // Generate thumbnail
    const thumbnailImage = await sharp(buffer)
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'cover',
        position: 'centre',
      })
      .jpeg({ quality: 70 })
      .toBuffer()

    // Generate unique filenames
    const baseFilename = generateFilename()
    const mainFilename = `${baseFilename}.jpg`
    const thumbnailFilename = `${baseFilename}_thumb.jpg`

    // Upload main image to Supabase Storage
    const { data: mainData, error: mainError } = await supabase.storage
      .from('menu-images')
      .upload(mainFilename, processedMainImage, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (mainError) {
      console.error('Supabase main image upload error:', mainError)
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    // Upload thumbnail to Supabase Storage
    const { data: thumbData, error: thumbError } = await supabase.storage
      .from('menu-images')
      .upload(thumbnailFilename, thumbnailImage, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (thumbError) {
      console.error('Supabase thumbnail upload error:', thumbError)
      // Continue anyway, thumbnail is optional
    }

    // Get public URLs
    const { data: mainPublicUrl } = supabase.storage
      .from('menu-images')
      .getPublicUrl(mainFilename)

    const { data: thumbPublicUrl } = supabase.storage
      .from('menu-images')
      .getPublicUrl(thumbnailFilename)

    const imageUrl = mainPublicUrl.publicUrl
    const thumbnailUrl = thumbPublicUrl.publicUrl

    return NextResponse.json({
      success: true,
      imageUrl,
      thumbnailUrl,
      originalSize: file.size,
      compressedSize: processedMainImage.length,
      dimensions: {
        original: { width: originalWidth, height: originalHeight },
        compressed: { width: newWidth, height: newHeight },
      },
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}

// DELETE /api/admin/upload - Delete uploaded image from Supabase Storage
export async function DELETE(request: Request) {
  try {
    const supabase = createServerSupabaseClient()

    let imageUrl: string

    // Try to get from URL params first, then from body
    const urlParams = new URL(request.url).searchParams.get('url')
    if (urlParams) {
      imageUrl = urlParams
    } else {
      const body = await request.json().catch(() => ({}))
      imageUrl = body.path || body.url || ''
    }

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image path required' }, { status: 400 })
    }

    // Extract filename from URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/menu-images/filename.jpg
    const urlParts = imageUrl.split('/')
    const filename = urlParts[urlParts.length - 1]

    if (!filename) {
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 })
    }

    // Delete main image
    const { error: mainError } = await supabase.storage
      .from('menu-images')
      .remove([filename])

    if (mainError) {
      console.error('Failed to delete main image:', mainError)
    }

    // Also try to delete thumbnail (optional)
    const thumbFilename = filename.replace(/\.jpg$/, '_thumb.jpg')
    await supabase.storage
      .from('menu-images')
      .remove([thumbFilename])
      .catch(() => {}) // Ignore thumbnail delete errors

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
  }
}
