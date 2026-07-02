import type { SortRendererProps } from './types'

/**
 * 排序题渲染器（两种展示方式，数据/判分一致，均用 ↑↓ 调整避免引入拖拽库）
 *  - updown   普通列表 + 上下移按钮（默认）
 *  - timeline 纵向时间线，左侧带节点连线，适合流程 / 时间顺序
 */
export function SortRenderer({ question, value, onChange, readOnly }: SortRendererProps) {
  if (value.type !== 'sort') return null
  const style = question.sortStyle ?? 'updown'

  const order = value.order.length
    ? value.order
    : question.items.map((it) => it.id)

  function move(idx: number, delta: -1 | 1) {
    if (readOnly) return
    const ni = idx + delta
    if (ni < 0 || ni >= order.length) return
    const next = [...order]
    ;[next[idx], next[ni]] = [next[ni], next[idx]]
    onChange({ type: 'sort', order: next })
  }

  /* —— 时间线式 —— */
  if (style === 'timeline') {
    return (
      <div>
        <ol className="relative pl-7">
          {/* 竖线 */}
          <span className="absolute left-[11px] top-2 bottom-2 w-px bg-ink-200" />
          {order.map((id, idx) => {
            const item = question.items.find((it) => it.id === id)
            if (!item) return null
            return (
              <li key={id} className="relative mb-2.5 last:mb-0">
                {/* 节点圆点 */}
                <span className="absolute -left-7 top-2 w-6 h-6 rounded-full bg-brand text-white text-xs flex items-center justify-center font-medium ring-4 ring-white">
                  {idx + 1}
                </span>
                <div className="flex items-center gap-3 px-3 py-2.5 border border-ink-200 rounded-lg bg-white">
                  <span className="flex-1 text-sm text-ink-900">{item.content}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={readOnly || idx === 0}
                      onClick={() => move(idx, -1)}
                      className="w-7 h-7 rounded border border-ink-200 text-ink-500 hover:bg-ink-50 disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="上移"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={readOnly || idx === order.length - 1}
                      onClick={() => move(idx, 1)}
                      className="w-7 h-7 rounded border border-ink-200 text-ink-500 hover:bg-ink-50 disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="下移"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
        <div className="text-[11px] text-ink-500 pt-2 pl-7">提示：按时间 / 流程先后用 ↑ ↓ 调整</div>
      </div>
    )
  }

  /* —— 上下移式（默认）—— */
  return (
    <ol className="space-y-2">
      {order.map((id, idx) => {
        const item = question.items.find((it) => it.id === id)
        if (!item) return null
        return (
          <li
            key={id}
            className="flex items-center gap-3 px-3 py-2.5 border border-ink-200 rounded-lg bg-white"
          >
            <span className="w-6 h-6 rounded bg-brand-soft text-brand-text text-xs flex items-center justify-center font-medium">
              {idx + 1}
            </span>
            <span className="flex-1 text-sm text-ink-900">{item.content}</span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={readOnly || idx === 0}
                onClick={() => move(idx, -1)}
                className="w-7 h-7 rounded border border-ink-200 text-ink-500 hover:bg-ink-50 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="上移"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={readOnly || idx === order.length - 1}
                onClick={() => move(idx, 1)}
                className="w-7 h-7 rounded border border-ink-200 text-ink-500 hover:bg-ink-50 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="下移"
              >
                ↓
              </button>
            </div>
          </li>
        )
      })}
      <li className="text-[11px] text-ink-500 pt-1">
        提示：使用右侧 ↑ ↓ 调整顺序
      </li>
    </ol>
  )
}
