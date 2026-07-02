import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary:   'lf-btn-primary',
  secondary: 'lf-btn-secondary',
  ghost:     'lf-btn-ghost',
}

export function Button({
  variant = 'secondary',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button className={`${VARIANT_CLASS[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}
