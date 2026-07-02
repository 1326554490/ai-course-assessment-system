/**
 * 极简的 Markdown 渲染器
 * 支持：H1/H2/H3 / **粗体** / 列表 / 引用 / 段落
 * 不引入第三方库，保持 wireframe 简洁
 */
import { Fragment } from 'react'

interface SimpleMarkdownProps {
  content: string
  className?: string
}

/* ---------- 行内：**粗体** ---------- */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={i} className="text-ink-900 font-medium">{p.slice(2, -2)}</strong>
    }
    return <Fragment key={i}>{p}</Fragment>
  })
}

export function SimpleMarkdown({ content, className = '' }: SimpleMarkdownProps) {
  const lines = content.split('\n')
  const blocks: React.ReactNode[] = []

  let buffer: string[] = []
  let listBuffer: string[] = []
  let listType: 'ul' | 'ol' | null = null

  function flushList() {
    if (listBuffer.length === 0) return
    const Tag = listType === 'ul' ? 'ul' : 'ol'
    const cls =
      listType === 'ul'
        ? 'list-disc pl-6 space-y-1.5 text-sm text-ink-700 mb-3'
        : 'list-decimal pl-6 space-y-1.5 text-sm text-ink-700 mb-3'
    blocks.push(
      <Tag key={`l-${blocks.length}`} className={cls}>
        {listBuffer.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </Tag>,
    )
    listBuffer = []
    listType = null
  }

  function flushParagraph() {
    if (buffer.length === 0) return
    const text = buffer.join(' ').trim()
    if (text) {
      blocks.push(
        <p key={`p-${blocks.length}`} className="text-sm text-ink-700 leading-relaxed mb-3">
          {renderInline(text)}
        </p>,
      )
    }
    buffer = []
  }

  for (const raw of lines) {
    const line = raw.trimEnd()

    // 空行 → 段落分隔
    if (line.trim() === '') {
      flushList()
      flushParagraph()
      continue
    }

    // 标题
    if (line.startsWith('# ')) {
      flushList(); flushParagraph()
      blocks.push(
        <h1 key={`h-${blocks.length}`} className="text-xl font-medium text-ink-900 mb-3 mt-1">
          {renderInline(line.slice(2))}
        </h1>,
      )
      continue
    }
    if (line.startsWith('## ')) {
      flushList(); flushParagraph()
      blocks.push(
        <h2 key={`h-${blocks.length}`} className="text-base font-medium text-ink-900 mb-2 mt-4">
          {renderInline(line.slice(3))}
        </h2>,
      )
      continue
    }
    if (line.startsWith('### ')) {
      flushList(); flushParagraph()
      blocks.push(
        <h3 key={`h-${blocks.length}`} className="text-sm font-medium text-ink-900 mb-2 mt-3">
          {renderInline(line.slice(4))}
        </h3>,
      )
      continue
    }

    // 引用
    if (line.startsWith('> ')) {
      flushList(); flushParagraph()
      blocks.push(
        <blockquote
          key={`q-${blocks.length}`}
          className="border-l-2 border-brand pl-3 py-1 mb-3 text-sm text-ink-700 bg-brand-softer"
        >
          {renderInline(line.slice(2))}
        </blockquote>,
      )
      continue
    }

    // 无序列表
    if (line.startsWith('- ') || line.startsWith('* ')) {
      flushParagraph()
      if (listType === 'ol') flushList()
      listType = 'ul'
      listBuffer.push(line.slice(2))
      continue
    }

    // 有序列表
    const olMatch = line.match(/^(\d+)\.\s+(.*)/)
    if (olMatch) {
      flushParagraph()
      if (listType === 'ul') flushList()
      listType = 'ol'
      listBuffer.push(olMatch[2])
      continue
    }

    // 普通段落（多行合并）
    flushList()
    buffer.push(line)
  }

  flushList()
  flushParagraph()

  return <div className={className}>{blocks}</div>
}
