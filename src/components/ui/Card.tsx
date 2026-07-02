import type { ReactNode } from 'react'

interface CardProps {
  title?: ReactNode
  extra?: ReactNode      // 卡片右上角操作区
  className?: string
  children: ReactNode
}

/**
 * 低保真卡片：白底、灰边、轻投影、无圆角夸张
 */
export function Card({ title, extra, className = '', children }: CardProps) {
  return (
    <section className={`lf-card ${className}`}>
      {(title || extra) && (
        <header className="lf-card-title">
          <span className="text-ink-900">{title}</span>
          {extra && <span className="text-ink-500">{extra}</span>}
        </header>
      )}
      <div>{children}</div>
    </section>
  )
}
