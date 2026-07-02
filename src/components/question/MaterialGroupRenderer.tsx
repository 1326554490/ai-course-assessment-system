import type { MaterialGroupRendererProps } from './types'

/**
 * 材料组合题渲染器
 * 一段公共材料（materialText，题干图由 QuestionRenderer 顶部统一渲染） +
 * 多个单选子题，每个子题各自选择。
 */
export function MaterialGroupRenderer({ question, value, onChange, readOnly }: MaterialGroupRendererProps) {
  if (value.type !== 'materialGroup') return null
  const subs = question.subQuestions ?? []

  function pick(subId: string, optId: string) {
    if (readOnly) return
    onChange({
      type: 'materialGroup',
      answers: { ...value.answers, [subId]: optId },
    })
  }

  return (
    <div className="space-y-4">
      {/* 公共材料 */}
      {question.materialText && (
        <div className="text-sm text-ink-800 leading-relaxed bg-ink-50 border border-ink-200 rounded-lg p-3.5 whitespace-pre-wrap">
          {question.materialText}
        </div>
      )}

      {/* 子题列表 */}
      <ol className="space-y-4">
        {subs.map((sub, i) => (
          <li key={sub.id} className="border border-ink-200 rounded-lg p-3.5">
            <div className="text-sm text-ink-900 mb-2.5">
              <span className="text-ink-500 mr-1">({i + 1})</span>
              {sub.title || '（未填子题）'}
            </div>
            <ul className="space-y-2">
              {(sub.options ?? []).map((opt) => {
                const checked = value.answers[sub.id] === opt.id
                return (
                  <li key={opt.id}>
                    <label
                      className={
                        'flex items-center gap-3 px-3 py-2 border rounded-lg cursor-pointer text-sm ' +
                        (checked
                          ? 'border-brand bg-brand-softer text-brand-text'
                          : 'border-ink-200 hover:bg-ink-50 text-ink-900') +
                        (readOnly ? ' pointer-events-none opacity-90' : '')
                      }
                    >
                      <input
                        type="radio"
                        className="accent-brand"
                        checked={checked}
                        disabled={readOnly}
                        onChange={() => pick(sub.id, opt.id)}
                      />
                      <span className="font-medium w-5 text-ink-500">{opt.label}.</span>
                      <span className="flex-1">{opt.content}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
        {subs.length === 0 && (
          <li className="text-xs text-ink-400 text-center py-4">暂无子题</li>
        )}
      </ol>
    </div>
  )
}
