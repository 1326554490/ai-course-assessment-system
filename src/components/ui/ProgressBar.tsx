interface ProgressBarProps {
  /** 0-1 */
  value: number
  /** 显示右侧百分比文字 */
  showLabel?: boolean
  className?: string
  /** bar 高度 */
  height?: number
}

/**
 * 低保真进度条：灰色底 + 蓝色填充
 */
export function ProgressBar({
  value,
  showLabel = false,
  className = '',
  height = 8,
}: ProgressBarProps) {
  const safe = Math.max(0, Math.min(1, value))
  const pct = (safe * 100).toFixed(1) + '%'
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="flex-1 bg-ink-100 rounded overflow-hidden"
        style={{ height }}
      >
        <div
          className="h-full bg-brand transition-all"
          style={{ width: pct }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-ink-500 w-12 text-right">{pct}</span>
      )}
    </div>
  )
}
