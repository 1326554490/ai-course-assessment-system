import type { JudgeRendererProps } from './types'

/**
 * 判断题渲染器（三种展示方式，答案统一为 boolean）
 *  - slider 滑动判断（默认）：左右滑块
 *  - button 按钮式：对 / 错 两个按钮
 *  - card   卡片式：两张大卡片带图标
 * 三者数据一致，仅交互呈现不同，由 question.judgeStyle 决定。
 */
export function JudgeRenderer({ question, value, onChange, readOnly }: JudgeRendererProps) {
  if (value.type !== 'judge') return null
  const v = value.value // true=对 / false=错 / null=未答
  const style = question.judgeStyle ?? 'slider'
  const [labelTrue, labelFalse] = labelsOf(question.judgeLabels)

  function pick(next: boolean) {
    if (readOnly) return
    onChange({ type: 'judge', value: next })
  }

  if (style === 'button') {
    return (
      <div className="flex gap-3 max-w-sm">
        {[
          { val: true, label: labelTrue, mark: '✓' },
          { val: false, label: labelFalse, mark: '✗' },
        ].map((o) => {
          const active = v === o.val
          return (
            <button
              key={String(o.val)}
              type="button"
              disabled={readOnly}
              onClick={() => pick(o.val)}
              className={
                'flex-1 h-11 rounded-lg border text-sm font-medium transition inline-flex items-center justify-center gap-1.5 ' +
                (active
                  ? o.val
                    ? 'border-brand bg-brand text-white'
                    : 'border-ink-400 bg-ink-500 text-white'
                  : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300')
              }
            >
              <span>{o.mark}</span>
              {o.label}
            </button>
          )
        })}
      </div>
    )
  }

  if (style === 'card') {
    return (
      <div className="grid grid-cols-2 gap-3 max-w-md">
        {[
          { val: true, label: labelTrue, mark: '✓' },
          { val: false, label: labelFalse, mark: '✗' },
        ].map((o) => {
          const active = v === o.val
          return (
            <button
              key={String(o.val)}
              type="button"
              disabled={readOnly}
              onClick={() => pick(o.val)}
              className={
                'rounded-xl border p-4 flex flex-col items-center gap-2 transition ' +
                (active
                  ? o.val
                    ? 'border-brand bg-brand-softer'
                    : 'border-ink-400 bg-ink-100'
                  : 'border-ink-200 bg-white hover:border-ink-300')
              }
            >
              <span
                className={
                  'w-10 h-10 rounded-full flex items-center justify-center text-xl ' +
                  (active
                    ? o.val
                      ? 'bg-brand text-white'
                      : 'bg-ink-500 text-white'
                    : 'bg-ink-100 text-ink-400')
                }
              >
                {o.mark}
              </span>
              <span className={'text-sm ' + (active ? 'font-medium text-ink-900' : 'text-ink-600')}>
                {o.label}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  // —— 默认：滑动判断 ——
  const knobPos = v === null ? 'left-1/2 -translate-x-1/2' : v ? 'left-[calc(100%-2.75rem)]' : 'left-1'
  return (
    <div className="max-w-xs">
      <div className="relative h-12 rounded-full bg-ink-100 border border-ink-200 flex items-center select-none">
        <button
          type="button"
          disabled={readOnly}
          onClick={() => pick(false)}
          className={
            'flex-1 h-full rounded-full text-sm z-10 transition ' +
            (v === false ? 'text-white font-medium' : 'text-ink-500')
          }
        >
          ✗ {labelFalse}
        </button>
        <button
          type="button"
          disabled={readOnly}
          onClick={() => pick(true)}
          className={
            'flex-1 h-full rounded-full text-sm z-10 transition ' +
            (v === true ? 'text-white font-medium' : 'text-ink-500')
          }
        >
          ✓ {labelTrue}
        </button>
        {v !== null && (
          <span
            className={
              'absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-full transition-all duration-200 ' +
              (v ? 'bg-brand left-[calc(50%+0.125rem)]' : 'bg-ink-400 left-1')
            }
          />
        )}
        {v === null && (
          <span className={'absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-sm border border-ink-200 transition-all ' + knobPos} />
        )}
      </div>
      {v === null && (
        <div className="text-[11px] text-ink-400 mt-1.5 text-center">点击左右选择「{labelTrue} / {labelFalse}」</div>
      )}
    </div>
  )
}

function labelsOf(labels?: [string, string]): [string, string] {
  // labels = [对端, 错端]；缺省为「对 / 错」
  if (labels && labels.length === 2) return labels
  return ['对', '错']
}
