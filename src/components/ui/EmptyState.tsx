interface EmptyStateProps {
  title?: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({
  title = '暂无数据',
  description = '当前页面没有可展示的内容',
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-ink-100 border border-ink-200 mb-4" />
      <div className="text-sm text-ink-700 mb-1">{title}</div>
      <div className="text-xs text-ink-500 mb-4">{description}</div>
      {action}
    </div>
  )
}
