import { useState } from 'react'
import type { FillRendererProps } from './types'

/**
 * 填空题渲染器
 *
 * 核心定位：**固定关键词 / 术语 / 短语**，答案相对固定、可机器评分。
 * 若需要大段解释 → 改用简答题；下拉选词 → 改用单选题。
 *
 * 4 种展示方式（按 question.fillStyle 切换，与教师端配置面板一一对应）：
 * 1. single   - 单空输入式（核心术语 / 关键词）
 * 2. inline   - 句中填空式（用 ___ 标记空位，补全定义 / 固定表达）
 * 3. multi    - 多空填空式（默认，多个相关概念）
 * 4. material - 材料辅助式（看图 / 案例后填写）
 */
export function FillRenderer({ question, value, onChange, readOnly }: FillRendererProps) {
  if (value.type !== 'fillBlank') return null

  const fillStyle = question.fillStyle ?? ((question.blanks ?? 1) === 1 ? 'single' : 'multi')
  const blanks = question.blanks ?? 1
  const placeholder = question.placeholder ?? '请填写'

  function set(i: number, text: string) {
    if (value.type !== 'fillBlank') return
    const next = [...value.blanks]
    while (next.length < blanks) next.push('')
    next[i] = text
    onChange({ type: 'fillBlank', blanks: next })
  }

  /* === 2. 句中填空式：解析 ___ 模板，把空位替换成输入框 === */
  if (fillStyle === 'inline' && question.inlineText) {
    const segments = question.inlineText.split('___')
    let blankIdx = -1
    return (
      <div className="text-sm text-ink-900 leading-loose flex flex-wrap items-center gap-y-2">
        {segments.map((seg, i) => {
          const nodes = [<span key={`s${i}`}>{seg}</span>]
          // 段与段之间插入一个空位（最后一段后面不插）
          if (i < segments.length - 1) {
            blankIdx += 1
            const idx = blankIdx
            nodes.push(
              <input
                key={`b${i}`}
                type="text"
                className="inline-block border-b-2 border-brand bg-transparent w-28 mx-1.5 text-center text-sm text-brand-text font-medium focus:outline-none focus:border-brand-hover disabled:border-ink-300 disabled:text-ink-500"
                placeholder="____"
                value={value.blanks[idx] ?? ''}
                disabled={readOnly}
                maxLength={30}
                onChange={(e) => set(idx, e.target.value)}
              />,
            )
          }
          return nodes
        })}
      </div>
    )
  }

  /* === 4. 材料辅助式：先展示材料图，再给输入框 === */
  if (fillStyle === 'material') {
    return (
      <div className="space-y-3">
        {question.materialImage && (
          <img
            src={question.materialImage}
            alt="材料图"
            className="rounded border border-ink-200 max-h-48 object-contain"
          />
        )}
        <BlankInputs
          blanks={blanks}
          value={value.blanks}
          placeholder={placeholder}
          readOnly={readOnly}
          onSet={set}
        />
      </div>
    )
  }

  /* === 1. 单空 / 3. 多空（默认） === */
  return (
    <BlankInputs
      blanks={blanks}
      value={value.blanks}
      placeholder={placeholder}
      readOnly={readOnly}
      onSet={set}
    />
  )
}

/* ---------- 通用：一组填空输入框（单空 / 多空共用） ---------- */
function BlankInputs({
  blanks,
  value,
  placeholder,
  readOnly,
  onSet,
}: {
  blanks: number
  value: string[]
  placeholder: string
  readOnly?: boolean
  onSet: (i: number, text: string) => void
}) {
  return (
    <div className="space-y-2">
      {Array.from({ length: blanks }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          {blanks > 1 && (
            <span className="text-xs text-ink-500 w-12 shrink-0">第 {i + 1} 空</span>
          )}
          <input
            type="text"
            className="lf-input !h-9 max-w-md"
            placeholder={placeholder}
            value={value[i] ?? ''}
            disabled={readOnly}
            maxLength={30}
            onChange={(e) => onSet(i, e.target.value)}
          />
          <span className="text-[10px] text-ink-400 shrink-0">≤ 30 字</span>
        </div>
      ))}
    </div>
  )
}

/* ---------- 提示辅助式：带"看提示"按钮 ---------- */
function HintFill({
  blanks,
  value,
  placeholder,
  hint,
  readOnly,
  onSet,
}: {
  blanks: number
  value: string[]
  placeholder: string
  hint?: string
  readOnly?: boolean
  onSet: (i: number, text: string) => void
}) {
  const [showHint, setShowHint] = useState(false)
  return (
    <div className="space-y-2">
      <BlankInputs
        blanks={blanks}
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        onSet={onSet}
      />
      {hint && (
        <div>
          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            className="text-[11px] bg-brand-softer text-brand-text border border-brand-soft px-2.5 h-7 rounded inline-flex items-center gap-1 hover:bg-brand-soft transition"
          >
            🔍 {showHint ? '收起提示' : '看提示'}
          </button>
          {showHint && (
            <div className="mt-2 text-xs text-ink-700 bg-amber-50 border border-amber-100 rounded p-2.5 leading-relaxed">
              💡 {hint}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

