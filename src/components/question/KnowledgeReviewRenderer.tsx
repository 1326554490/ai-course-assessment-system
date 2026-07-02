import { useState } from 'react'
import type { ReviewRendererProps } from './types'

/**
 * 知识回顾渲染器（测评，不计分）
 * 课后复盘：翻转卡片 / 点击揭示 / 列表展开。学生侧只记录"已查看哪些卡片"。
 */
export function KnowledgeReviewRenderer({ question, value, onChange, readOnly }: ReviewRendererProps) {
  if (value.type !== 'knowledgeReview') return null
  const cards = question.cards ?? []
  const style = question.reviewStyle ?? 'flip'
  const viewed = new Set(value.viewedCardIds)

  function markViewed(id: string) {
    if (readOnly || viewed.has(id)) return
    onChange({ type: 'knowledgeReview', viewedCardIds: [...value.viewedCardIds, id] })
  }

  return (
    <div className="space-y-3">
      <div className="text-[11px] text-ink-500">
        本环节用于知识复盘，不计分 · 已查看 {viewed.size} / {cards.length}
      </div>
      <div className={style === 'flip' ? 'grid grid-cols-2 gap-3' : 'space-y-2'}>
        {cards.map((c) => (
          <ReviewCardView
            key={c.id}
            front={c.front}
            back={c.back}
            style={style}
            onReveal={() => markViewed(c.id)}
          />
        ))}
        {cards.length === 0 && (
          <div className="text-xs text-ink-400 py-6 text-center col-span-2">暂无回顾卡片</div>
        )}
      </div>
    </div>
  )
}

function ReviewCardView({
  front,
  back,
  style,
  onReveal,
}: {
  front: string
  back: string
  style: 'flip' | 'reveal' | 'list'
  onReveal: () => void
}) {
  const [open, setOpen] = useState(style === 'list')

  function toggle() {
    setOpen((v) => !v)
    onReveal()
  }

  // 列表式：标题 + 始终展开的解释
  if (style === 'list') {
    return (
      <div className="border border-ink-200 rounded-lg p-3">
        <div className="text-sm font-medium text-ink-900 mb-1">{front}</div>
        <div className="text-xs text-ink-600 leading-relaxed">{back}</div>
      </div>
    )
  }

  // 翻转 / 揭示：点击后展示背面
  return (
    <button
      type="button"
      onClick={toggle}
      className={
        'text-left border rounded-lg p-4 transition min-h-[84px] flex flex-col justify-center ' +
        (open
          ? 'border-brand bg-brand-softer'
          : 'border-ink-200 bg-white hover:border-brand')
      }
    >
      {!open ? (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink-900">{front}</span>
          <span className="text-[11px] text-ink-400 shrink-0 ml-2">
            {style === 'flip' ? '点击翻转' : '点击揭示'}
          </span>
        </div>
      ) : (
        <div>
          <div className="text-[11px] text-brand-text mb-1">{front}</div>
          <div className="text-xs text-ink-700 leading-relaxed">{back}</div>
        </div>
      )}
    </button>
  )
}
