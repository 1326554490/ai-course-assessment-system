/**
 * 轻量自绘图表（纯 SVG / CSS，零依赖）
 *
 * 因为项目装不了图表库，且要保持低保真统一风格，这里手画几个最常用的：
 *  - DonutChart   环形进度（单值占比，如完成率）
 *  - BarChart     竖直柱状（分档分布，如学生成绩分布）
 *  - HBar         单条横向条（维度掌握度，带标签）
 *
 * 颜色走 currentColor / 传入 class，跟随主题。
 */

/* ============================================================
 * 环形进度图
 * ============================================================ */
export function DonutChart({
  value,
  size = 96,
  stroke = 10,
  color = 'text-brand',
  track = 'text-ink-100',
  children,
}: {
  /** 0-1 */
  value: number
  size?: number
  stroke?: number
  /** 进度色（text-*，用 stroke=currentColor 取色） */
  color?: string
  /** 轨道色 */
  track?: string
  /** 圆心内容（如百分比文字） */
  children?: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  const dash = c * v

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className={track}
          stroke="currentColor"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={color}
          stroke="currentColor"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      )}
    </div>
  )
}

/* ============================================================
 * 竖直柱状图（分档分布）
 * ============================================================ */
export function BarChart({
  data,
  height = 120,
}: {
  data: { label: string; value: number; color?: string }[]
  height?: number
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {data.map((d, i) => {
        const h = max === 0 ? 0 : (d.value / max) * (height - 28)
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5 min-w-0">
            <span className="text-xs font-medium text-ink-900">{d.value}</span>
            <div
              className={'w-full rounded-t-md transition-all ' + (d.color ?? 'bg-brand')}
              style={{ height: Math.max(4, h) }}
            />
            <span className="text-[10px] text-ink-500 truncate w-full text-center leading-tight">
              {d.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ============================================================
 * 横向条（维度掌握 / 比例）
 * ============================================================ */
export function HBar({
  label,
  value,
  hint,
  color = 'bg-brand',
}: {
  label: string
  /** 0-1 */
  value: number
  hint?: string
  color?: string
}) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-ink-900 truncate pr-2">{label}</span>
        <span className="text-ink-500 shrink-0">{hint ?? `${pct}%`}</span>
      </div>
      <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
        <div className={'h-full rounded-full transition-all ' + color} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
