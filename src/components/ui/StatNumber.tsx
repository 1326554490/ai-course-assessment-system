import type { ReactNode } from 'react'

interface StatNumberProps {
  label: string
  value: string | number
  hint?: ReactNode
  className?: string
}

/**
 * 数字看板小卡片：用于"提交人数 / 平均分 / 完成率"等
 */
export function StatNumber({ label, value, hint, className = '' }: StatNumberProps) {
  return (
    <div className={`lf-card !p-4 ${className}`}>
      <div className="text-xs text-ink-500 mb-1">{label}</div>
      <div className="text-2xl font-medium text-ink-900 leading-none">{value}</div>
      {hint != null && <div className="text-xs text-ink-500 mt-2">{hint}</div>}
    </div>
  )
}
