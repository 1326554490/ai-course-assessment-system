import { useState } from 'react'
import type { MatchRendererProps } from './types'

/**
 * 词组选配题：左右两列，先点左侧再点右侧形成一对；
 * 已配对的项右上角显示编号；点击已配对项可取消该配对。
 * 低保真版本，不画连线。
 */
export function MatchRenderer({
  question,
  value,
  onChange,
  readOnly,
}: MatchRendererProps) {
  const [pendingLeft, setPendingLeft] = useState<string | null>(null)
  if (value.type !== 'wordCompose') return null

  const leftPaired = new Set(value.pairs.map((p) => p.leftId))
  const rightPaired = new Set(value.pairs.map((p) => p.rightId))

  const getPairIndex = (leftId: string) =>
    value.pairs.findIndex((p) => p.leftId === leftId)

  function clickLeft(id: string) {
    if (readOnly || value.type !== 'wordCompose') return
    if (leftPaired.has(id)) {
      onChange({ type: 'wordCompose', pairs: value.pairs.filter((p) => p.leftId !== id) })
      return
    }
    setPendingLeft(pendingLeft === id ? null : id)
  }

  function clickRight(id: string) {
    if (readOnly || value.type !== 'wordCompose') return
    if (rightPaired.has(id)) {
      onChange({ type: 'wordCompose', pairs: value.pairs.filter((p) => p.rightId !== id) })
      return
    }
    if (!pendingLeft) return
    onChange({
      type: 'wordCompose',
      pairs: [...value.pairs, { leftId: pendingLeft, rightId: id }],
    })
    setPendingLeft(null)
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        {/* 左列 */}
        <ul className="space-y-2">
          {question.leftItems.map((it) => {
            const paired = leftPaired.has(it.id)
            const active = pendingLeft === it.id
            const idx = getPairIndex(it.id)
            return (
              <li key={it.id}>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => clickLeft(it.id)}
                  className={
                    'w-full text-left px-3 py-2.5 text-sm rounded border transition ' +
                    (paired
                      ? 'border-brand bg-brand-softer text-brand-text'
                      : active
                        ? 'border-brand bg-white text-ink-900 ring-1 ring-brand'
                        : 'border-ink-200 bg-white text-ink-900 hover:bg-ink-50')
                  }
                >
                  <span className="flex items-center justify-between">
                    <span>{it.content}</span>
                    {paired && (
                      <span className="text-[11px] text-brand-text">#{idx + 1}</span>
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        {/* 右列 */}
        <ul className="space-y-2">
          {question.rightItems.map((it) => {
            const paired = rightPaired.has(it.id)
            const pair = value.pairs.find((p) => p.rightId === it.id)
            const idx = pair ? getPairIndex(pair.leftId) : -1
            return (
              <li key={it.id}>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => clickRight(it.id)}
                  className={
                    'w-full text-left px-3 py-2.5 text-sm rounded border transition ' +
                    (paired
                      ? 'border-brand bg-brand-softer text-brand-text'
                      : 'border-ink-200 bg-white text-ink-900 hover:bg-ink-50')
                  }
                >
                  <span className="flex items-center justify-between">
                    <span>{it.content}</span>
                    {paired && (
                      <span className="text-[11px] text-brand-text">#{idx + 1}</span>
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="mt-2 text-[11px] text-ink-500">
        提示：先点左侧选项，再点右侧匹配；点击已配对项可取消该配对。
        {pendingLeft && (
          <span className="ml-2 text-brand-text">
            已选中左侧"
            {question.leftItems.find((x) => x.id === pendingLeft)?.content}
            "，请点击右侧
          </span>
        )}
      </div>
    </div>
  )
}
