import { useRef } from 'react'

/**
 * 统一图片上传组件
 *
 * - 真实选择文件 → FileReader 转 base64（可存入 localStorage，刷新不丢）
 * - 也支持粘贴图片 URL
 * - 单图 / 多图模式，缩略图预览 + 删除
 *
 * 服务题干配图、选项配图等所有需要图片的场景，避免重复逻辑。
 */
interface ImageUploaderProps {
  /** 当前图片列表（base64 或 URL） */
  value: string[]
  onChange: (next: string[]) => void
  /** 最多几张，默认 1 */
  max?: number
  /** 缩略图尺寸 class，默认 w-20 h-20 */
  thumbClass?: string
}

export function ImageUploader({
  value,
  onChange,
  max = 1,
  thumbClass = 'w-20 h-20',
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const full = value.length >= max

  function addFiles(files: FileList | null) {
    if (!files) return
    const room = max - value.length
    const picked = Array.from(files).slice(0, room)
    let pending = picked.length
    if (pending === 0) return
    const collected: string[] = []
    picked.forEach((f) => {
      const reader = new FileReader()
      reader.onload = () => {
        collected.push(String(reader.result))
        pending -= 1
        if (pending === 0) onChange([...value, ...collected])
      }
      reader.readAsDataURL(f)
    })
  }

  function addUrl() {
    const url = window.prompt('粘贴图片链接（URL）')
    if (url && url.trim()) onChange([...value, url.trim()].slice(0, max))
  }

  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={max > 1}
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files)
          if (inputRef.current) inputRef.current.value = ''
        }}
      />

      <div className="flex flex-wrap gap-2">
        {value.map((src, i) => (
          <div
            key={i}
            className={`relative ${thumbClass} rounded-lg border border-ink-200 overflow-hidden bg-ink-50 group`}
          >
            <img src={src} alt={`配图 ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-ink-900/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              title="移除"
            >
              ×
            </button>
          </div>
        ))}

        {!full && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`${thumbClass} rounded-lg border border-dashed border-ink-300 text-ink-400 hover:border-brand hover:text-brand-text transition flex flex-col items-center justify-center gap-1`}
          >
            <span className="text-lg leading-none">＋</span>
            <span className="text-[10px]">上传图片</span>
          </button>
        )}
      </div>

      {!full && (
        <button
          type="button"
          onClick={addUrl}
          className="text-[11px] text-ink-400 hover:text-brand-text mt-1.5"
        >
          或粘贴图片链接
        </button>
      )}
    </div>
  )
}
