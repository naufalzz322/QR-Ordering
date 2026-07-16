'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { config } from '@/lib/config'
import { QrCode, ArrowLeft, Camera, Keyboard, Loader2, UtensilsCrossed } from 'lucide-react'
import { OrderTrackerFloatingButton } from '@/components/OrderTrackerFloatingButton'

export default function ScanPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'camera' | 'manual'>('manual')
  const [manualCode, setManualCode] = useState('')
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [hasCamera, setHasCamera] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
      setHasCamera(true)
      setMode('camera')
    }
  }, [])

  useEffect(() => {
    if (mode === 'camera' && hasCamera) {
      startCamera()
    }

    return () => {
      stopCamera()
    }
  }, [mode, hasCamera])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      scanQRCode()
    } catch (err) {
      console.error('Camera error:', err)
      setHasCamera(false)
      setMode('manual')
      setError('Kamera tidak tersedia. Gunakan input manual.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  const scanQRCode = async () => {
    if (!videoRef.current || !('BarcodeDetector' in window)) {
      return
    }

    try {
      // @ts-ignore - BarcodeDetector is not in TypeScript types yet
      const detector = new BarcodeDetector({
        formats: ['qr_code'],
      })

      const scan = async () => {
        if (!videoRef.current || scanning) return

        try {
          const barcodes = await detector.detect(videoRef.current)

          if (barcodes.length > 0) {
            const value = barcodes[0].rawValue
            setScanning(true)
            stopCamera()

            const token = extractToken(value)
            if (token) {
              router.push(`/m/${config.outletSlug}?token=${token}`)
            }
          }
        } catch (e) {
          // Continue scanning
        }

        if (!scanning) {
          requestAnimationFrame(scan)
        }
      }

      scan()
    } catch (err) {
      console.log('BarcodeDetector not supported, using manual mode')
      setMode('manual')
    }
  }

  const extractToken = (value: string): string | null => {
    const match = value.match(/\/m\/[^/]+\/([a-zA-Z0-9-_]+)/)
    if (match) {
      return match[1]
    }
    if (/^[a-zA-Z0-9-_]+$/.test(value)) {
      return value
    }
    return null
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) {
      setError('Masukkan kode meja terlebih dahulu')
      return
    }

    const token = extractToken(manualCode.trim())
    if (token) {
      router.push(`/m/${config.outletSlug}?token=${token}`)
    } else {
      setError('Kode tidak valid')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Header */}
      <header className="px-4 py-4 flex items-center gap-4 border-b border-neutral-200 bg-white">
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center">
            <UtensilsCrossed className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-neutral-900">Scan QR</span>
        </Link>
      </header>

      {/* Content */}
      <div className="px-4 py-8 max-w-md mx-auto">
        {/* Mode Toggle */}
        <div className="flex gap-2 mb-8 bg-neutral-100 p-1 rounded-lg">
          <button
            onClick={() => setMode('camera')}
            className={`flex-1 py-3 px-4 rounded-md flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200 ${
              mode === 'camera'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Camera className="w-5 h-5" />
            Kamera
          </button>
          <button
            onClick={() => { setMode('manual'); stopCamera(); }}
            className={`flex-1 py-3 px-4 rounded-md flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200 ${
              mode === 'manual'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Keyboard className="w-5 h-5" />
            Input Manual
          </button>
        </div>

        {/* Camera View */}
        {mode === 'camera' && (
          <div className="space-y-4">
            <div className="relative bg-neutral-900 rounded-2xl overflow-hidden aspect-square">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-56 h-56 relative">
                  <div className="absolute inset-0 border-2 border-white/30 rounded-2xl" />
                  <div className="absolute -top-0.5 -left-0.5 w-10 h-10 border-t-4 border-l-4 border-primary-500 rounded-tl-xl" />
                  <div className="absolute -top-0.5 -right-0.5 w-10 h-10 border-t-4 border-r-4 border-primary-500 rounded-tr-xl" />
                  <div className="absolute -bottom-0.5 -left-0.5 w-10 h-10 border-b-4 border-l-4 border-primary-500 rounded-bl-xl" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-10 h-10 border-b-4 border-r-4 border-primary-500 rounded-br-xl" />
                  {/* Scanning line */}
                  <div className="absolute left-2 right-2 h-0.5 bg-primary-500 top-1/2 animate-pulse" />
                </div>
              </div>
              {/* Scanning indicator */}
              {scanning && (
                <div className="absolute inset-0 bg-neutral-900/70 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-3" />
                    <p className="text-white text-sm font-medium">Memproses...</p>
                  </div>
                </div>
              )}
            </div>
            <p className="text-center text-neutral-600 text-sm">
              Arahkan kamera ke QR code di meja Anda
            </p>
          </div>
        )}

        {/* Manual Input */}
        {mode === 'manual' && (
          <div className="space-y-6">
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <QrCode className="w-10 h-10 text-primary-700" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                Masukkan Kode Meja
              </h2>
              <p className="text-neutral-500 text-sm max-w-xs mx-auto">
                Masukkan kode yang tertera di bawah QR code di meja Anda
              </p>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Contoh: abc123xyz"
                  value={manualCode}
                  onChange={(e) => {
                    setManualCode(e.target.value)
                    setError('')
                  }}
                  className="text-center text-lg uppercase h-14 tracking-wider"
                />
                {error && (
                  <p className="text-error-600 text-sm text-center mt-2">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary-700 hover:bg-primary-800 h-12 text-base font-medium"
              >
                Masuk ke Menu
                <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
              </Button>
            </form>
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-10 text-center">
          <Link href="/">
            <Button variant="link" className="text-neutral-500 hover:text-neutral-700">
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>

      {/* Floating Order Tracker Button */}
      <OrderTrackerFloatingButton />
    </div>
  )
}
