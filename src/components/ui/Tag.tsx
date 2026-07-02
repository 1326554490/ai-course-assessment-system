import type { ReactNode } from 'react'

interface TagProps {
  variant?: 'default' | 'brand'
  children: ReactNode
  className?: string
}

export function Tag({ variant = 'default', children, className = '' }: TagProps) {
  const cls = variant === 'brand' ? 'lf-tag-brand' : 'lf-tag'
  return <span className={`${cls} ${className}`}>{children}</span>
}
