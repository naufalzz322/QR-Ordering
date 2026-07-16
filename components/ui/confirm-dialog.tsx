'use client'

import { useState, useRef, useCallback } from 'react'
import {
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Loader2
} from 'lucide-react'
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
  onConfirm: () => void | Promise<void>
  loading?: boolean
  destructive?: boolean
}

const variantConfig = {
  danger: {
    icon: XCircle,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    buttonClass: 'bg-red-600 hover:bg-red-700',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    buttonClass: 'bg-amber-600 hover:bg-amber-700',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    buttonClass: 'bg-admin-primary hover:bg-admin-primary/90',
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    buttonClass: 'bg-green-600 hover:bg-green-700',
  },
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'info',
  onConfirm,
  loading = false,
  destructive = false,
}: ConfirmDialogProps) {
  const config = variantConfig[destructive ? 'danger' : variant]
  const Icon = config.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal />
      <DialogOverlay className="bg-black/50" />
      <DialogContent className="max-w-sm bg-white rounded-xl p-6 shadow-2xl">
        <DialogHeader className="text-center sm:text-center">
          <div className={cn(
            'mx-auto mb-4 w-14 h-14 rounded-full flex items-center justify-center',
            config.bgColor,
            config.borderColor,
            'border'
          )}>
            <Icon className={cn('w-7 h-7', config.iconColor)} />
          </div>
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-center text-gray-600">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="flex-row gap-2 sm:gap-2 sm:justify-center mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={cn('flex-1 text-white', destructive ? 'bg-red-600 hover:bg-red-700' : config.buttonClass)}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook for simpler usage
interface ConfirmOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
  destructive?: boolean
}

interface ConfirmResult {
  confirmed: boolean
}

export function useConfirm() {
  const [confirmState, setConfirmState] = useState<{
    open: boolean
    options: ConfirmOptions
  }>({
    open: false,
    options: { title: '' },
  })

  // Use ref to store resolve function (doesn't trigger re-renders)
  const resolveRef = useRef<((result: ConfirmResult) => void) | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<ConfirmResult> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setConfirmState({
        open: true,
        options,
      })
    })
  }, [])

  const handleOpenChange = useCallback((open: boolean) => {
    setConfirmState(prev => ({ ...prev, open }))
    if (!open && resolveRef.current) {
      resolveRef.current({ confirmed: false })
      resolveRef.current = null
    }
  }, [])

  const handleConfirm = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current({ confirmed: true })
      resolveRef.current = null
    }
    setConfirmState(prev => ({ ...prev, open: false }))
  }, [])

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      open={confirmState.open}
      onOpenChange={handleOpenChange}
      title={confirmState.options.title}
      description={confirmState.options.description}
      confirmText={confirmState.options.confirmText}
      cancelText={confirmState.options.cancelText}
      variant={confirmState.options.variant}
      destructive={confirmState.options.destructive}
      onConfirm={handleConfirm}
    />
  )

  return { confirm, ConfirmDialog: ConfirmDialogComponent }
}
