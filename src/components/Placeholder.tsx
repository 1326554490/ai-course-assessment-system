import { Card, EmptyState } from '@/components/ui'

/**
 * 占位页面：表示该页将在下一阶段实现
 */
interface PlaceholderProps {
  title: string
  hint?: string
}

export function Placeholder({ title, hint }: PlaceholderProps) {
  return (
    <Card title={title}>
      <EmptyState
        title="该页面将在下一阶段实现"
        description={hint ?? '当前为项目骨架，仅占位'}
      />
    </Card>
  )
}
