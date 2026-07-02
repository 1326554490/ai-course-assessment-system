import { useRef } from 'react'
import type { WorkUploadRendererProps } from './types'

/**
 * 作品上传渲染器（问卷）
 * 学生上传作品文件（纯前端只记录文件名）+ 可选文字说明。不计分。
 */
export function WorkUploadRenderer({ question, value, onChange, readOnly }: WorkUploadRendererProps) {
  if (value.type !== 'workUpload') return null
  const inputRef = useRef<HTMLInputElement>(null)
  const accept = question.accept ?? '图片 / PDF / 文档'

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    onChange({ ...value, type: 'workUpload', fileName: f.name })
  }

  return (
    <div className="space-y-3">
      {question.uploadHint && (
        <p className="text-xs text-ink-500 leading-relaxed">{question.uploadHint}</p>
      )}

      <input ref={inputRef} type="file" className="hidden" disabled={readOnly} onChange={onFile} />

      {!value.fileName ? (
        <button
          type="button"
          disabled={readOnly}
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-ink-300 rounded-lg py-8 flex flex-col items-center gap-2 hover:border-brand hover:bg-brand-softer/30 transition disabled:opacity-60"
        >
          <span className="text-sm text-ink-700">点击上传作品</span>
          <span className="text-[11px] text-ink-400">支持 {accept}</span>
        </button>
      ) : (
        <div className="border border-ink-200 rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-brand-softer text-brand-text flex items-center justify-center text-xs shrink-0">
            ✓
          </div>
          <span className="flex-1 text-sm text-ink-900 truncate">{value.fileName}</span>
          {!readOnly && (
            <button
              type="button"
              onClick={() => onChange({ ...value, type: 'workUpload', fileName: null })}
              className="text-[11px] text-ink-500 hover:text-red-600"
            >
              重新上传
            </button>
          )}
        </div>
      )}

      {question.needNote && (
        <textarea
          rows={3}
          disabled={readOnly}
          value={value.note}
          onChange={(e) => onChange({ ...value, type: 'workUpload', note: e.target.value })}
          placeholder="给你的作品加一段说明（可选）"
          className="lf-textarea !text-sm"
        />
      )}
    </div>
  )
}
