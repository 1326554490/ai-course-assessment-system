import type { RatingRendererProps } from './types'

/**
 * 星级量表渲染器（问卷）
 * 学生点击星/数字档表达程度，不计分。
 */
export function RatingRenderer({ question, value, onChange, readOnly }: RatingRendererProps) {
  if (value.type !== 'ratingScale') return null
  const max = question.max ?? 5
  const style = question.style ?? 'star'
  const current = value.value ?? 0
  const labels = question.labels

  function pick(n: number) {
    if (readOnly) return
    onChange({ type: 'ratingScale', value: n === current ? null : n })
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        {Array.from({ length: max }).map((_, i) => {
          const n = i + 1
          const active = n <= current
          if (style === 'number') {
            return (
              <button
                key={n}
                type="button"
                disabled={readOnly}
                onClick={() => pick(n)}
                className={
                  'w-9 h-9 rounded-lg border text-sm transition ' +
                  (active
                    ? 'border-brand bg-brand text-white'
                    : 'border-ink-200 text-ink-600 hover:border-brand')
                }
              >
                {n}
              </button>
            )
          }
          return (
            <button
              key={n}
              type="button"
              disabled={readOnly}
              onClick={() => pick(n)}
              className={
                'text-2xl leading-none transition ' +
                (active ? 'text-amber-400' : 'text-ink-200 hover:text-amber-200')
              }
              aria-label={`${n} 星`}
            >
              ★
            </button>
          )
        })}
        {current > 0 && (
          <span className="ml-2 text-xs text-ink-500">{current} / {max}</span>
        )}
      </div>
      {labels && (
        <div className="flex justify-between text-[11px] text-ink-400 mt-1.5 max-w-[260px]">
          <span>{labels[0]}</span>
          <span>{labels[1]}</span>
        </div>
      )}
    </div>
  )
}
