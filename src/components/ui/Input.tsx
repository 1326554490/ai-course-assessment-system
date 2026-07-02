import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props
  return <input className={`lf-input ${className}`} {...rest} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = '', rows = 3, ...rest } = props
  return <textarea rows={rows} className={`lf-textarea ${className}`} {...rest} />
}
