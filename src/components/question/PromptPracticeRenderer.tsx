import type { PromptRendererProps } from './types'

/**
 * Prompt 练习渲染器（测评）
 * 学生按结构提示编写一段 Prompt。需教师 / AI 评，作答为文本。
 */
export function PromptPracticeRenderer({ question, value, onChange, readOnly }: PromptRendererProps) {
  if (value.type !== 'promptPractice') return null
  const structure = question.structure ?? []

  return (
    <div className="space-y-3">
      {question.goal && (
        <div className="text-xs text-ink-700 bg-brand-softer border border-brand-soft rounded-lg p-3 leading-relaxed">
          <span className="font-medium text-brand-text">任务目标：</span>
          {question.goal}
        </div>
      )}

      {structure.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-ink-500">建议包含：</span>
          {structure.map((s, i) => (
            <span
              key={i}
              className="text-[11px] bg-ink-100 text-ink-700 rounded-md px-2 h-6 inline-flex items-center"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      <textarea
        rows={5}
        disabled={readOnly}
        value={value.text}
        onChange={(e) => onChange({ type: 'promptPractice', text: e.target.value })}
        placeholder="在这里写下你的 Prompt……"
        className="lf-textarea !text-sm font-mono leading-relaxed"
      />

      {question.example && !readOnly && (
        <details className="text-xs">
          <summary className="text-brand-text cursor-pointer select-none">查看示例 Prompt</summary>
          <div className="mt-2 text-ink-600 bg-ink-50 border border-ink-100 rounded-lg p-3 leading-relaxed whitespace-pre-wrap">
            {question.example}
          </div>
        </details>
      )}
    </div>
  )
}
