import type { MultipleRendererProps } from './types'

export function MultipleRenderer({ question, value, onChange, readOnly }: MultipleRendererProps) {
  if (value.type !== 'multipleChoice') return null
  const set = new Set(value.optionIds)
  const style = question.optionStyle ?? 'list'

  function toggle(id: string) {
    if (readOnly) return
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange({ type: 'multipleChoice', optionIds: Array.from(next) })
  }

  /* —— 图片宫格式 —— */
  if (style === 'grid') {
    return (
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {question.options.map((opt) => {
            const checked = set.has(opt.id)
            return (
              <button
                key={opt.id}
                type="button"
                disabled={readOnly}
                onClick={() => toggle(opt.id)}
                className={
                  'text-center border rounded-xl overflow-hidden transition ' +
                  (checked
                    ? 'border-brand ring-2 ring-brand/20 bg-brand-softer'
                    : 'border-ink-200 hover:border-ink-300') +
                  (readOnly ? ' opacity-90' : '')
                }
              >
                <div className="relative aspect-[4/3] bg-ink-50 flex items-center justify-center overflow-hidden">
                  {opt.image ? (
                    <img src={opt.image} alt={opt.content} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-ink-300 text-xs">无配图</span>
                  )}
                  {checked && (
                    <div className="absolute inset-0 bg-brand/20 flex items-center justify-center">
                      <span className="w-8 h-8 rounded border-2 border-white bg-brand text-white flex items-center justify-center text-lg font-bold">
                        ✓
                      </span>
                    </div>
                  )}
                </div>
                <div className="px-2 py-2.5 text-xs">
                  <span className="text-ink-500 mr-1">{opt.label}.</span>
                  <span className={checked ? 'text-brand-text font-medium' : 'text-ink-900'}>
                    {opt.content}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
        <div className="text-[11px] text-ink-500 pt-2">提示：本题为多选题，可选多个</div>
      </div>
    )
  }

  /* —— 卡片式 —— */
  if (style === 'card') {
    return (
      <div className="space-y-2.5">
        {question.options.map((opt) => {
          const checked = set.has(opt.id)
          return (
            <button
              key={opt.id}
              type="button"
              disabled={readOnly}
              onClick={() => toggle(opt.id)}
              className={
                'w-full text-left flex items-start gap-3 p-3.5 border rounded-xl transition ' +
                (checked
                  ? 'border-brand bg-brand-softer ring-2 ring-brand/15'
                  : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50') +
                (readOnly ? ' opacity-90' : '')
              }
            >
              <span
                className={
                  'mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ' +
                  (checked ? 'border-brand bg-brand text-white' : 'border-ink-300')
                }
              >
                {checked && <span className="text-[10px] leading-none">✓</span>}
              </span>
              {opt.image && (
                <img src={opt.image} alt={opt.content} className="w-20 h-20 rounded-lg object-cover shrink-0" />
              )}
              <span className="flex-1 min-w-0">
                <span className={'text-sm block ' + (checked ? 'text-brand-text font-medium' : 'text-ink-900')}>
                  <span className="text-ink-500 mr-1">{opt.label}.</span>
                  {opt.content}
                </span>
                {opt.desc && (
                  <span className="text-xs text-ink-500 mt-1 block leading-relaxed">{opt.desc}</span>
                )}
              </span>
            </button>
          )
        })}
        <div className="text-[11px] text-ink-500 pt-0.5">提示：本题为多选题，可选多个</div>
      </div>
    )
  }

  /* —— 列表式（默认）—— */
  return (
    <ul className="space-y-2">
      {question.options.map((opt) => {
        const checked = set.has(opt.id)
        return (
          <li key={opt.id}>
            <label
              className={
                'flex items-center gap-3 px-3 py-2.5 border rounded-lg cursor-pointer text-sm ' +
                (checked
                  ? 'border-brand bg-brand-softer text-brand-text'
                  : 'border-ink-200 hover:bg-ink-50 text-ink-900') +
                (readOnly ? ' pointer-events-none opacity-90' : '')
              }
            >
              <input
                type="checkbox"
                className="accent-brand"
                checked={checked}
                disabled={readOnly}
                onChange={() => toggle(opt.id)}
              />
              <span className="font-medium w-5 text-ink-500">{opt.label}.</span>
              <span className="flex-1">{opt.content}</span>
            </label>
          </li>
        )
      })}
      <li className="text-[11px] text-ink-500 pt-1">提示：本题为多选题，可选多个</li>
    </ul>
  )
}
