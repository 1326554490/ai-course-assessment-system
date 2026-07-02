import type { ClassifyRendererProps } from './types'

/**
 * 分类题：左侧"待分类项"列出未分配，点击某个分类按钮放入；
 * 已分到分类的项可点 × 取回。
 * 低保真版本，不使用拖拽。
 */
export function ClassifyRenderer({
  question,
  value,
  onChange,
  readOnly,
}: ClassifyRendererProps) {
  if (value.type !== 'classify') return null

  const mapping = value.mapping
  const unassigned = question.items.filter((it) => !mapping[it.id])

  function assign(itemId: string, categoryId: string) {
    if (readOnly) return
    onChange({
      type: 'classify',
      mapping: { ...mapping, [itemId]: categoryId },
    })
  }
  function unassign(itemId: string) {
    if (readOnly) return
    const next = { ...mapping }
    delete next[itemId]
    onChange({ type: 'classify', mapping: next })
  }

  return (
    <div className="space-y-3">
      {/* 未分类区 */}
      <div className="border border-dashed border-ink-300 rounded p-3 bg-ink-50">
        <div className="text-xs text-ink-500 mb-2">待分类（点击分类按钮放入）</div>
        {unassigned.length === 0 ? (
          <div className="text-xs text-ink-500 py-1">已全部分类完成</div>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {unassigned.map((it) => (
              <li
                key={it.id}
                className="px-3 py-1.5 bg-white border border-ink-200 rounded text-sm flex items-center gap-2"
              >
                <span>{it.content}</span>
                <span className="text-[11px] text-ink-500">→</span>
                {question.categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={readOnly}
                    onClick={() => assign(it.id, c.id)}
                    className="px-2 h-6 text-[11px] rounded border border-ink-200 text-ink-700 hover:border-brand hover:text-brand-text"
                  >
                    {c.name}
                  </button>
                ))}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 各分类列 */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${question.categories.length}, minmax(0, 1fr))` }}
      >
        {question.categories.map((c) => {
          const items = question.items.filter((it) => mapping[it.id] === c.id)
          return (
            <div
              key={c.id}
              className="border border-ink-200 rounded bg-white p-3 min-h-[120px]"
            >
              <div className="text-sm font-medium text-ink-900 mb-2">{c.name}</div>
              {items.length === 0 ? (
                <div className="text-xs text-ink-500">暂无</div>
              ) : (
                <ul className="space-y-1.5">
                  {items.map((it) => (
                    <li
                      key={it.id}
                      className="flex items-center justify-between px-2 py-1 rounded bg-brand-softer border border-brand-soft text-xs text-brand-text"
                    >
                      <span>{it.content}</span>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => unassign(it.id)}
                          className="text-ink-500 hover:text-ink-900 ml-2"
                          aria-label="取回"
                        >
                          ×
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
