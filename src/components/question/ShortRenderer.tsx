import { useState } from 'react'
import type { ShortRendererProps } from './types'

/**
 * 简答题渲染器
 *
 * 核心定位：**开放性回答** → 需要教师 / AI 评分
 * - 题干 15-60 字 / 答题提示 0-80 字
 * - 短答 10-50 字 / 普通 50-150 字 / 分析反思 100-300 字
 * - 若是固定关键词答案 → 请改用填空题
 *
 * 5 种展示方式（按 question.shortStyle 切换）：
 * 1. short      - 短答式（1-3 行，建议 10-50 字）
 * 2. long       - 长文本简答式（4-6 行，建议 50-150 字，默认）
 * 3. material   - 图文材料简答式（先看材料再答）
 * 4. structured - 结构化简答式（多字段分别填写）
 * 5. ai         - AI 辅助简答式（带"获取灵感 / 检查表达"按钮）
 */
export function ShortRenderer({ question, value, onChange, readOnly }: ShortRendererProps) {
  if (value.type !== 'shortAnswer') return null
  const shortStyle = (question as any).shortStyle ?? 'long'
  const min = (question as any).minLength ?? (shortStyle === 'short' ? 10 : 50)
  const max = (question as any).maxLength ?? (shortStyle === 'short' ? 50 : 300)
  const placeholder =
    (question as any).placeholder ??
    `请输入你的回答（建议 ${min}-${max} 字）`
  const materialText: string | undefined = (question as any).materialText
  const materialImage: string | undefined = (question as any).materialImage
  const fields: string[] = (question as any).structuredFields ?? []

  const len = value.text.length
  const tooShort = len > 0 && len < min
  const tooLong = len > max

  /* === 5. AI 辅助简答 === */
  if (shortStyle === 'ai') {
    return <AIAssistedTextarea value={value.text} placeholder={placeholder} min={min} max={max} readOnly={readOnly} onChange={(t) => onChange({ type: 'shortAnswer', text: t })} />
  }

  /* === 4. 结构化简答 === */
  if (shortStyle === 'structured' && fields.length > 0) {
    // value.text 用 \n--- 分隔多字段（向后兼容）
    const parts = value.text.split('\n---\n')
    while (parts.length < fields.length) parts.push('')
    return (
      <div className="space-y-3 p-3 bg-ink-50 border border-ink-200 rounded">
        {fields.map((label, i) => (
          <div key={i}>
            <label className="text-xs font-medium text-ink-700 mb-1 block">{label}</label>
            <textarea
              rows={2}
              className="lf-textarea"
              placeholder="请填写..."
              value={parts[i] ?? ''}
              disabled={readOnly}
              onChange={(e) => {
                const next = [...parts]
                next[i] = e.target.value
                onChange({ type: 'shortAnswer', text: next.join('\n---\n') })
              }}
            />
          </div>
        ))}
      </div>
    )
  }

  /* === 3. 图文材料简答 === */
  if (shortStyle === 'material') {
    return (
      <div className="space-y-2">
        {materialImage && (
          <img src={materialImage} alt="材料图" className="rounded border border-ink-200 max-h-40" />
        )}
        {materialText && (
          <div className="text-xs text-ink-700 bg-ink-50 border border-ink-200 rounded p-3 leading-relaxed max-h-40 overflow-y-auto">
            [材料] {materialText}
          </div>
        )}
        <textarea
          rows={5}
          className="lf-textarea"
          placeholder={placeholder}
          value={value.text}
          disabled={readOnly}
          onChange={(e) => onChange({ type: 'shortAnswer', text: e.target.value })}
        />
        <WordCount len={len} min={min} max={max} tooShort={tooShort} tooLong={tooLong} />
      </div>
    )
  }

  /* === 1. 短答 / 2. 长文本（默认） === */
  const rows = shortStyle === 'short' ? 3 : 6
  return (
    <div>
      <textarea
        rows={rows}
        className="lf-textarea"
        placeholder={placeholder}
        value={value.text}
        disabled={readOnly}
        onChange={(e) => onChange({ type: 'shortAnswer', text: e.target.value })}
      />
      <WordCount len={len} min={min} max={max} tooShort={tooShort} tooLong={tooLong} />
    </div>
  )
}

/* ---------- 字数统计行 ---------- */
function WordCount({
  len, min, max, tooShort, tooLong,
}: { len: number; min: number; max: number; tooShort: boolean; tooLong: boolean }) {
  return (
    <div className="mt-1 flex items-center justify-between text-[11px]">
      <span className="text-ink-500">
        {tooShort && <span className="text-amber-700">字数偏少 · </span>}
        {tooLong && <span className="text-red-600">超出字数 · </span>}
        建议 {min}-{max} 字 · 教师 / AI 评分
      </span>
      <span
        className={
          tooLong ? 'text-red-600 font-medium' : tooShort ? 'text-amber-700' : 'text-ink-500'
        }
      >
        {len} / {max} 字
      </span>
    </div>
  )
}

/* ---------- AI 辅助简答 ---------- */
function AIAssistedTextarea({
  value, placeholder, min, max, readOnly, onChange,
}: {
  value: string
  placeholder: string
  min: number
  max: number
  readOnly?: boolean
  onChange: (t: string) => void
}) {
  const [showHint, setShowHint] = useState(false)
  const len = value.length
  const tooShort = len > 0 && len < min
  const tooLong = len > max

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          rows={5}
          className="lf-textarea !pr-32 !bg-blue-50/30 !border-blue-200"
          placeholder={placeholder}
          value={value}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setShowHint((v) => !v)}
          disabled={readOnly}
          className="absolute right-2 bottom-2 text-[11px] bg-brand text-white px-3 h-7 rounded-full inline-flex items-center gap-1 hover:bg-brand-text disabled:opacity-50"
        >
          ✨ {showHint ? '收起' : 'AI 灵感'}
        </button>
      </div>

      {showHint && (
        <div className="text-[11px] bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded leading-relaxed">
          <div className="font-medium mb-1">💡 思考方向（AI 启发）</div>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>先描述现象，再给出原因</li>
            <li>结合生活中常见的例子说明</li>
            <li>从"是什么 / 为什么 / 怎么用"三个角度展开</li>
          </ul>
          <div className="mt-2 text-[10px] text-ink-500">
            AI 不会替你写完整答案，只提供思考方向。
          </div>
        </div>
      )}

      <WordCount len={len} min={min} max={max} tooShort={tooShort} tooLong={tooLong} />
    </div>
  )
}
