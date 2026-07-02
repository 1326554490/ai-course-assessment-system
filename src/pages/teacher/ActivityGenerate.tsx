import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Input, Tag, Icon } from '@/components/ui'
import { QuestionRenderer } from '@/components/question'
import { getActivityById, getCourses, saveActivity } from '@/store'
import { createEmptyAnswer, uid, extractFromText, extractFromFileName } from '@/utils'
import { generateQuestions } from '@/services/ai'
import { QUESTION_TYPE_LABEL, SURVEY_ALLOWED_TYPES, ASSESSMENT_ALLOWED_TYPES } from '@/types'
import type { Activity, Question, QuestionType } from '@/types'

/**
 * 教师端 - 上传材料生成题目向导
 * 路径：/teacher/activity/:activityId/generate
 *
 * 4 步：
 *  1. 上传课件 / 粘贴教案文本
 *  2. 识别内容（主题 / 年级 / 知识点 —— 粘贴文本时为真实抽取）
 *  3. 设置生成规则（类型 / 题型 / 数量 / 难度 / 维度）
 *  4. 生成题目草稿（编辑 / 删除 / 加入活动 / 重新生成）
 *
 * 说明：纯前端无法解析 PPT/Word 二进制；粘贴文本走真实关键词抽取，
 * 上传文件走文件名兜底。生成的题目会挂靠识别出的知识点。
 */

const STEPS = ['上传 / 粘贴', '识别内容', '设置规则', '生成草稿']

// ---- 默认知识点（无任何输入时的兜底）----
const FALLBACK_KNOWLEDGE = [
  'AI 的基本概念',
  '图像识别的输入与输出',
  'Prompt 的基本结构',
  'AI 生成内容的可信性',
]

const DIMENSION_OPTIONS = [
  'AI基础概念',
  'Prompt结构理解',
  '工具操作流程',
  '伦理与安全意识',
  '创作表达能力',
]

/** 按模式取可选题型（与全局题型清单保持一致） */
function typesForMode(mode: 'survey' | 'assessment'): QuestionType[] {
  return mode === 'survey' ? SURVEY_ALLOWED_TYPES : ASSESSMENT_ALLOWED_TYPES
}

interface GenRule {
  mode: 'survey' | 'assessment'
  types: QuestionType[]
  count: number
  difficulty: 'basic' | 'normal' | 'challenge'
  withExplanation: boolean
  withDimension: boolean
  dimensions: string[]
}

export function TeacherActivityGenerate() {
  const { activityId } = useParams()
  const navigate = useNavigate()
  const activity = activityId ? getActivityById(activityId) : undefined

  const ctx = useMemo(() => {
    if (!activityId) return undefined
    for (const c of getCourses()) {
      for (const l of c.lessons) {
        const n = l.nodes.find((x) => x.activityId === activityId)
        if (n) return { course: c, lesson: l, node: n }
      }
    }
    return undefined
  }, [activityId])

  const [step, setStep] = useState(0)

  // Step 1：两种输入方式
  const [inputMode, setInputMode] = useState<'file' | 'paste'>('paste')
  const [file, setFile] = useState<{ name: string; size: string } | null>(null)
  const [pastedText, setPastedText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 2
  const [topic, setTopic] = useState('')
  const [grade, setGrade] = useState('小学 5-6 年级')
  const [knowledge, setKnowledge] = useState<string[]>([])

  // Step 3
  const defaultMode: GenRule['mode'] =
    activity?.type === 'survey' ? 'survey' : 'assessment'
  const [rule, setRule] = useState<GenRule>({
    mode: defaultMode,
    types:
      defaultMode === 'survey'
        ? ['singleChoice', 'multipleChoice', 'shortAnswer']
        : ['singleChoice', 'judge', 'fillBlank'],
    count: 5,
    difficulty: 'normal',
    withExplanation: true,
    withDimension: true,
    dimensions: ['AI基础概念', '伦理与安全意识'],
  })

  // Step 4
  const [drafts, setDrafts] = useState<Question[]>([])
  const [generating, setGenerating] = useState(false)
  const [plan, setPlan] = useState<{ knowledge: string; type: QuestionType }[]>([])

  if (!activity) {
    return (
      <div className="p-6">
        <Card>
          <div className="py-12 text-center text-sm text-ink-500">活动不存在</div>
        </Card>
      </div>
    )
  }

  const backUrl = `/teacher/activity/${activityId}/config`

  // 是否可以进入下一步（Step1）
  const canProceedStep1 =
    inputMode === 'file' ? !!file : pastedText.trim().length >= 10

  /* ---- Step 1：真实选择文件（无法解析二进制，取文件名/大小兜底） ---- */
  function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const sizeMB = (f.size / 1024 / 1024).toFixed(1)
    setFile({ name: f.name, size: `${sizeMB} MB` })
  }

  /* ---- Step1 → Step2：真实抽取课程信息 ---- */
  function runRecognize() {
    const res =
      inputMode === 'paste'
        ? extractFromText(pastedText)
        : file
          ? extractFromFileName(file.name)
          : null
    if (res) {
      setTopic(res.topic)
      setGrade(res.grade)
      setKnowledge(res.knowledge.length > 0 ? res.knowledge : FALLBACK_KNOWLEDGE)
    } else {
      setKnowledge(FALLBACK_KNOWLEDGE)
    }
  }

  /* ---- Step 4：调用 AI 服务层生成题目（按知识点智能分配题型） ---- */
  async function runGenerate() {
    setGenerating(true)
    setDrafts([])
    setPlan([])
    const res = await generateQuestions({
      topic,
      knowledge,
      mode: rule.mode,
      allowedTypes: rule.types,
      count: rule.count,
      difficulty: rule.difficulty,
      withExplanation: rule.withExplanation,
      dimensions: rule.withDimension ? rule.dimensions : undefined,
    })
    setDrafts(res.questions)
    setPlan(res.meta.plan)
    setGenerating(false)
  }

  /* ---- 加入当前活动 ---- */
  function addToActivity() {
    const next: Activity = {
      ...activity!,
      questions: [...(activity!.questions ?? []), ...drafts],
    }
    if (next.type === 'assessment') {
      next.scoringRule = {
        ...(next.scoringRule ?? { totalScore: 0 }),
        totalScore: (next.questions ?? []).reduce((s, q) => s + (q.score ?? 0), 0),
      }
    }
    saveActivity(next)
    alert(`已加入 ${drafts.length} 道题到当前活动`)
    navigate(backUrl)
  }

  return (
    <div className="flex flex-col h-full bg-ink-50 overflow-hidden">
      {/* 顶部条 */}
      <div className="h-11 px-5 bg-white border-b border-ink-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 text-[11px] text-ink-500">
          <span className="font-medium text-ink-700">从课件生成题目</span>
          <span className="text-ink-300">·</span>
          <span className="truncate max-w-md">
            {ctx ? `《${ctx.course.title}》· ${ctx.node.title}` : activity.title}
          </span>
        </div>
        <Link to={backUrl} className="lf-btn-ghost !h-7 !px-2.5 text-[11px]">
          退出向导
        </Link>
      </div>

      {/* 步骤条 */}
      <div className="bg-white border-b border-ink-200 px-6 py-3 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div
                  className={
                    'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium ' +
                    (i < step
                      ? 'bg-brand text-white'
                      : i === step
                        ? 'bg-brand text-white ring-2 ring-brand-soft'
                        : 'bg-ink-100 text-ink-400')
                  }
                >
                  {i < step ? '✓' : i + 1}
                </div>
                <span
                  className={
                    'text-xs ' +
                    (i === step ? 'text-ink-900 font-medium' : 'text-ink-500')
                  }
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={
                    'flex-1 h-px mx-3 ' + (i < step ? 'bg-brand' : 'bg-ink-200')
                  }
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 主体 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6">
          {step === 0 && (
            <StepUpload
              inputMode={inputMode}
              file={file}
              pastedText={pastedText}
              fileInputRef={fileInputRef}
              onSetMode={setInputMode}
              onFileChosen={onFileChosen}
              onPaste={setPastedText}
              onClear={() => setFile(null)}
            />
          )}
          {step === 1 && (
            <StepRecognize
              topic={topic}
              grade={grade}
              knowledge={knowledge}
              onTopic={setTopic}
              onGrade={setGrade}
              onKnowledge={setKnowledge}
            />
          )}
          {step === 2 && (
            <StepRules rule={rule} onChange={setRule} />
          )}
          {step === 3 && (
            <StepDrafts
              drafts={drafts}
              generating={generating}
              rule={rule}
              plan={plan}
              onGenerate={runGenerate}
              onUpdate={(id, patch) =>
                setDrafts((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } as Question : q)))
              }
              onRemove={(id) => setDrafts((prev) => prev.filter((q) => q.id !== id))}
            />
          )}
        </div>
      </div>

      {/* 底部操作 */}
      <div className="bg-white border-t border-ink-200 px-6 py-3 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button
            variant="secondary"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            ← 上一步
          </Button>

          <div className="flex items-center gap-2">
            {step < 3 && (
              <Button
                variant="primary"
                disabled={step === 0 && !canProceedStep1}
                onClick={() => {
                  // 离开第 1 步时做真实识别
                  if (step === 0) runRecognize()
                  const nextStep = step + 1
                  setStep(nextStep)
                  if (nextStep === 3 && drafts.length === 0) runGenerate()
                }}
              >
                下一步 →
              </Button>
            )}
            {step === 3 && (
              <Button
                variant="primary"
                disabled={drafts.length === 0}
                onClick={addToActivity}
              >
                ✓ 加入当前活动（{drafts.length} 题）
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
 * Step 1：上传课件 / 粘贴教案
 * ============================================================ */
function StepUpload({
  inputMode,
  file,
  pastedText,
  fileInputRef,
  onSetMode,
  onFileChosen,
  onPaste,
  onClear,
}: {
  inputMode: 'file' | 'paste'
  file: { name: string; size: string } | null
  pastedText: string
  fileInputRef: React.RefObject<HTMLInputElement>
  onSetMode: (m: 'file' | 'paste') => void
  onFileChosen: (e: React.ChangeEvent<HTMLInputElement>) => void
  onPaste: (v: string) => void
  onClear: () => void
}) {
  return (
    <Card title="第一步：提供课程内容">
      {/* 方式切换 */}
      <div className="flex gap-2 mb-4">
        {([
          ['paste', '粘贴教案文本', 'edit'],
          ['file', '上传课件文件', 'presentation'],
        ] as const).map(([m, label, icon]) => (
          <button
            key={m}
            onClick={() => onSetMode(m)}
            className={
              'flex-1 h-10 rounded-lg border text-sm transition inline-flex items-center justify-center gap-2 ' +
              (inputMode === m
                ? 'border-brand bg-brand-softer text-brand-text font-medium'
                : 'border-ink-200 text-ink-600 hover:border-brand')
            }
          >
            <Icon name={icon} className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {inputMode === 'paste' ? (
        <>
          <p className="text-xs text-ink-500 mb-2 leading-relaxed">
            把教案、课件大纲或讲稿粘贴进来，系统会识别课程主题与知识点，再据此生成题目。
          </p>
          <textarea
            value={pastedText}
            onChange={(e) => onPaste(e.target.value)}
            rows={12}
            placeholder={
              '示例：\n# 认识人工智能\n年级：小学 5-6 年级\n\n知识点：\n- AI 是让机器模拟人类智能的技术\n- 图像识别：输入图片，输出分类标签\n- Prompt 的基本结构：角色 + 任务 + 要求\n- AI 生成的内容可能出错，需要核实'
            }
            className="lf-textarea !text-sm leading-relaxed font-mono"
          />
          <div className="mt-2 flex items-center justify-between text-[11px] text-ink-400">
            <span>已输入 {pastedText.trim().length} 字（至少 10 字）</span>
            {pastedText && (
              <button onClick={() => onPaste('')} className="hover:text-red-600">
                清空
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="text-xs text-ink-500 mb-4 leading-relaxed">
            选择课程 PPT 或教案文件。当前为纯前端原型，
            <span className="text-ink-700">会读取文件名作为课程主题</span>，
            暂不解析文件内部内容（需要后端支持）。如需基于内容生成，请改用「粘贴教案文本」。
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".ppt,.pptx,.doc,.docx,.pdf,.txt,.md"
            className="hidden"
            onChange={onFileChosen}
          />
          {!file ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-ink-300 rounded-lg py-12 flex flex-col items-center gap-3 hover:border-brand hover:bg-brand-softer/30 transition"
            >
              <Icon name="presentation" className="w-9 h-9 text-ink-400" />
              <div className="text-sm text-ink-700">点击选择文件</div>
              <div className="text-[11px] text-ink-400">
                PPT / PPTX / DOC / DOCX / PDF
              </div>
            </button>
          ) : (
            <div className="border border-ink-200 rounded-lg p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-brand-softer flex items-center justify-center shrink-0 text-brand-text">
                <Icon name="fileText" className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-ink-900 truncate">{file.name}</div>
                <div className="text-[11px] text-ink-500 mt-0.5">{file.size}</div>
              </div>
              <button
                onClick={() => { onClear(); if (fileInputRef.current) fileInputRef.current.value = '' }}
                className="text-[11px] text-ink-500 hover:text-red-600"
              >
                移除
              </button>
            </div>
          )}
        </>
      )}
    </Card>
  )
}

/* ============================================================
 * Step 2：识别内容
 * ============================================================ */
function StepRecognize({
  topic,
  grade,
  knowledge,
  onTopic,
  onGrade,
  onKnowledge,
}: {
  topic: string
  grade: string
  knowledge: string[]
  onTopic: (v: string) => void
  onGrade: (v: string) => void
  onKnowledge: (v: string[]) => void
}) {
  return (
    <div className="space-y-4">
      <Card title="第二步：识别内容">
        <div className="text-[11px] text-green-700 bg-green-50 border border-green-100 rounded p-2.5 mb-4">
          已从课程内容中识别出以下信息，可手动调整后再生成题目。
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">
              课程主题
            </label>
            <Input value={topic} onChange={(e) => onTopic(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">
              年级段
            </label>
            <select
              value={grade}
              onChange={(e) => onGrade(e.target.value)}
              className="w-full h-9 border border-ink-200 rounded px-2 text-sm bg-white"
            >
              <option>小学 1-2 年级</option>
              <option>小学 3-4 年级</option>
              <option>小学 5-6 年级</option>
              <option>初中</option>
              <option>高中</option>
            </select>
          </div>
        </div>
      </Card>

      <Card
        title={`主要知识点（${knowledge.length}）`}
        extra={
          <button
            onClick={() => onKnowledge([...knowledge, '新知识点'])}
            className="text-[11px] text-brand-text hover:underline"
          >
            + 添加知识点
          </button>
        }
      >
        <div className="space-y-2">
          {knowledge.map((k, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[11px] text-ink-400 w-5 shrink-0">{i + 1}</span>
              <Input
                value={k}
                onChange={(e) => {
                  const next = [...knowledge]
                  next[i] = e.target.value
                  onKnowledge(next)
                }}
              />
              <button
                onClick={() => onKnowledge(knowledge.filter((_, j) => j !== i))}
                className="lf-btn-ghost !h-9 !w-9 shrink-0 text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
          {knowledge.length === 0 && (
            <div className="text-xs text-ink-400 py-4 text-center">
              暂无知识点，点击右上角添加
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

/* ============================================================
 * Step 3：设置生成规则
 * ============================================================ */
function StepRules({
  rule,
  onChange,
}: {
  rule: GenRule
  onChange: (r: GenRule) => void
}) {
  function toggleType(t: QuestionType) {
    const has = rule.types.includes(t)
    onChange({
      ...rule,
      types: has ? rule.types.filter((x) => x !== t) : [...rule.types, t],
    })
  }
  function toggleDim(d: string) {
    const has = rule.dimensions.includes(d)
    onChange({
      ...rule,
      dimensions: has ? rule.dimensions.filter((x) => x !== d) : [...rule.dimensions, d],
    })
  }

  return (
    <div className="space-y-4">
      <Card title="第三步：设置生成规则">
        {/* 类型 */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-ink-700 mb-2">生成类型</label>
          <div className="flex gap-2">
            {(['assessment', 'survey'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  const allowed = typesForMode(m)
                  onChange({ ...rule, mode: m, types: rule.types.filter((t) => allowed.includes(t)) })
                }}
                className={
                  'flex-1 h-10 rounded-lg border text-sm transition ' +
                  (rule.mode === m
                    ? 'border-brand bg-brand-softer text-brand-text font-medium'
                    : 'border-ink-200 text-ink-700 hover:border-brand')
                }
              >
                {m === 'assessment' ? '测评（计分）' : '问卷（不计分）'}
              </button>
            ))}
          </div>
        </div>

        {/* 题型 */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-ink-700 mb-2">
            题型选择（已选 {rule.types.length}）
          </label>
          <div className="grid grid-cols-4 gap-2">
            {typesForMode(rule.mode).map((t) => {
              const on = rule.types.includes(t)
              return (
                <button
                  key={t}
                  onClick={() => toggleType(t)}
                  className={
                    'h-9 rounded border text-xs transition ' +
                    (on
                      ? 'border-brand bg-brand-softer text-brand-text'
                      : 'border-ink-200 text-ink-600 hover:border-brand')
                  }
                >
                  {QUESTION_TYPE_LABEL[t]}
                </button>
              )
            })}
          </div>
        </div>

        {/* 数量 + 难度 */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-2">题目数量</label>
            <div className="flex items-center gap-2">
              {[3, 5, 8, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => onChange({ ...rule, count: n })}
                  className={
                    'flex-1 h-9 rounded border text-xs transition ' +
                    (rule.count === n
                      ? 'border-brand bg-brand-softer text-brand-text'
                      : 'border-ink-200 text-ink-600 hover:border-brand')
                  }
                >
                  {n} 题
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-2">难度</label>
            <div className="flex items-center gap-2">
              {(
                [
                  ['basic', '基础'],
                  ['normal', '普通'],
                  ['challenge', '挑战'],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => onChange({ ...rule, difficulty: k })}
                  className={
                    'flex-1 h-9 rounded border text-xs transition ' +
                    (rule.difficulty === k
                      ? 'border-brand bg-brand-softer text-brand-text'
                      : 'border-ink-200 text-ink-600 hover:border-brand')
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 开关 */}
        <div className="flex flex-col gap-2.5 pt-3 border-t border-ink-100">
          <label className="flex items-center gap-2 text-xs text-ink-700">
            <input
              type="checkbox"
              className="accent-brand"
              checked={rule.withExplanation}
              onChange={(e) => onChange({ ...rule, withExplanation: e.target.checked })}
            />
            生成答案解析
          </label>
          <label className="flex items-center gap-2 text-xs text-ink-700">
            <input
              type="checkbox"
              className="accent-brand"
              checked={rule.withDimension}
              onChange={(e) => onChange({ ...rule, withDimension: e.target.checked })}
            />
            自动添加维度标签
          </label>
        </div>
      </Card>

      {/* 维度选择 */}
      {rule.withDimension && (
        <Card title="维度标签">
          <div className="flex flex-wrap gap-2">
            {DIMENSION_OPTIONS.map((d) => {
              const on = rule.dimensions.includes(d)
              return (
                <button
                  key={d}
                  onClick={() => toggleDim(d)}
                  className={
                    'px-3 h-8 rounded-full border text-xs transition ' +
                    (on
                      ? 'border-brand bg-brand-softer text-brand-text'
                      : 'border-ink-200 text-ink-600 hover:border-brand')
                  }
                >
                  {on ? '✓ ' : ''}{d}
                </button>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

/* ============================================================
 * Step 4：生成草稿
 * ============================================================ */
function StepDrafts({
  drafts,
  generating,
  rule,
  plan,
  onGenerate,
  onUpdate,
  onRemove,
}: {
  drafts: Question[]
  generating: boolean
  rule: GenRule
  plan: { knowledge: string; type: QuestionType }[]
  onGenerate: () => void
  onUpdate: (id: string, patch: Partial<Question>) => void
  onRemove: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      <Card
        title={generating ? '正在生成题目…' : `生成结果（${drafts.length} 题）`}
        extra={
          !generating && (
            <button
              onClick={onGenerate}
              className="text-[11px] text-brand-text hover:underline inline-flex items-center gap-1"
            >
              <Icon name="refresh" className="w-3 h-3" />
              重新生成
            </button>
          )
        }
      >
        {generating ? (
          <div className="py-12 text-center">
            <Icon name="sparkles" className="w-8 h-8 mx-auto mb-3 text-brand-text animate-pulse" />
            <div className="text-sm text-ink-700">AI 正在根据知识点生成题目…</div>
            <div className="text-[11px] text-ink-400 mt-1">
              {rule.count} 道 · {rule.mode === 'assessment' ? '测评' : '问卷'} ·{' '}
              {rule.difficulty === 'basic' ? '基础' : rule.difficulty === 'normal' ? '普通' : '挑战'}难度
            </div>
          </div>
        ) : drafts.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-sm text-ink-500 mb-3">还没有生成题目</div>
            <Button variant="primary" onClick={onGenerate}>
              开始生成
            </Button>
          </div>
        ) : (
          <div className="text-[11px] text-green-700 bg-green-50 border border-green-100 rounded p-2.5">
            ✓ 已生成 {drafts.length} 道题目草稿，可逐题编辑或删除，确认后点击底部"加入当前活动"。
          </div>
        )}
        {/* 智能配题方案：展示每个知识点分到的题型 */}
        {!generating && plan.length > 0 && (
          <div className="mt-3 pt-3 border-t border-ink-100">
            <div className="text-[11px] text-ink-500 mb-2">智能配题方案（按知识点性质匹配题型）</div>
            <div className="flex flex-wrap gap-1.5">
              {plan.map((p, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[11px] bg-ink-50 border border-ink-100 rounded-md px-2 h-6"
                >
                  <span className="text-ink-700 truncate max-w-[140px]">{p.knowledge}</span>
                  <span className="text-ink-300">→</span>
                  <span className="text-brand-text">{QUESTION_TYPE_LABEL[p.type]}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {!generating &&
        drafts.map((q, i) => (
          <DraftCard
            key={q.id}
            index={i}
            question={q}
            isAssess={rule.mode === 'assessment'}
            onUpdate={(patch) => onUpdate(q.id, patch)}
            onRemove={() => onRemove(q.id)}
          />
        ))}
    </div>
  )
}

function DraftCard({
  index,
  question,
  isAssess,
  onUpdate,
  onRemove,
}: {
  index: number
  question: Question
  isAssess: boolean
  onUpdate: (patch: Partial<Question>) => void
  onRemove: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const emptyValue = useMemo(
    () => createEmptyAnswer(question),
    [question.id, question.type],
  )

  return (
    <Card className="!p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] text-ink-400">Q{index + 1}</span>
            <Tag className="!text-[10px]">{QUESTION_TYPE_LABEL[question.type]}</Tag>
            {isAssess && question.score != null && (
              <Tag className="!text-[10px]">{question.score} 分</Tag>
            )}
            {(question.dimensions ?? []).map((d) => (
              <Tag key={d} variant="brand" className="!text-[10px]">
                {d}
              </Tag>
            ))}
          </div>

          {/* 题干（可编辑） */}
          <Input
            value={question.title}
            onChange={(e) => onUpdate({ title: e.target.value } as Partial<Question>)}
            className="!text-sm font-medium mb-2"
          />

          {/* 预览 */}
          {expanded && (
            <div className="mt-2 p-3 bg-ink-50 rounded border border-ink-200 pointer-events-none opacity-90">
              <QuestionRenderer question={question} value={emptyValue} onChange={() => {}} />
            </div>
          )}

          {/* 答案 / 解析 */}
          {expanded && isAssess && (
            <div className="mt-2 space-y-1 text-[11px]">
              <div className="text-ink-500">
                正确答案：
                <span className="text-ink-900">{describeAnswer(question)}</span>
              </div>
              {question.explanation && (
                <div className="text-ink-500">
                  解析：<span className="text-ink-700">{question.explanation}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[11px] text-brand-text hover:underline"
          >
            {expanded ? '收起' : '预览 / 答案'}
          </button>
          <button
            onClick={onRemove}
            className="text-[11px] text-red-600 hover:underline"
          >
            删除
          </button>
        </div>
      </div>
    </Card>
  )
}

/* ============================================================
 * 旧版本地题目生成的辅助函数（已被 services/ai.ts 取代，保留待清理）
 * ============================================================ */
function mockExplanation(t: QuestionType): string {
  const map: Record<QuestionType, string> = {
    singleChoice: '人工智能是让机器模拟人类智能行为的技术。',
    multipleChoice: '语音助手、人脸识别、推荐系统都是常见 AI 应用。',
    judge: 'AI 生成内容可能存在错误（幻觉），需要核实。',
    fillBlank: 'AI 是 Artificial Intelligence 的缩写。',
    shortAnswer: '关注"模拟人类智能"与"从数据中学习"两个关键点。',
    sort: '图像识别流程：输入图片 → 提取特征 → 分类 → 输出结果。',
    classify: '人脸识别属于计算机视觉，翻译属于自然语言处理。',
    wordCompose: '机器学习 = 从数据中找规律；神经网络 = 模仿人脑结构。',
  }
  return map[t]
}

function fillByType(t: QuestionType, base: any, isAssess: boolean): Question {
  switch (t) {
    case 'singleChoice':
      return {
        ...base,
        options: [
          { id: uid('o'), label: 'A', content: '让机器模拟人类智能的技术' },
          { id: uid('o'), label: 'B', content: '一种新型电池' },
          { id: uid('o'), label: 'C', content: '一种编程语言' },
        ],
        answer: isAssess ? undefined : null,
      } as unknown as Question
    case 'multipleChoice':
      return {
        ...base,
        options: [
          { id: uid('o'), label: 'A', content: '语音助手' },
          { id: uid('o'), label: 'B', content: '人脸识别' },
          { id: uid('o'), label: 'C', content: '手电筒' },
          { id: uid('o'), label: 'D', content: '推荐系统' },
        ],
        answer: isAssess ? [] : [],
        scoreMode: 'partial',
      } as unknown as Question
    case 'judge':
      return { ...base, answer: isAssess ? false : null } as unknown as Question
    case 'fillBlank':
      return {
        ...base,
        blanks: 1,
        fillStyle: 'single',
        answer: isAssess ? [['AI', '人工智能']] : [[]],
      } as unknown as Question
    case 'shortAnswer':
      return {
        ...base,
        shortStyle: 'long',
        minLength: 30,
        maxLength: 200,
        ...(isAssess ? { answer: '要点：模拟人类智能 + 从数据中学习', gradeMode: 'manual' } : {}),
      } as unknown as Question
    case 'sort':
      return {
        ...base,
        items: [
          { id: uid('s'), content: '输入图片' },
          { id: uid('s'), content: '提取特征' },
          { id: uid('s'), content: '分类判断' },
          { id: uid('s'), content: '输出结果' },
        ],
        answer: [],
      } as unknown as Question
    case 'classify':
      return {
        ...base,
        categories: [
          { id: uid('c'), name: '计算机视觉' },
          { id: uid('c'), name: '自然语言处理' },
        ],
        items: [
          { id: uid('it'), content: '人脸识别' },
          { id: uid('it'), content: '机器翻译' },
        ],
        answer: {},
      } as unknown as Question
    case 'wordCompose':
      return {
        ...base,
        leftItems: [
          { id: uid('l'), content: '机器学习' },
          { id: uid('l'), content: '神经网络' },
        ],
        rightItems: [
          { id: uid('r'), content: '从数据中找规律' },
          { id: uid('r'), content: '模仿人脑结构' },
        ],
        answer: [],
      } as unknown as Question
    default:
      return base as Question
  }
}

function describeAnswer(q: Question): string {
  switch (q.type) {
    case 'singleChoice':
      return q.answer ? '（已设置）' : '未设置，请进入配置中心补全'
    case 'multipleChoice':
      return (q.answer?.length ?? 0) > 0 ? '（已设置）' : '未设置'
    case 'judge':
      return q.answer === true ? '对' : q.answer === false ? '错' : '未设置'
    case 'fillBlank':
      return (q.answer ?? []).map((a) => a.join('/')).join('；') || '未设置'
    case 'shortAnswer':
      return q.answer || '需人工评分'
    default:
      return '进入配置中�心补全'
  }
}
