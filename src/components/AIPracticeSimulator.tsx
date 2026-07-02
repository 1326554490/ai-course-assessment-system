import { useState } from 'react'
import { Button, Tag } from '@/components/ui'

/**
 * AI 互动模拟器
 *
 * 根据 practiceType 渲染不同的交互界面：
 *  - chat / textGeneration: 聊天框
 *  - imageRecognition: 图片上传 → 识别结果
 *  - imageGeneration: prompt → 占位图
 *  - speechRecognition: 录音按钮 → 识别文字
 *  - promptWriting: prompt 改写对比
 *
 * 全部使用罐头响应（mock data），不接真实 AI API
 */

type Props = {
  practiceType?: string
  examples?: string[]
  onInteract?: () => void
}

export function AIPracticeSimulator({ practiceType, examples, onInteract }: Props) {
  switch (practiceType) {
    case 'chat':
    case 'textGeneration':
      return <ChatSimulator examples={examples} onInteract={onInteract} />
    case 'imageRecognition':
      return <ImageRecognitionSimulator onInteract={onInteract} />
    case 'imageGeneration':
      return <ImageGenSimulator examples={examples} onInteract={onInteract} />
    case 'speechRecognition':
      return <SpeechSimulator examples={examples} onInteract={onInteract} />
    case 'promptWriting':
      return <PromptWritingSimulator examples={examples} onInteract={onInteract} />
    default:
      return <GenericSimulator examples={examples} onInteract={onInteract} />
  }
}

/* ============================================================
 * 通用：默认占位（无 practiceType）
 * ============================================================ */
function GenericSimulator({ examples, onInteract }: Pick<Props, 'examples' | 'onInteract'>) {
  return (
    <div className="border-2 border-dashed border-ink-300 rounded p-6 bg-ink-50">
      <div className="text-center mb-4">
        <div className="text-4xl mb-3">🤖</div>
        <div className="text-sm text-ink-700 mb-1">AI 互动区</div>
        <div className="text-xs text-ink-500">点下方按钮开始体验</div>
      </div>
      {examples && examples.length > 0 && (
        <div className="bg-white rounded border border-ink-200 p-3 mb-4 max-w-md mx-auto">
          <div className="text-xs text-ink-500 mb-2">示例任务</div>
          <ul className="space-y-1">
            {examples.map((ex, i) => (
              <li key={i} className="text-xs text-ink-700 flex items-start gap-2">
                <span className="text-brand-text">▸</span>
                <span>{ex}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="text-center">
        <Button variant="primary" onClick={onInteract}>
          开始体验
        </Button>
      </div>
    </div>
  )
}

/* ============================================================
 * AI 聊天模拟器
 * ============================================================ */
function ChatSimulator({ examples, onInteract }: Pick<Props, 'examples' | 'onInteract'>) {
  type Msg = { role: 'user' | 'ai'; text: string }
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'ai', text: '你好！我是 AI 助手 🤖，有什么想问我的？' },
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)

  function send(text: string) {
    if (!text.trim()) return
    setMessages((prev) => [...prev, { role: 'user', text }])
    setInput('')
    setThinking(true)
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'ai', text: makeReply(text) }])
      setThinking(false)
      onInteract?.()
    }, 800)
  }

  return (
    <div className="border border-ink-200 rounded bg-white">
      <div className="px-3 py-2 border-b border-ink-200 text-xs text-ink-500 flex items-center justify-between">
        <span>🤖 AI 对话</span>
        <Tag className="!text-[10px]">课堂体验版</Tag>
      </div>
      <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto bg-ink-50/50">
        {messages.map((m, i) => (
          <div
            key={i}
            className={'flex gap-2 ' + (m.role === 'user' ? 'justify-end' : '')}
          >
            {m.role === 'ai' && (
              <div className="w-7 h-7 rounded-full bg-brand-soft border border-brand text-brand-text flex items-center justify-center text-xs shrink-0">
                AI
              </div>
            )}
            <div
              className={
                'max-w-[70%] px-3 py-2 rounded text-sm leading-relaxed ' +
                (m.role === 'user'
                  ? 'bg-brand text-white'
                  : 'bg-white border border-ink-200 text-ink-900')
              }
            >
              {m.text}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-soft border border-brand text-brand-text flex items-center justify-center text-xs shrink-0">
              AI
            </div>
            <div className="px-3 py-2 rounded bg-white border border-ink-200 text-sm text-ink-500">
              思考中…
            </div>
          </div>
        )}
      </div>

      {/* 快捷示例 */}
      {examples && examples.length > 0 && (
        <div className="px-3 py-2 border-t border-ink-100 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-ink-500 mr-1">试试：</span>
          {examples.slice(0, 3).map((ex, i) => (
            <button
              key={i}
              onClick={() => send(ex)}
              className="text-[11px] px-2 h-6 rounded-full bg-ink-50 hover:bg-brand-softer text-ink-700 hover:text-brand-text transition"
              disabled={thinking}
            >
              {ex.length > 16 ? ex.slice(0, 16) + '…' : ex}
            </button>
          ))}
        </div>
      )}

      {/* 输入框 */}
      <div className="px-3 py-2 border-t border-ink-200 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder="输入你的问题..."
          className="flex-1 h-9 border border-ink-200 rounded px-3 text-sm focus:outline-none focus:border-brand"
          disabled={thinking}
        />
        <Button
          variant="primary"
          onClick={() => send(input)}
          disabled={!input.trim() || thinking}
        >
          发送
        </Button>
      </div>
    </div>
  )
}

function makeReply(input: string): string {
  if (input.includes('天气')) return '今天的天气我没法实时查询，不过你可以打开天气 App 看看哦 ☀️'
  if (input.includes('笑话')) return '为什么 AI 不会迷路？因为它走到哪里都自带"导航算法"！😄'
  if (input.includes('感谢') || input.includes('感谢老师')) {
    return '亲爱的老师：\n\n感谢您这段时间的悉心指导...（这是 AI 给你的草稿，你可以再加上自己的真实感受 ✨）'
  }
  return `好问题！「${input.slice(0, 16)}${input.length > 16 ? '…' : ''}」是一个很有意思的话题，我们可以从几个角度来分析。\n\n你可以继续追问，或者换个问题试试看。`
}

/* ============================================================
 * 图像识别模拟器
 * ============================================================ */
function ImageRecognitionSimulator({ onInteract }: Pick<Props, 'onInteract'>) {
  const [stage, setStage] = useState<'idle' | 'uploading' | 'recognizing' | 'done'>('idle')
  const [pickedSample, setPickedSample] = useState<{ emoji: string; label: string; confidence: number } | null>(null)

  const samples = [
    { emoji: '🐱', label: '猫', confidence: 0.97 },
    { emoji: '🐶', label: '狗', confidence: 0.94 },
    { emoji: '🍎', label: '苹果', confidence: 0.92 },
    { emoji: '🌳', label: '树', confidence: 0.88 },
    { emoji: '🚗', label: '汽车', confidence: 0.96 },
  ]

  function pick(sample: typeof samples[number]) {
    setPickedSample(sample)
    setStage('uploading')
    setTimeout(() => setStage('recognizing'), 500)
    setTimeout(() => {
      setStage('done')
      onInteract?.()
    }, 1500)
  }

  return (
    <div className="border border-ink-200 rounded bg-white">
      <div className="px-3 py-2 border-b border-ink-200 text-xs text-ink-500 flex items-center justify-between">
        <span>👁️ 图像识别演示</span>
        <Tag className="!text-[10px]">点图片上传</Tag>
      </div>
      <div className="p-6">
        {stage === 'idle' && (
          <>
            <div className="text-xs text-ink-500 mb-3 text-center">
              选一张图片让 AI 来识别 ↓
            </div>
            <div className="grid grid-cols-5 gap-3">
              {samples.map((s) => (
                <button
                  key={s.label}
                  onClick={() => pick(s)}
                  className="aspect-square border-2 border-dashed border-ink-200 rounded flex items-center justify-center text-4xl hover:border-brand hover:bg-brand-softer transition"
                  title={`点击识别这张${s.label}的图`}
                >
                  {s.emoji}
                </button>
              ))}
            </div>
          </>
        )}
        {stage !== 'idle' && pickedSample && (
          <div className="text-center">
            <div className="w-32 h-32 mx-auto rounded-lg bg-ink-100 flex items-center justify-center text-7xl mb-4">
              {pickedSample.emoji}
            </div>
            {stage === 'uploading' && (
              <div className="text-sm text-ink-500">📤 上传中…</div>
            )}
            {stage === 'recognizing' && (
              <div className="text-sm text-brand-text">🔍 AI 正在识别…</div>
            )}
            {stage === 'done' && (
              <div className="space-y-2">
                <div className="text-xs text-ink-500">识别结果</div>
                <div className="text-xl font-medium text-ink-900">
                  这是一只{pickedSample.label}
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-ink-500">
                  <span>置信度</span>
                  <div className="w-32 h-2 bg-ink-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-brand"
                      style={{ width: `${pickedSample.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-brand-text font-medium">
                    {Math.round(pickedSample.confidence * 100)}%
                  </span>
                </div>
                <button
                  onClick={() => {
                    setStage('idle')
                    setPickedSample(null)
                  }}
                  className="text-xs text-brand-text hover:underline mt-3"
                >
                  ← 再试一张
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================================================
 * AI 绘画模拟器
 * ============================================================ */
function ImageGenSimulator({ examples, onInteract }: Pick<Props, 'examples' | 'onInteract'>) {
  const [prompt, setPrompt] = useState('')
  const [stage, setStage] = useState<'idle' | 'generating' | 'done'>('idle')

  function generate(p: string) {
    if (!p.trim()) return
    setPrompt(p)
    setStage('generating')
    setTimeout(() => {
      setStage('done')
      onInteract?.()
    }, 1500)
  }

  return (
    <div className="border border-ink-200 rounded bg-white">
      <div className="px-3 py-2 border-b border-ink-200 text-xs text-ink-500">
        🎨 AI 绘画演示
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* 输入区 */}
          <div>
            <label className="text-xs text-ink-500 mb-2 block">描述你想画的内容</label>
            <textarea
              rows={6}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="如：一只穿宇航服的小猫"
              className="w-full p-2 border border-ink-200 rounded text-sm focus:outline-none focus:border-brand"
              disabled={stage === 'generating'}
            />
            {examples && examples.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {examples.slice(0, 3).map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(ex)}
                    className="text-[11px] px-2 h-6 rounded-full bg-ink-50 hover:bg-brand-softer text-ink-700 hover:text-brand-text transition"
                  >
                    {ex.length > 12 ? ex.slice(0, 12) + '…' : ex}
                  </button>
                ))}
              </div>
            )}
            <Button
              variant="primary"
              onClick={() => generate(prompt)}
              disabled={!prompt.trim() || stage === 'generating'}
              className="mt-3 w-full"
            >
              {stage === 'generating' ? '生成中…' : '🎨 生成图片'}
            </Button>
          </div>

          {/* 预览区 */}
          <div>
            <label className="text-xs text-ink-500 mb-2 block">AI 作品</label>
            <div className="aspect-square border-2 border-dashed border-ink-200 rounded flex items-center justify-center bg-ink-50 relative overflow-hidden">
              {stage === 'idle' && (
                <span className="text-xs text-ink-500">输入描述并点击生成</span>
              )}
              {stage === 'generating' && (
                <div className="text-center">
                  <div className="text-3xl mb-2 animate-pulse">🎨</div>
                  <div className="text-xs text-brand-text">AI 正在创作…</div>
                </div>
              )}
              {stage === 'done' && (
                <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 flex flex-col items-center justify-center p-4">
                  <div className="text-5xl mb-2">🖼️</div>
                  <div className="text-xs text-ink-700 text-center">
                    根据描述生成的画作
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
 * 语音识别模拟器
 * ============================================================ */
function SpeechSimulator({ examples, onInteract }: Pick<Props, 'examples' | 'onInteract'>) {
  const [stage, setStage] = useState<'idle' | 'recording' | 'recognizing' | 'done'>('idle')
  const [text, setText] = useState('')
  const [pickedSample, setPickedSample] = useState<string | null>(null)

  const cannedResults: Record<string, string> = {
    '今天天气怎么样': '今天天气怎么样',
    '我的名字': '我叫小明，今年十岁',
    '播放音乐': '请播放周杰伦的歌',
  }

  function record(sample?: string) {
    setStage('recording')
    setPickedSample(sample ?? null)
    setTimeout(() => setStage('recognizing'), 1500)
    setTimeout(() => {
      const result = sample ? (cannedResults[sample] ?? sample) : '你说的话已识别'
      setText(result)
      setStage('done')
      onInteract?.()
    }, 2500)
  }

  return (
    <div className="border border-ink-200 rounded bg-white">
      <div className="px-3 py-2 border-b border-ink-200 text-xs text-ink-500">
        👂 语音识别演示
      </div>
      <div className="p-6 text-center">
        <button
          onClick={() => record()}
          disabled={stage === 'recording' || stage === 'recognizing'}
          className={
            'w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl transition ' +
            (stage === 'recording'
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-brand text-white hover:scale-105')
          }
        >
          🎤
        </button>
        <div className="mt-3 text-xs text-ink-500">
          {stage === 'idle' && '点击开始录音'}
          {stage === 'recording' && '🔴 录音中…'}
          {stage === 'recognizing' && '识别中…'}
          {stage === 'done' && '✅ 识别完成'}
        </div>

        {/* 快捷示例 */}
        {stage === 'idle' && examples && examples.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
            <span className="text-[11px] text-ink-500">或试试这些：</span>
            {examples.slice(0, 3).map((ex, i) => {
              const key = Object.keys(cannedResults).find((k) => ex.includes(k))
              return (
                <button
                  key={i}
                  onClick={() => record(key ?? ex)}
                  className="text-[11px] px-2 h-6 rounded-full bg-ink-50 hover:bg-brand-softer text-ink-700 hover:text-brand-text"
                >
                  {ex.length > 14 ? ex.slice(0, 14) + '…' : ex}
                </button>
              )
            })}
          </div>
        )}

        {text && stage === 'done' && (
          <div className="mt-5 max-w-md mx-auto">
            <div className="text-xs text-ink-500 mb-2 text-left">识别结果</div>
            <div className="px-4 py-3 bg-brand-softer border border-brand-soft rounded text-sm text-ink-900 text-left">
              「{text}」
            </div>
            <button
              onClick={() => {
                setStage('idle')
                setText('')
                setPickedSample(null)
              }}
              className="text-xs text-brand-text hover:underline mt-3"
            >
              ← 再试一次
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================================================
 * Prompt 改写演示
 * ============================================================ */
function PromptWritingSimulator({ examples, onInteract }: Pick<Props, 'examples' | 'onInteract'>) {
  const [bad, setBad] = useState('')
  const [stage, setStage] = useState<'idle' | 'improving' | 'done'>('idle')
  const [improved, setImproved] = useState('')

  function improve(p: string) {
    if (!p.trim()) return
    setBad(p)
    setStage('improving')
    setTimeout(() => {
      setImproved(makeImprovedPrompt(p))
      setStage('done')
      onInteract?.()
    }, 1000)
  }

  return (
    <div className="border border-ink-200 rounded bg-white">
      <div className="px-3 py-2 border-b border-ink-200 text-xs text-ink-500">
        🔑 Prompt 改写训练
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* 原始 prompt */}
          <div>
            <label className="text-xs text-ink-500 mb-2 block">
              ❌ 模糊的 Prompt
            </label>
            <textarea
              rows={5}
              value={bad}
              onChange={(e) => setBad(e.target.value)}
              placeholder="例如：写一篇作文"
              className="w-full p-2 border border-ink-200 rounded text-sm focus:outline-none focus:border-brand"
              disabled={stage === 'improving'}
            />
            {examples && examples.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {examples.slice(0, 3).map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setBad(ex.replace(/^任务：/, ''))}
                    className="text-[11px] px-2 h-6 rounded-full bg-ink-50 hover:bg-brand-softer text-ink-700 hover:text-brand-text"
                  >
                    {ex.length > 14 ? ex.slice(0, 14) + '…' : ex}
                  </button>
                ))}
              </div>
            )}
            <Button
              variant="primary"
              onClick={() => improve(bad)}
              disabled={!bad.trim() || stage === 'improving'}
              className="mt-3 w-full"
            >
              {stage === 'improving' ? '改写中…' : '✨ 帮我改得更好'}
            </Button>
          </div>

          {/* 改写结果 */}
          <div>
            <label className="text-xs text-ink-500 mb-2 block">
              ✅ AI 帮你改写后
            </label>
            <div className="border border-ink-200 rounded p-3 min-h-[148px] bg-brand-softer/30 text-sm text-ink-900 leading-relaxed">
              {stage === 'idle' && (
                <span className="text-xs text-ink-500">改写结果会显示在这里</span>
              )}
              {stage === 'improving' && (
                <span className="text-xs text-brand-text">✨ AI 正在帮你优化…</span>
              )}
              {stage === 'done' && (
                <div className="whitespace-pre-wrap">{improved}</div>
              )}
            </div>
            {stage === 'done' && (
              <div className="mt-2 text-[11px] text-ink-500">
                💡 注意 AI 是怎么把模糊变具体的：加任务、加要求、加背景
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function makeImprovedPrompt(bad: string): string {
  if (bad.includes('作文') || bad.includes('写'))
    return `请帮我写一篇 300 字的小学五年级作文，主题是「${bad.replace(/写|作文/g, '')}」。\n\n要求：\n- 用第一人称\n- 有具体场景和细节\n- 语气真诚自然\n- 结尾点出一个小感悟`
  if (bad.includes('画'))
    return `请生成一幅插画：\n\n主题：${bad.replace(/画|帮.*画/g, '')}\n\n风格：温暖卡通风、明亮色彩\n构图：主体居中、背景简洁\n用途：用于小学生作业配图`
  if (bad.includes('讲') || bad.includes('解释'))
    return `请用 5 年级学生能听懂的方式，讲讲「${bad.replace(/讲|解释|解释一下/g, '')}」：\n\n- 先用一个生活化的比喻\n- 然后说原理（不超过 3 句）\n- 最后给一个例子`
  if (bad.includes('计划'))
    return `请帮我做一份 5 年级寒假学习计划：\n\n背景：${bad}\n\n要求：\n- 每天 2 小时左右\n- 学习与休息穿插\n- 包含语文 / 数学 / 英语 / 课外阅读\n- 用表格展示每天的安排`
  return `${bad}\n\n→ 改进版：\n\n请帮我「${bad}」，要求：\n- 明确：说清楚你要什么\n- 具体：给字数 / 风格 / 格式\n- 背景：告诉 AI 这是给谁用的、什么场合`
}
