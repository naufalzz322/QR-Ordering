'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ChartData {
  label: string
  value: number
  percentage?: number
}

interface SalesChartProps {
  data: ChartData[]
  title?: string
  showBar?: boolean
  className?: string
}

export function SalesChart({ data, title, showBar = true, className }: SalesChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1)

  if (data.length === 0) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle className="text-sm">{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            Tidak ada data
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => {
            const barWidth = (item.value / maxValue) * 100

            return (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      index === 0 ? 'bg-orange-100 text-orange-600' :
                      index === 1 ? 'bg-gray-100 text-gray-600' :
                      index === 2 ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-50 text-gray-500'
                    )}>
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-xs">
                      {item.percentage ? `${item.percentage}%` : `${item.value}`}
                    </span>
                    <span className="font-semibold text-gray-900 min-w-[60px] text-right">
                      {item.value.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
                {showBar && (
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        index === 0 ? 'bg-orange-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-amber-500' :
                        'bg-gray-300'
                      )}
                      style={{ width: `${Math.max(barWidth, 5)}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Horizontal bar chart for reports
interface HorizontalBarProps {
  data: { hour: string; orders: number }[]
  maxValue: number
  className?: string
}

export function HorizontalBarChart({ data, maxValue, className }: HorizontalBarProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {data.map((item) => {
        const width = (item.orders / maxValue) * 100
        return (
          <div key={item.hour} className="flex items-center gap-3">
            <span className="w-10 text-xs text-gray-500 text-right">{item.hour}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-500 flex items-center justify-end pr-2 min-w-[2rem]"
                style={{ width: `${Math.max(width, 8)}%` }}
              >
                {item.orders > 0 && (
                  <span className="text-xs text-white font-medium">{item.orders}</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Simple pie chart using CSS
interface SimplePieProps {
  data: { label: string; value: number; color: string }[]
  size?: number
  className?: string
}

export function SimplePie({ data, size = 120, className }: SimplePieProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  // Calculate stroke-dasharray for each segment
  const segments: { label: string; value: number; color: string; dashArray: string; rotation: number }[] = []
  let currentRotation = 0

  for (const item of data) {
    const percentage = total > 0 ? item.value / total : 0
    const dashLength = percentage * 2 * Math.PI * 45 // radius = 45
    const dashGap = (1 - percentage) * 2 * Math.PI * 45

    segments.push({
      label: item.label,
      value: item.value,
      color: item.color,
      dashArray: `${dashLength} ${dashGap}`,
      rotation: currentRotation,
    })

    currentRotation += percentage * 360
  }

  return (
    <div className={cn('flex items-center gap-6', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={45}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="20"
          />
          {segments.map((segment, index) => (
            <circle
              key={segment.label}
              cx={size / 2}
              cy={size / 2}
              r={45}
              fill="none"
              stroke={segment.color}
              strokeWidth="20"
              strokeDasharray={segment.dashArray}
              strokeLinecap="round"
              style={{
                transform: `rotate(${segment.rotation}deg)`,
                transformOrigin: 'center',
              }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-gray-600">{item.label}</span>
            <span className="text-gray-900 font-medium ml-auto pl-4">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
