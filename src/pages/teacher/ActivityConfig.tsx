import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Input, Tag, Textarea, ImageUploader } from '@/components/ui'
import { QuestionRenderer } from '@/components/question'
import { QUESTION_META, groupedTypes } from '@/components/question/meta'
import {
  getActivityById,
  getCourses,
  saveActivity,
  saveCourse,
} from '@/store'
import { createEmptyAnswer, uid } from '@/utils'
import { QUESTION_TYPE_LABEL, SURVEY_ALLOWED_TYPES, ASSESSMENT_ALLOWED_TYPES } from '@/types'
import type {
  Activity,
  Course,
  Dimension,
  Lesson,
  LessonNode,
  Option,
  Question,
  QuestionType,
} from '@/types'

/**
 * 教师端 - 题目配置中心
 * 路径：/teacher/activity/:activityId/config
 *
 * 三栏结构：
 *  - 左侧：题目列表（增删/复制/上下移动/完整度提示）
 *  - 中间：学生端预览（根据当前题目实时渲染）
 *  - 右侧：配置面板（题目配置 / 活动设置 双标签）
 */
export function TeacherActivityConfig() {
  const { activityId } = useParams()
  const navigate = useNavigate()
  const original = activityId ? getActivityById(activityId) : undefined

  // 通过 activityId 反查所在课程/课节，便于"发布到课程节点"和"预览学生端"
  const ctx = useMemo(() => {
    if (!activityId) return undefined
    const courses = getCourses()
    for (const c of courses) {
      for (const l of c.lessons) {
        const n = l.nodes.find((x) => x.activityId === activityId)
        if (n) return { course: c, lesson: l, node: n }
      }
    }
    return undefined
  }, [activityId])

  // ⚠️ 所有 hooks 必须在任何条件 return 之前调用（Hooks 规则）。
  // 整个活动作为本地状态；original 不存在时用空壳占位，下方再统一兜底返回。
  const [activity, setActivity] = useState<Activity>(() =>
    original ? JSON.parse(JSON.stringify(original)) : ({ id: '', type: 'survey', title: '', questions: [] } as Activity),
  )
  const [currentQid, setCurrentQid] = useState<string>(
    original?.questions?.[0]?.id ?? '',
  )
  const [dirty, setDirty] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showInsert, setShowInsert] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  if (!original) {
    return (
      <div className="p-6">
        <Card>
          <div className="py-12 text-center">
            <div className="text-sm text-ink-700 mb-1">未找到这个活动</div>
            <div className="text-xs text-ink-500 mb-4">
              它可能尚未保存，或已被删除。
            </div>
            <button
              onClick={() => navigate('/teacher/courses')}
              className="lf-btn-secondary !h-8 !text-xs"
            >
              ← 返回课程
            </button>
          </div>
        </Card>
      </div>
    )
  }

  // 模式：问卷 / 测评（决定右侧面板项）
  const mode = activity.type === 'survey' ? 'survey' : 'assessment'
  const isAssess = mode === 'assessment'

  const questions = activity.questions ?? []
  const currentQuestion = questions.find((q) => q.id === currentQid)

  function markDirty() { setDirty(true) }

  function updateActivity(patch: Partial<Activity>) {
    setActivity((prev) => ({ ...prev, ...patch }))
    markDirty()
  }

  function updateQuestion(id: string, patch: Partial<Question>) {
    setActivity((prev) => {
      const next = (prev.questions ?? []).map((x) =>
        x.id === id ? ({ ...x, ...patch } as Question) : x,
      )
      // 测评：实时重算总分
      const patchExtra: Partial<Activity> = {}
      if (prev.type === 'assessment') {
        patchExtra.scoringRule = {
          ...(prev.scoringRule ?? { totalScore: 0 }),
          totalScore: next.reduce((s, q) => s + (q.score ?? 0), 0),
        }
      }
      return { ...prev, questions: next, ...patchExtra }
    })
    markDirty()
  }

  function addQuestion(type: QuestionType) {
    const q = makeNewQuestion(type, isAssess)
    setActivity((prev) => {
      const next = [...(prev.questions ?? []), q]
      const patchExtra: Partial<Activity> = {}
      if (prev.type === 'assessment') {
        patchExtra.scoringRule = {
          ...(prev.scoringRule ?? { totalScore: 0 }),
          totalScore: next.reduce((s, x) => s + (x.score ?? 0), 0),
        }
      }
      return { ...prev, questions: next, ...patchExtra }
    })
    setCurrentQid(q.id)
    setShowAdd(false)
    markDirty()
  }

  function removeQuestion(id: string) {
    if (!confirm('确定删除这道题？')) return
    setActivity((prev) => {
      const next = (prev.questions ?? []).filter((q) => q.id !== id)
      const patchExtra: Partial<Activity> = {}
      if (prev.type === 'assessment') {
        patchExtra.scoringRule = {
          ...(prev.scoringRule ?? { totalScore: 0 }),
          totalScore: next.reduce((s, x) => s + (x.score ?? 0), 0),
        }
      }
      return { ...prev, questions: next, ...patchExtra }
    })
    if (currentQid === id) {
      const remain = (activity.questions ?? []).filter((q) => q.id !== id)
      setCurrentQid(remain[0]?.id ?? '')
    }
    markDirty()
  }

  function duplicateQuestion(id: string) {
    const q = (activity.questions ?? []).find((x) => x.id === id)
    if (!q) return
    const copy: Question = JSON.parse(JSON.stringify(q))
    copy.id = uid('q')
    copy.title = q.title + '（副本）'
    // 给选项也重新编号 id
    if ((copy as any).options) {
      (copy as any).options = (copy as any).options.map((o: Option) => ({
        ...o,
        id: uid('opt'),
      }))
    }
    setActivity((prev) => {
      const next = [...(prev.questions ?? []), copy]
      const patchExtra: Partial<Activity> = {}
      if (prev.type === 'assessment') {
        patchExtra.scoringRule = {
          ...(prev.scoringRule ?? { totalScore: 0 }),
          totalScore: next.reduce((s, x) => s + (x.score ?? 0), 0),
        }
      }
      return { ...prev, questions: next, ...patchExtra }
    })
    setCurrentQid(copy.id)
    markDirty()
  }

  function moveQuestion(id: string, delta: -1 | 1) {
    const qs = [...(activity.questions ?? [])]
    const idx = qs.findIndex((q) => q.id === id)
    const tgt = idx + delta
    if (idx < 0 || tgt < 0 || tgt >= qs.length) return
    ;[qs[idx], qs[tgt]] = [qs[tgt], qs[idx]]
    setActivity((prev) => ({ ...prev, questions: qs }))
    markDirty()
  }

  function handleSave() {
    saveActivity(activity)
    setDirty(false)
  }

  function handleExit() {
    if (dirty) {
      const confirm = window.confirm('有未保存的修改，确定要退出吗？退出后修改将丢失。')
      if (!confirm) return
      // 用户确认放弃修改，重置为原始状态（避免污染 store）
      // 注意：由于我们即将离开页面，不需要真正重置状态，直接导航即可
    }
    navigate(ctx ? `/teacher/course/${ctx.course.id}/editor` : '/teacher/activities')
  }

  function handlePublish() {
    // 发布 = 保存 + 跳转到对应学生端预览
    saveActivity(activity)
    setDirty(false)
    if (ctx) {
      alert('✅ 已发布到课程节点')
    } else {
      alert('✅ 已保存。当前活动尚未被课程节点引用')
    }
  }

  /** 把当前活动作为节点插入到指定课程的指定课节 */
  function insertIntoLesson(courseId: string, lessonId: string) {
    if (!activityId) return
    saveActivity(activity) // 先存活动本身
    const course = getCourses().find((c) => c.id === courseId)
    if (!course) return
    const nodeType: LessonNode['type'] =
      activity.type === 'assessment' ? 'assessment'
    : activity.type === 'aiPractice' ? 'aiPractice'
    :                                  'survey'
    const next: Course = {
      ...course,
      lessons: course.lessons.map((l) => {
        if (l.id !== lessonId) return l
        const order = l.nodes.reduce((m, n) => Math.max(m, n.order), 0) + 1
        const node: LessonNode = {
          id: uid('node'),
          lessonId,
          type: nodeType,
          order,
          title: activity.title,
          description: activity.description ?? '',
          activityId,
          completionRequired: nodeType === 'assessment',
        }
        return { ...l, nodes: [...l.nodes, node] }
      }),
    }
    saveCourse(next)
    setShowInsert(false)
    alert(`✅ 已插入到《${course.title}》· ${course.lessons.find((l) => l.id === lessonId)?.title ?? ''}`)
    navigate(`/teacher/course/${courseId}/editor`)
  }

  return (
    <div className="flex h-full bg-ink-50 overflow-hidden">
      {/* —— 左：题目列表 —— */}
      <aside className="w-60 shrink-0 bg-white border-r border-ink-200 flex flex-col">
        {/* 头部 */}
        <div className="p-3 border-b border-ink-200">
          <button
            onClick={handleExit}
            className="text-xs text-ink-500 hover:text-ink-900 mb-2 flex items-center gap-1"
          >
            ← 返回{ctx ? '课节编辑器' : '题库'}
          </button>
          <div className="text-sm font-medium text-ink-900 truncate">
            {activity.title}
          </div>
          <div className="text-[11px] text-ink-500 mt-0.5 flex items-center gap-2">
            <Tag variant={isAssess ? 'brand' : 'default'} className="!text-[10px]">
              {isAssess ? '测评' : activity.type === 'survey' ? '问卷' : 'AI互动'}
            </Tag>
            <span>{questions.length} 题</span>
            {isAssess && (
              <span>· 共 {activity.scoringRule?.totalScore ?? 0} 分</span>
            )}
          </div>
        </div>

        {/* 题目列表 */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {questions.length === 0 && (
            <div className="text-xs text-ink-500 py-6 text-center">
              暂无题目，下方添加
            </div>
          )}
          {questions.map((q, i) => {
            const active = q.id === currentQid
            const complete = isQuestionComplete(q, isAssess)
            return (
              <div
                key={q.id}
                className={
                  'rounded border transition ' +
                  (active
                    ? 'border-brand bg-brand-softer'
                    : 'border-ink-200 bg-white hover:bg-ink-50')
                }
              >
                <button
                  onClick={() => setCurrentQid(q.id)}
                  className="w-full text-left px-2.5 py-2"
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[11px] text-ink-500 w-5 shrink-0">
                      Q{i + 1}
                    </span>
                    <Tag className="!text-[10px]">
                      {QUESTION_TYPE_LABEL[q.type]}
                    </Tag>
                    {!complete && (
                      <span
                        className="ml-auto text-[10px] text-amber-700"
                        title="题目配置不完整"
                      >
                        !
                      </span>
                    )}
                    {complete && active && (
                      <span className="ml-auto text-[10px] text-brand-text">
                        ✓
                      </span>
                    )}
                  </div>
                  <div
                    className={
                      'text-xs truncate ml-7 ' +
                      (active ? 'text-brand-text font-medium' : 'text-ink-900')
                    }
                  >
                    {q.title || '（未填题干）'}
                  </div>
                </button>
                {active && (
                  <div className="px-2.5 pb-2 flex items-center gap-1 border-t border-brand-soft mt-1 pt-1.5">
                    <button
                      onClick={() => moveQuestion(q.id, -1)}
                      disabled={i === 0}
                      className="text-[11px] px-1.5 h-6 rounded hover:bg-white text-ink-500 disabled:opacity-30"
                      title="上移"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveQuestion(q.id, 1)}
                      disabled={i === questions.length - 1}
                      className="text-[11px] px-1.5 h-6 rounded hover:bg-white text-ink-500 disabled:opacity-30"
                      title="下移"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => duplicateQuestion(q.id)}
                      className="text-[11px] px-1.5 h-6 rounded hover:bg-white text-ink-500"
                      title="复制"
                    >
                      ⎘
                    </button>
                    <button
                      onClick={() => removeQuestion(q.id)}
                      className="ml-auto text-[11px] text-red-600 hover:underline"
                    >
                      删除
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* 添加题目 */}
        <div className="shrink-0 p-2 border-t border-ink-200">
          {showAdd ? (
            <div className="space-y-2.5">
              <div className="text-[11px] text-ink-500">选择题型</div>
              {groupedTypes(isAssess ? ASSESS_TYPES : SURVEY_TYPES).map((g) => (
                <div key={g.group}>
                  <div className="text-[10px] text-ink-400 mb-1">{g.label}</div>
                  <div className="grid grid-cols-2 gap-1">
                    {g.types.map((t) => (
                      <button
                        key={t}
                        onClick={() => addQuestion(t)}
                        title={QUESTION_META[t].tagline}
                        className="text-xs h-7 rounded border border-ink-200 hover:border-brand hover:bg-brand-softer hover:text-brand-text flex items-center justify-center gap-1"
                      >
                        <span className="text-[11px]">{QUESTION_META[t].icon}</span>
                        {QUESTION_TYPE_LABEL[t]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={() => setShowAdd(false)}
                className="w-full text-xs h-7 rounded border border-ink-200 text-ink-500 hover:bg-ink-50"
              >
                取消
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <button
                onClick={() => setShowAdd(true)}
                className="w-full lf-btn-primary !h-9"
              >
                + 添加题目
              </button>
              <Link
                to={`/teacher/activity/${activityId}/generate`}
                className="w-full lf-btn-secondary !h-8 !text-xs flex items-center justify-center gap-1"
              >
                ✨ 上传 PPT / 教案生成
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* —— 右：题目配置（主区，全宽）—— */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* 顶部操作条 */}
        <div className="h-11 px-5 bg-white border-b border-ink-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 text-[11px] text-ink-500">
            <span className="font-medium text-ink-700">配置题目</span>
            <span className="text-ink-300">·</span>
            {ctx ? (
              <Link
                to={`/teacher/course/${ctx.course.id}/editor`}
                className="text-brand-text hover:underline truncate max-w-md"
              >
                《{ctx.course.title}》· {ctx.lesson.title} · {ctx.node.title}
              </Link>
            ) : (
              <button
                onClick={() => setShowInsert(true)}
                className="text-brand-text hover:underline"
              >
                未绑定课程 · 插入到课节 →
              </button>
            )}
            {dirty && (
              <span className="ml-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                未保存
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setShowSettings(true)} className="!h-7 !px-2.5 !text-[11px]">
              活动设置
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowPreview(true)}
              disabled={!currentQuestion}
              className="!h-7 !px-2.5 !text-[11px]"
            >
              👁 预览
            </Button>
            <Button variant="secondary" onClick={handleExit} className="!h-7 !px-2.5 !text-[11px]">
              退出
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={!dirty} className="!h-7 !px-2.5 !text-[11px]">
              {dirty ? '保存' : '已保存'}
            </Button>
            <Button variant="primary" onClick={handlePublish} className="!h-7 !px-3 !text-[11px]">
              🚀 发布
            </Button>
          </div>
        </div>

        {/* 配置主区 */}
        <div className="flex-1 overflow-y-auto bg-ink-50">
          <div className="max-w-2xl mx-auto p-6">
            {currentQuestion ? (
              <div className="bg-white border border-ink-200 rounded-lg">
                <ConfigPanel
                  activity={activity}
                  question={currentQuestion}
                  isAssess={isAssess}
                  onActivityChange={updateActivity}
                  onQuestionChange={(patch) =>
                    currentQuestion && updateQuestion(currentQuestion.id, patch)
                  }
                />
              </div>
            ) : (
              <Card>
                <div className="py-16 text-center text-sm text-ink-500">
                  左侧选择或添加题目开始配置
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* 学生端预览（按需弹出） */}
      {showPreview && currentQuestion && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 border-b border-ink-100 flex items-center justify-between sticky top-0 bg-white">
              <span className="text-sm font-medium text-ink-900">学生端预览</span>
              <button onClick={() => setShowPreview(false)} className="text-ink-400 hover:text-ink-900">×</button>
            </div>
            <div className="p-6">
              <QuestionPreview
                index={questions.findIndex((q) => q.id === currentQuestion.id)}
                question={currentQuestion}
                isAssess={isAssess}
              />
            </div>
          </div>
        </div>
      )}

      {/* 活动设置（按需弹出） */}
      {showSettings && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 border-b border-ink-100 flex items-center justify-between sticky top-0 bg-white">
              <span className="text-sm font-medium text-ink-900">活动设置</span>
              <button onClick={() => setShowSettings(false)} className="text-ink-400 hover:text-ink-900">×</button>
            </div>
            <ActivitySettingsPanel
              activity={activity}
              isAssess={isAssess}
              onActivityChange={updateActivity}
            />
          </div>
        </div>
      )}

      <InsertNodeDialog
        open={showInsert}
        activityType={activity.type}
        onClose={() => setShowInsert(false)}
        onInsert={insertIntoLesson}
      />
    </div>
  )
}

/* ============================================================
 * 插入到课节对话框：选课程 → 选课节 → 插入引用本活动的节点
 * ============================================================ */
function InsertNodeDialog({
  open,
  activityType,
  onClose,
  onInsert,
}: {
  open: boolean
  activityType: Activity['type']
  onClose: () => void
  onInsert: (courseId: string, lessonId: string) => void
}) {
  const courses = useMemo(() => getCourses(), [open])
  const [courseId, setCourseId] = useState('')
  const course = courses.find((c) => c.id === courseId)
  const [lessonId, setLessonId] = useState('')

  if (!open) return null

  const typeLabel =
    activityType === 'assessment' ? '测评' : activityType === 'aiPractice' ? 'AI 互动' : '问卷'

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3.5 border-b border-ink-100 flex items-center justify-between">
          <span className="text-sm font-medium text-ink-900">插入到课节</span>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-900">×</button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-ink-500 leading-relaxed">
            把这个「{typeLabel}」作为一个环节插入到课程中。学生学到该环节时即可作答。
          </p>

          <div>
            <label className="text-xs text-ink-700 mb-1.5 block">选择课程</label>
            <select
              value={courseId}
              onChange={(e) => { setCourseId(e.target.value); setLessonId('') }}
              className="w-full h-9 border border-ink-200 rounded-lg px-2 text-sm bg-white"
            >
              <option value="">— 请选择 —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-ink-700 mb-1.5 block">选择课节</label>
            <select
              value={lessonId}
              disabled={!course}
              onChange={(e) => setLessonId(e.target.value)}
              className="w-full h-9 border border-ink-200 rounded-lg px-2 text-sm bg-white disabled:bg-ink-50 disabled:text-ink-400"
            >
              <option value="">— 请选择 —</option>
              {course?.lessons.map((l) => (
                <option key={l.id} value={l.id}>{l.title}（{l.nodes.length} 个环节）</option>
              ))}
            </select>
          </div>

          <div className="pt-1 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} className="!h-9">取消</Button>
            <Button
              variant="primary"
              className="!h-9"
              onClick={() => courseId && lessonId && onInsert(courseId, lessonId)}
            >
              插入并打开课节
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
 * 工具：判断题目是否配置完整
 * ============================================================ */
function isQuestionComplete(q: Question, isAssess: boolean): boolean {
  if (!q.title.trim()) return false
  switch (q.type) {
    case 'singleChoice':
      if (q.options.length < 2) return false
      if (isAssess && !q.answer) return false
      return true
    case 'multipleChoice':
      if (q.options.length < 2) return false
      if (isAssess && (!q.answer || q.answer.length === 0)) return false
      return true
    case 'judge':
      if (isAssess && q.answer == null) return false
      return true
    case 'fillBlank':
      if (isAssess && (!q.answer || q.answer.length === 0)) return false
      return true
    case 'shortAnswer':
      return true
    case 'sort':
      if (q.items.length < 2) return false
      if (isAssess && (!q.answer || q.answer.length === 0)) return false
      return true
    case 'classify':
      if (q.categories.length < 2 || q.items.length === 0) return false
      if (isAssess && !q.answer) return false
      return true
    case 'wordCompose':
      if (q.leftItems.length === 0 || q.rightItems.length === 0) return false
      if (isAssess && (!q.answer || q.answer.length === 0)) return false
      return true
    case 'ratingScale':
      return (q.max ?? 5) >= 2
    case 'workUpload':
      return true
    case 'knowledgeReview':
      return q.cards.length > 0 && q.cards.every((c) => c.front.trim().length > 0)
    case 'promptPractice':
      return true
    case 'materialGroup':
      return (
        q.subQuestions.length > 0 &&
        q.subQuestions.every(
          (s) =>
            s.title.trim().length > 0 &&
            s.options.length >= 2 &&
            (!isAssess || !!s.answer),
        )
      )
    default:
      return true
  }
}

/* ============================================================
 * 中间预览区：以学生端样式渲染题目
 * ============================================================ */
function QuestionPreview({
  index,
  question,
  isAssess,
}: {
  index: number
  question: Question
  isAssess: boolean
}) {
  const emptyValue = useMemo(() => createEmptyAnswer(question), [question.id, question.type])
  return (
    <Card>
      <div className="flex items-center gap-2 text-xs text-ink-500 mb-2">
        <span>第 {index + 1} 题</span>
        <Tag variant={isAssess ? 'brand' : 'default'}>
          {QUESTION_TYPE_LABEL[question.type]}
        </Tag>
        {isAssess && question.score != null && (
          <Tag>{question.score} 分</Tag>
        )}
        {question.required && (
          <Tag variant="brand" className="!text-[10px]">必答</Tag>
        )}
      </div>
      <h3 className="text-base text-ink-900 mb-2 leading-relaxed">
        {index + 1}. {question.title || '（未填题干）'}
      </h3>
      {question.description && (
        <p className="text-xs text-ink-500 mb-4">{question.description}</p>
      )}

      <div className="mt-4 pointer-events-none opacity-90">
        <QuestionRenderer
          question={question}
          value={emptyValue}
          onChange={() => {}}
        />
      </div>

      {/* 底部按钮占位 */}
      <div className="mt-6 pt-4 border-t border-ink-100 flex justify-center">
        <button
          className="lf-btn-primary"
          disabled
          title="预览模式"
        >
          {isAssess ? '提交答案' : '下一题'}
        </button>
      </div>
    </Card>
  )
}

/* ============================================================
 * 右侧配置面板
 * ============================================================ */
const SURVEY_TYPES: QuestionType[] = SURVEY_ALLOWED_TYPES
const ASSESS_TYPES: QuestionType[] = ASSESSMENT_ALLOWED_TYPES

/* ============================================================
 * 活动设置面板（活动级配置）
 * 对应 Figma 原型后台栏：活动标题/说明 + 测评及格分 + 反馈配置
 * ============================================================ */
function ActivitySettingsPanel({
  activity,
  isAssess,
  onActivityChange,
}: {
  activity: Activity
  isAssess: boolean
  onActivityChange: (patch: Partial<Activity>) => void
}) {
  const fb = activity.feedbackConfig ?? {}
  const totalScore = activity.scoringRule?.totalScore ?? 0
  const dimensions = activity.dimensions ?? []

  function setScoring(patch: Partial<NonNullable<Activity['scoringRule']>>) {
    onActivityChange({
      scoringRule: { totalScore, ...activity.scoringRule, ...patch },
    })
  }
  function setFeedback(patch: Partial<NonNullable<Activity['feedbackConfig']>>) {
    onActivityChange({ feedbackConfig: { ...fb, ...patch } })
  }
  function addDimension() {
    const d: Dimension = { id: uid('dim'), name: `维度 ${dimensions.length + 1}` }
    onActivityChange({ dimensions: [...dimensions, d] })
  }
  function updateDimension(id: string, name: string) {
    onActivityChange({
      dimensions: dimensions.map((d) => (d.id === id ? { ...d, name } : d)),
    })
  }
  function removeDimension(id: string) {
    onActivityChange({ dimensions: dimensions.filter((d) => d.id !== id) })
  }

  return (
    <div className="p-4">
      <div className="mb-4 pb-3 border-b border-ink-200">
        <div className="text-sm font-medium text-ink-900">活动设置</div>
        <div className="text-[11px] text-ink-500 mt-0.5">
          {isAssess ? '测评' : '问卷'}整体配置 · 对所有题目生效
        </div>
      </div>

      {/* 基础信息 */}
      <SectionTitle>基础信息</SectionTitle>
      <Field label={isAssess ? '测评标题' : '问卷标题'}>
        <Input
          value={activity.title}
          onChange={(e) => onActivityChange({ title: e.target.value })}
          placeholder={isAssess ? '如：第一课 · 知识小测' : '如：课堂反馈问卷'}
        />
      </Field>
      <Field label="活动说明" hint="可选 · 学生作答前看到">
        <Textarea
          rows={2}
          value={activity.description ?? ''}
          onChange={(e) => onActivityChange({ description: e.target.value })}
          placeholder={isAssess ? '本测评共若干题，请认真作答' : '本问卷不计分，仅用于课堂反馈'}
        />
      </Field>

      {/* 测评：评分规则 */}
      {isAssess && (
        <>
          <SectionTitle>评分规则</SectionTitle>
          <Field label="总分" hint="由各题分值自动汇总">
            <div className="h-9 px-3 flex items-center text-sm text-ink-700 bg-ink-50 border border-ink-200 rounded">
              {totalScore} 分
            </div>
          </Field>
          <Field label="及格分" hint="达到即视为通过">
            <Input
              type="number"
              value={activity.scoringRule?.passScore ?? ''}
              onChange={(e) =>
                setScoring({
                  passScore: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
              placeholder={`建议 ${Math.round(totalScore * 0.6)}`}
              className="!w-32"
            />
          </Field>
        </>
      )}

      {/* 知识维度（整卷级 taxonomy，仅测评） */}
      {isAssess && (
        <>
          <SectionTitle>知识维度</SectionTitle>
          <div className="text-[11px] text-ink-500 mb-2 leading-relaxed">
            定义本测评要考查的知识维度，再到每道题里关联。学生提交后可按维度看掌握度。
          </div>
          <div className="space-y-1.5">
            {dimensions.length === 0 && (
              <div className="text-[11px] text-ink-400 px-2 py-3 text-center bg-ink-50 border border-dashed border-ink-200 rounded">
                还没有维度，点下方添加
              </div>
            )}
            {dimensions.map((d, i) => (
              <div key={d.id} className="flex items-center gap-1.5">
                <span className="text-[11px] text-ink-400 w-4 shrink-0">{i + 1}</span>
                <Input
                  value={d.name}
                  onChange={(e) => updateDimension(d.id, e.target.value)}
                  className="!h-8 flex-1"
                  placeholder="如：AI 基础概念"
                />
                <button
                  onClick={() => removeDimension(d.id)}
                  className="text-[11px] text-red-600 hover:underline px-1 shrink-0"
                >
                  删
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addDimension}
            className="text-xs text-brand-text hover:underline mt-2"
          >
            + 添加维度
          </button>
        </>
      )}

      {/* 反馈配置 */}
      <SectionTitle>提交后反馈</SectionTitle>
      {isAssess ? (
        <div className="space-y-2.5">
          <ToggleRow
            label="显示成绩"
            hint="提交后给学生看得分"
            checked={fb.showScore !== false}
            onChange={(v) => setFeedback({ showScore: v })}
          />
          <ToggleRow
            label="显示对错与解析"
            hint="逐题展示正误及解析"
            checked={fb.showExplanation !== false}
            onChange={(v) => setFeedback({ showExplanation: v })}
          />
          <ToggleRow
            label="显示维度雷达"
            hint="按知识维度展示掌握度"
            checked={fb.showDimensionRadar === true}
            onChange={(v) => setFeedback({ showDimensionRadar: v })}
          />
        </div>
      ) : (
        <div className="text-xs text-ink-500 px-3 py-2 bg-ink-50 rounded leading-relaxed">
          问卷不计分。提交后向学生展示「全班匿名汇总」，让学生看到大家的选择分布。
        </div>
      )}
    </div>
  )
}

/* 开关行 */
function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-1.5 cursor-pointer">
      <div className="min-w-0">
        <div className="text-xs text-ink-900">{label}</div>
        {hint && <div className="text-[11px] text-ink-500 mt-0.5">{hint}</div>}
      </div>
      <input
        type="checkbox"
        className="accent-brand shrink-0 w-4 h-4"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  )
}

function ConfigPanel({
  activity,
  question,
  isAssess,
  onActivityChange,
  onQuestionChange,
}: {
  activity: Activity
  question?: Question
  isAssess: boolean
  onActivityChange: (patch: Partial<Activity>) => void
  onQuestionChange: (patch: Partial<Question>) => void
}) {
  const dimensions = activity.dimensions ?? []

  if (!question) {
    return (
      <div className="p-8 text-center text-xs text-ink-500">
        从左侧选择一道题查看 / 编辑配置
      </div>
    )
  }

  const meta = QUESTION_META[question.type]
  const groups = groupedTypes(isAssess ? ASSESS_TYPES : SURVEY_TYPES)

  // 题型属性：是否计分、是否需作答（决定显示哪些配置区）
  const isReview = question.type === 'knowledgeReview'  // 知识回顾：不计分、只看
  const isPrompt = question.type === 'promptPractice'   // Prompt：可计分但解析在 Body 里
  // 计分题型：测评里这些题型才显示分值/维度/解析
  const isScored = isAssess && !isReview
  // 需作答（"必答"开关只对需作答的题型有意义）
  const isAnswerable = !isReview

  return (
    <div className="p-4">
      {/* 顶部：当前题型定位 */}
      <div className="mb-4 pb-3 border-b border-ink-200">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{meta.icon}</span>
          <span className="text-sm font-medium text-ink-900">
            {QUESTION_TYPE_LABEL[question.type]}
          </span>
          <Tag variant={isAssess ? 'brand' : 'default'} className="!text-[10px] ml-auto">
            {isAssess ? '测评' : '问卷'}
          </Tag>
        </div>
        <div className="text-[11px] text-ink-500 mt-1">{meta.tagline}</div>
      </div>

      {/* ====== 1. 题型与题干 ====== */}
      <SectionTitle step={1}>题型与题干</SectionTitle>

      <Field label="题型">
        <select
          value={question.type}
          onChange={(e) => {
            // 切题型：重置 options/answer 等，避免脏数据
            const newType = e.target.value as QuestionType
            const fresh = makeNewQuestion(newType, isAssess)
            onQuestionChange({
              ...fresh,
              id: question.id,
              title: question.title,
              description: question.description,
              images: question.images,
              required: question.required,
              score: question.score,
              dimensions: question.dimensions,
              explanation: question.explanation,
            } as any)
          }}
          className="w-full h-9 border border-ink-200 rounded px-2 text-sm bg-white"
        >
          {groups.map((g) => (
            <optgroup key={g.group} label={g.label}>
              {g.types.map((t) => (
                <option key={t} value={t}>
                  {QUESTION_META[t].icon}　{QUESTION_TYPE_LABEL[t]}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>

      {/* 适配引导卡 */}
      <div className="mb-4 -mt-1 text-[11px] leading-relaxed bg-ink-50 border border-ink-100 rounded p-2.5">
        <div className="text-ink-700">{meta.fit}</div>
        {meta.redirect && (
          <div className="text-ink-500 mt-1 pt-1 border-t border-ink-100">
            💡 {meta.redirect}
          </div>
        )}
      </div>

      <Field label="题干">
        <Textarea
          rows={2}
          value={question.title}
          onChange={(e) => onQuestionChange({ title: e.target.value } as any)}
          placeholder="请输入题目"
        />
      </Field>

      <Field label="题干配图" hint="可选 · 最多 3 张，支持图文结合">
        <ImageUploader
          value={question.images ?? []}
          max={3}
          onChange={(imgs) => onQuestionChange({ images: imgs } as any)}
        />
      </Field>

      <Field label="题目说明" hint="可选 · 给学生看的补充">
        <Textarea
          rows={2}
          value={question.description ?? ''}
          onChange={(e) => onQuestionChange({ description: e.target.value } as any)}
          placeholder="可选"
        />
      </Field>

      {isAnswerable && (
        <Field label="是否必答">
          <label className="text-xs text-ink-700 inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="accent-brand"
              checked={question.required ?? false}
              onChange={(e) => onQuestionChange({ required: e.target.checked } as any)}
            />
            学生必须作答本题
          </label>
        </Field>
      )}

      {/* ====== 2. 题目内容 + 正确答案 ====== */}
      <SectionTitle step={2}>
        {isAssess ? '题目内容 + 正确答案' : '题目内容'}
      </SectionTitle>
      <QuestionBodyEditor
        question={question}
        isAssess={isAssess}
        onChange={onQuestionChange}
      />

      {/* ====== 3. 测评设置：分值 + 维度 + 解析（按题型细分）====== */}
      {isAssess && isReview && (
        <>
          <SectionTitle step={3}>题型说明</SectionTitle>
          <div className="text-xs text-ink-600 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded leading-relaxed">
            知识回顾用于课后复盘，<span className="font-medium text-amber-700">不计分</span>。
            学生逐张查看卡片，系统只记录"已查看"，不参与成绩与正确率统计。
          </div>
        </>
      )}

      {isScored && (
        <>
          <SectionTitle step={3}>评分与反馈</SectionTitle>

          <Field label="分值">
            <Input
              type="number"
              value={question.score ?? 0}
              onChange={(e) =>
                onQuestionChange({ score: Number(e.target.value) || 0 } as any)
              }
              className="!w-24"
            />
          </Field>

          {question.type === 'multipleChoice' && (
            <Field label="多选评分">
              <select
                value={(question as any).scoreMode ?? 'all-or-nothing'}
                onChange={(e) =>
                  onQuestionChange({ scoreMode: e.target.value } as any)
                }
                className="w-full h-9 border border-ink-200 rounded px-2 text-sm bg-white"
              >
                <option value="all-or-nothing">全对得分</option>
                <option value="partial">允许部分得分</option>
              </select>
            </Field>
          )}

          <Field
            label="关联维度"
            hint={dimensions.length === 0 ? '先在"活动设置"里定义维度' : '归入哪个知识维度'}
          >
            <select
              value={question.dimensions?.[0] ?? ''}
              disabled={dimensions.length === 0}
              onChange={(e) =>
                onQuestionChange({
                  dimensions: e.target.value ? [e.target.value] : [],
                } as any)
              }
              className="w-full h-9 border border-ink-200 rounded px-2 text-sm bg-white disabled:bg-ink-50 disabled:text-ink-400"
            >
              <option value="">不指定</option>
              {dimensions.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>

          {/* Prompt 练习的评分要点在题目内容区配置，这里不再重复"正确解析" */}
          {!isPrompt && (
            <Field label="正确解析" hint="提交后给学生看">
              <Textarea
                rows={2}
                value={question.explanation ?? ''}
                onChange={(e) =>
                  onQuestionChange({ explanation: e.target.value } as any)
                }
                placeholder="告诉学生为什么是这个答案"
              />
            </Field>
          )}

          {isPrompt && (
            <div className="text-[11px] text-ink-500 px-3 py-2 bg-ink-50 rounded leading-relaxed">
              Prompt 练习的评分要点已在上方「题目内容」中配置。本题通常由教师 / AI 评分。
            </div>
          )}
        </>
      )}

      {/* ====== 问卷设置 ====== */}
      {!isAssess && question.type === 'multipleChoice' && (
        <>
          <SectionTitle step={3}>问卷设置</SectionTitle>
          <Field label="最多可选" hint="留空 = 不限">
            <Input
              type="number"
              value={(question as any).maxSelect ?? ''}
              onChange={(e) =>
                onQuestionChange({
                  maxSelect: e.target.value === '' ? undefined : Number(e.target.value),
                } as any)
              }
              className="!w-24"
            />
          </Field>
        </>
      )}
    </div>
  )
}

function SectionTitle({ children, step }: { children: React.ReactNode; step?: number }) {
  return (
    <div className="flex items-center gap-2 mt-5 mb-3 pb-1.5 border-b border-ink-100">
      {step != null && (
        <span className="w-4 h-4 rounded-full bg-brand text-white text-[10px] flex items-center justify-center shrink-0">
          {step}
        </span>
      )}
      <span className="text-xs text-ink-700 font-medium">{children}</span>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-4">
      <label className="text-xs text-ink-700 mb-1.5 flex items-center justify-between">
        <span>{label}</span>
        {hint && <span className="text-ink-500 text-[11px]">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

/* ============================================================
 * 题目主体编辑器（按题型分发）
 * ============================================================ */
function QuestionBodyEditor({
  question,
  isAssess,
  onChange,
}: {
  question: Question
  isAssess: boolean
  onChange: (patch: any) => void
}) {
  switch (question.type) {
    case 'singleChoice':
    case 'multipleChoice':
      return <ChoiceBody question={question as any} isAssess={isAssess} onChange={onChange} />
    case 'judge':
      return <JudgeBody question={question as any} isAssess={isAssess} onChange={onChange} />
    case 'fillBlank':
      return <FillBody question={question as any} isAssess={isAssess} onChange={onChange} />
    case 'shortAnswer':
      return <ShortAnswerBody question={question as any} isAssess={isAssess} onChange={onChange} />
    case 'sort':
      return <SortBody question={question as any} isAssess={isAssess} onChange={onChange} />
    case 'classify':
      return <ClassifyBody question={question as any} isAssess={isAssess} onChange={onChange} />
    case 'wordCompose':
      return <WordComposeBody question={question as any} isAssess={isAssess} onChange={onChange} />
    case 'ratingScale':
      return <RatingBody question={question as any} onChange={onChange} />
    case 'workUpload':
      return <WorkUploadBody question={question as any} onChange={onChange} />
    case 'knowledgeReview':
      return <ReviewBody question={question as any} onChange={onChange} />
    case 'promptPractice':
      return <PromptBody question={question as any} onChange={onChange} />
    case 'materialGroup':
      return <MaterialGroupBody question={question as any} isAssess={isAssess} onChange={onChange} />
  }
}

/* ---------- 材料组合题 ---------- */
function MaterialGroupBody({
  question,
  isAssess,
  onChange,
}: {
  question: any
  isAssess: boolean
  onChange: (p: any) => void
}) {
  const subs: { id: string; title: string; options: Option[]; answer?: string }[] =
    question.subQuestions ?? []

  function updateSub(id: string, patch: any) {
    onChange({ subQuestions: subs.map((s) => (s.id === id ? { ...s, ...patch } : s)) })
  }
  function addSub() {
    onChange({
      subQuestions: [
        ...subs,
        {
          id: uid('sub'),
          title: '',
          options: [
            { id: uid('opt'), label: 'A', content: '选项一' },
            { id: uid('opt'), label: 'B', content: '选项二' },
          ],
        },
      ],
    })
  }
  function removeSub(id: string) {
    onChange({ subQuestions: subs.filter((s) => s.id !== id) })
  }
  function addOpt(sub: any) {
    const letter = String.fromCharCode(65 + sub.options.length)
    updateSub(sub.id, {
      options: [...sub.options, { id: uid('opt'), label: letter, content: '新选项' }],
    })
  }
  function updateOpt(sub: any, oid: string, patch: Partial<Option>) {
    updateSub(sub.id, {
      options: sub.options.map((o: Option) => (o.id === oid ? { ...o, ...patch } : o)),
    })
  }
  function removeOpt(sub: any, oid: string) {
    updateSub(sub.id, { options: sub.options.filter((o: Option) => o.id !== oid) })
  }

  return (
    <div className="space-y-3">
      <Field label="公共材料" hint="学生先读材料，再答下面的子题">
        <Textarea
          rows={3}
          value={question.materialText ?? ''}
          onChange={(e) => onChange({ materialText: e.target.value })}
          placeholder="粘贴阅读材料 / 案例正文（题干配图在上方通用配图处添加）"
        />
      </Field>

      <label className="text-xs text-ink-700 block">子题（每个子题为单选）</label>
      <div className="space-y-3">
        {subs.map((sub, i) => {
          const correctId = sub.answer
          return (
            <div key={sub.id} className="border border-ink-200 rounded-lg p-2.5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-ink-400">子题 {i + 1}</span>
                <button
                  onClick={() => removeSub(sub.id)}
                  className="ml-auto text-[11px] text-red-600 hover:underline"
                >
                  删除子题
                </button>
              </div>
              <Textarea
                rows={2}
                value={sub.title}
                onChange={(e) => updateSub(sub.id, { title: e.target.value })}
                placeholder="子题题干"
              />
              <div className="space-y-1.5">
                {sub.options.map((o) => {
                  const isCorrect = correctId === o.id
                  return (
                    <div key={o.id} className="flex items-center gap-1">
                      {isAssess && (
                        <button
                          type="button"
                          onClick={() => updateSub(sub.id, { answer: o.id })}
                          className={
                            'w-7 h-8 rounded border text-xs shrink-0 ' +
                            (isCorrect
                              ? 'border-brand bg-brand text-white'
                              : 'border-ink-200 text-ink-500 hover:bg-ink-50')
                          }
                          title="标记为正确答案"
                        >
                          ✓
                        </button>
                      )}
                      <Input
                        value={o.label}
                        onChange={(e) => updateOpt(sub, o.id, { label: e.target.value })}
                        className="!h-8 !w-12 text-center"
                      />
                      <Input
                        value={o.content}
                        onChange={(e) => updateOpt(sub, o.id, { content: e.target.value })}
                        className="!h-8 flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeOpt(sub, o.id)}
                        className="text-[11px] text-red-600 hover:underline px-1 shrink-0"
                      >
                        ×
                      </button>
                    </div>
                  )
                })}
                <button
                  type="button"
                  onClick={() => addOpt(sub)}
                  className="text-xs text-brand-text hover:underline"
                >
                  + 添加选项
                </button>
              </div>
            </div>
          )
        })}
      </div>
      <button
        type="button"
        onClick={addSub}
        className="text-xs text-brand-text hover:underline"
      >
        + 添加子题
      </button>
    </div>
  )
}

/* ---------- 判断题 ---------- */
function JudgeBody({
  question,
  isAssess,
  onChange,
}: {
  question: any
  isAssess: boolean
  onChange: (p: any) => void
}) {
  const labels: [string, string] = question.judgeLabels ?? ['对', '错']
  return (
    <div className="space-y-3">
      <Field label="展示方式">
        <select
          value={question.judgeStyle ?? 'slider'}
          onChange={(e) => onChange({ judgeStyle: e.target.value })}
          className="w-full h-9 border border-ink-200 rounded px-2 text-sm bg-white"
        >
          <option value="slider">滑动判断（左右滑块）</option>
          <option value="button">按钮式（两个按钮）</option>
          <option value="card">卡片式（大卡片带图标）</option>
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="正向文案" hint="默认「对」">
          <Input
            value={labels[0]}
            onChange={(e) => onChange({ judgeLabels: [e.target.value, labels[1]] })}
            placeholder="对"
          />
        </Field>
        <Field label="反向文案" hint="默认「错」">
          <Input
            value={labels[1]}
            onChange={(e) => onChange({ judgeLabels: [labels[0], e.target.value] })}
            placeholder="错"
          />
        </Field>
      </div>

      {isAssess ? (
        <Field label="正确答案">
          <select
            value={
              question.answer === undefined ? '' : question.answer ? '1' : '0'
            }
            onChange={(e) =>
              onChange({
                answer: e.target.value === '' ? undefined : e.target.value === '1',
              })
            }
            className="w-full h-9 border border-ink-200 rounded px-2 text-sm bg-white"
          >
            <option value="">— 未设置 —</option>
            <option value="1">{labels[0]} ✓</option>
            <option value="0">{labels[1]} ✗</option>
          </select>
        </Field>
      ) : (
        <div className="text-xs text-ink-500 px-3 py-2 bg-ink-50 rounded">
          判断题在问卷中只统计选择分布，无需正确答案
        </div>
      )}
    </div>
  )
}

/* ---------- 星级量表 ---------- */
function RatingBody({ question, onChange }: { question: any; onChange: (p: any) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="样式">
          <select
            value={question.style ?? 'star'}
            onChange={(e) => onChange({ style: e.target.value })}
            className="w-full h-9 border border-ink-200 rounded px-2 text-sm bg-white"
          >
            <option value="star">星级（★）</option>
            <option value="number">数字档（1-N）</option>
          </select>
        </Field>
        <Field label="最大档位">
          <Input
            type="number"
            value={question.max ?? 5}
            onChange={(e) => onChange({ max: Math.max(2, Math.min(10, Number(e.target.value) || 5)) })}
            className="!w-24"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="左端文案" hint="最低档">
          <Input
            value={question.labels?.[0] ?? ''}
            onChange={(e) => onChange({ labels: [e.target.value, question.labels?.[1] ?? ''] })}
            placeholder="如：很不满意"
          />
        </Field>
        <Field label="右端文案" hint="最高档">
          <Input
            value={question.labels?.[1] ?? ''}
            onChange={(e) => onChange({ labels: [question.labels?.[0] ?? '', e.target.value] })}
            placeholder="如：非常满意"
          />
        </Field>
      </div>
    </div>
  )
}

/* ---------- 作品上传 ---------- */
function WorkUploadBody({ question, onChange }: { question: any; onChange: (p: any) => void }) {
  return (
    <div className="space-y-3">
      <Field label="允许的文件类型" hint="仅文字说明，不限制实际格式">
        <Input
          value={question.accept ?? ''}
          onChange={(e) => onChange({ accept: e.target.value })}
          placeholder="如：图片 / PDF / 文档"
        />
      </Field>
      <Field label="上传提示">
        <Textarea
          rows={2}
          value={question.uploadHint ?? ''}
          onChange={(e) => onChange({ uploadHint: e.target.value })}
          placeholder="告诉学生要上传什么、有什么要求"
        />
      </Field>
      <Field label="附文字说明">
        <label className="text-xs text-ink-700 inline-flex items-center gap-2">
          <input
            type="checkbox"
            className="accent-brand"
            checked={question.needNote ?? false}
            onChange={(e) => onChange({ needNote: e.target.checked })}
          />
          要求学生为作品附一段文字说明
        </label>
      </Field>
    </div>
  )
}

/* ---------- 知识回顾 ---------- */
function ReviewBody({ question, onChange }: { question: any; onChange: (p: any) => void }) {
  const cards: { id: string; front: string; back: string }[] = question.cards ?? []
  function addCard() {
    onChange({ cards: [...cards, { id: uid('rc'), front: '', back: '' }] })
  }
  function updateCard(id: string, patch: Partial<{ front: string; back: string }>) {
    onChange({ cards: cards.map((c) => (c.id === id ? { ...c, ...patch } : c)) })
  }
  function removeCard(id: string) {
    onChange({ cards: cards.filter((c) => c.id !== id) })
  }
  return (
    <div className="space-y-3">
      <div className="text-[11px] text-ink-500 px-3 py-2 bg-amber-50 border border-amber-100 rounded leading-relaxed">
        知识回顾不计分，用于课后复盘。学生端会按下面方式展示卡片，仅记录"已查看"。
      </div>
      <Field label="展示方式">
        <select
          value={question.reviewStyle ?? 'flip'}
          onChange={(e) => onChange({ reviewStyle: e.target.value })}
          className="w-full h-9 border border-ink-200 rounded px-2 text-sm bg-white"
        >
          <option value="flip">翻转卡片（点击翻面看解释）</option>
          <option value="reveal">点击揭示（点击展开解释）</option>
          <option value="list">列表（正反面同时展示）</option>
        </select>
      </Field>
      <Field label={`回顾卡片（${cards.length}）`}>
        <div className="space-y-2">
          {cards.map((c, i) => (
            <div key={c.id} className="border border-ink-200 rounded p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-ink-400">卡片 {i + 1}</span>
                <button
                  onClick={() => removeCard(c.id)}
                  className="text-[11px] text-red-600 hover:underline"
                >
                  删除
                </button>
              </div>
              <Input
                value={c.front}
                onChange={(e) => updateCard(c.id, { front: e.target.value })}
                placeholder="正面 / 标题（如：监督学习）"
                className="!h-8"
              />
              <Textarea
                rows={2}
                value={c.back}
                onChange={(e) => updateCard(c.id, { back: e.target.value })}
                placeholder="背面 / 解释"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addCard}
          className="text-xs text-brand-text hover:underline mt-2"
        >
          + 添加卡片
        </button>
      </Field>
    </div>
  )
}

/* ---------- Prompt 练习 ---------- */
function PromptBody({ question, onChange }: { question: any; onChange: (p: any) => void }) {
  const structure: string[] = question.structure ?? []
  return (
    <div className="space-y-3">
      <Field label="任务目标" hint="告诉学生这次练习要达成什么">
        <Textarea
          rows={2}
          value={question.goal ?? ''}
          onChange={(e) => onChange({ goal: e.target.value })}
          placeholder="如：写一段提示词，让 AI 扮演严厉的历史老师讲解工业革命"
        />
      </Field>
      <Field label="结构提示" hint="每行一个要素，引导学生 Prompt 的组成">
        <Textarea
          rows={3}
          value={structure.join('\n')}
          onChange={(e) =>
            onChange({
              structure: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean),
            })
          }
          placeholder={'角色\n任务\n要求'}
        />
        {structure.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {structure.map((s, i) => (
              <span key={i} className="lf-tag !text-[10px]">{s}</span>
            ))}
          </div>
        )}
      </Field>
      <Field label="示例 Prompt" hint="可选 · 给学生参考的标准答案">
        <Textarea
          rows={3}
          value={question.example ?? ''}
          onChange={(e) => onChange({ example: e.target.value })}
          placeholder="你现在是一位非常严厉的历史老师……"
        />
      </Field>
      <Field label="评分要点" hint="提交后教师 / AI 评分依据">
        <Textarea
          rows={2}
          value={question.answer ?? ''}
          onChange={(e) => onChange({ answer: e.target.value })}
          placeholder="如：是否设定角色、是否说清任务、是否有格式/字数要求"
        />
      </Field>
    </div>
  )
}

/* ---------- 单选 / 多选 ---------- */
function ChoiceBody({
  question,
  isAssess,
  onChange,
}: {
  question: any
  isAssess: boolean
  onChange: (patch: any) => void
}) {
  const options: Option[] = question.options ?? []
  const correctSet: Set<string> = new Set(
    question.type === 'singleChoice'
      ? question.answer ? [question.answer] : []
      : question.answer ?? [],
  )

  function addOpt() {
    const letter = String.fromCharCode(65 + options.length)
    onChange({
      options: [
        ...options,
        { id: uid('opt'), label: letter, content: '新选项' },
      ],
    })
  }
  function removeOpt(id: string) {
    onChange({ options: options.filter((o) => o.id !== id) })
  }
  function updateOpt(id: string, patch: Partial<Option>) {
    onChange({ options: options.map((o) => (o.id === id ? { ...o, ...patch } : o)) })
  }
  function toggleCorrect(id: string) {
    if (question.type === 'singleChoice') {
      onChange({ answer: id })
    } else {
      const next = new Set(correctSet)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      onChange({ answer: Array.from(next) })
    }
  }

  return (
    <div>
      <Field label="展示方式">
        <select
          value={question.optionStyle ?? 'list'}
          onChange={(e) => {
            const newStyle = e.target.value
            const patch: any = { optionStyle: newStyle }
            // 切换到 composite：清空旧的 options/answer，初始化 subQuestions
            if (newStyle === 'composite') {
              patch.options = undefined
              patch.answer = undefined
              if (!question.subQuestions || question.subQuestions.length === 0) {
                patch.subQuestions = [
                  {
                    id: uid('sub'),
                    title: '小题 1',
                    options: [
                      { id: uid('opt'), label: 'A', content: '选项一' },
                      { id: uid('opt'), label: 'B', content: '选项二' },
                    ],
                    answer: undefined,
                  },
                ]
              }
            }
            // 从 composite 切回常规模式：清空 subQuestions/material，初始化 options
            if ((question.optionStyle ?? 'list') === 'composite' && newStyle !== 'composite') {
              patch.subQuestions = undefined
              patch.material = undefined
              patch.materialImage = undefined
              if (!question.options || question.options.length === 0) {
                patch.options = [
                  { id: uid('opt'), label: 'A', content: '选项一' },
                  { id: uid('opt'), label: 'B', content: '选项二' },
                ]
                patch.answer = question.type === 'singleChoice' ? undefined : []
              }
            }
            onChange(patch)
          }}
          className="w-full h-9 border border-ink-200 rounded px-2 text-sm bg-white"
        >
          <option value="list">列表式（纯文字选项）</option>
          <option value="card">卡片式（标题+说明，可配图）</option>
          <option value="grid">图片宫格式（每个选项配图）</option>
          {question.type === 'singleChoice' && (
            <option value="composite">组合式（材料题，一材料多小题）</option>
          )}
        </select>
      </Field>

      {/* 组合式：配置公共材料 + 子题 */}
      {question.optionStyle === 'composite' ? (
        <CompositeChoiceEditor question={question} isAssess={isAssess} onChange={onChange} />
      ) : (
        /* 常规模式：配置选项 */
        <>
          <label className="text-xs text-ink-700 mb-1.5 block">
            选项{isAssess ? '（点 ✓ 标正确答案）' : ''}
          </label>
          <div className="space-y-1.5">
        {options.map((o) => {
          const isCorrect = correctSet.has(o.id)
          return (
            <div key={o.id} className="space-y-1">
              <div className="flex items-center gap-1">
                {isAssess && (
                  <button
                    type="button"
                    onClick={() => toggleCorrect(o.id)}
                    className={
                      'w-7 h-8 rounded border text-xs shrink-0 ' +
                      (isCorrect
                        ? 'border-brand bg-brand text-white'
                        : 'border-ink-200 text-ink-500 hover:bg-ink-50')
                    }
                    title="标记为正确答案"
                  >
                    ✓
                  </button>
                )}
                <Input
                  value={o.label}
                  onChange={(e) => updateOpt(o.id, { label: e.target.value })}
                  className="!h-8 !w-12 text-center"
                />
                <Input
                  value={o.content}
                  onChange={(e) => updateOpt(o.id, { content: e.target.value })}
                  className="!h-8 flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeOpt(o.id)}
                  className="text-[11px] text-red-600 hover:underline px-1 shrink-0"
                >
                  ×
                </button>
              </div>
              {/* 图片宫格式：每选项配图 */}
              {question.optionStyle === 'grid' && (
                <div className="ml-8">
                  <ImageUploader
                    value={o.image ? [o.image] : []}
                    max={1}
                    thumbClass="w-16 h-16"
                    onChange={(imgs) => updateOpt(o.id, { image: imgs[0] ?? undefined })}
                  />
                </div>
              )}
              {/* 卡片式：补充说明 + 可选配图 */}
              {question.optionStyle === 'card' && (
                <div className="ml-8 space-y-1.5">
                  <Input
                    value={o.desc ?? ''}
                    onChange={(e) => updateOpt(o.id, { desc: e.target.value })}
                    placeholder="补充说明（可选）"
                    className="!h-8 text-[11px]"
                  />
                  <ImageUploader
                    value={o.image ? [o.image] : []}
                    max={1}
                    thumbClass="w-14 h-14"
                    onChange={(imgs) => updateOpt(o.id, { image: imgs[0] ?? undefined })}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
      <button
        type="button"
        onClick={addOpt}
        className="text-xs text-brand-text hover:underline mt-2"
      >
        + 添加选项
      </button>
        </>
      )}
    </div>
  )
}

/* ---------- 组合式单选编辑器（材料题） ---------- */
function CompositeChoiceEditor({
  question,
  isAssess,
  onChange,
}: {
  question: any
  isAssess: boolean
  onChange: (patch: any) => void
}) {
  const subQuestions = question.subQuestions ?? []

  function addSubQuestion() {
    onChange({
      subQuestions: [
        ...subQuestions,
        {
          id: uid('sub'),
          title: '新小题',
          options: [
            { id: uid('opt'), label: 'A', content: '选项一' },
            { id: uid('opt'), label: 'B', content: '选项二' },
          ],
          answer: undefined,
        },
      ],
    })
  }

  function removeSubQuestion(id: string) {
    onChange({ subQuestions: subQuestions.filter((s: any) => s.id !== id) })
  }

  function updateSubQuestion(id: string, patch: any) {
    onChange({
      subQuestions: subQuestions.map((s: any) => (s.id === id ? { ...s, ...patch } : s)),
    })
  }

  return (
    <div className="space-y-3">
      {/* 公共材料 */}
      <Field label="公共材料（可选）" hint="案例文本或背景说明">
        <Textarea
          rows={3}
          value={question.material ?? ''}
          onChange={(e) => onChange({ material: e.target.value })}
          placeholder="请阅读以下材料..."
        />
      </Field>

      <Field label="材料配图（可选）">
        <Input
          value={question.materialImage ?? ''}
          onChange={(e) => onChange({ materialImage: e.target.value })}
          placeholder="https://..."
        />
      </Field>

      {/* 子题列表 */}
      <label className="text-xs text-ink-700 mb-1.5 block">
        子题列表{isAssess ? '（点 ✓ 标正确答案）' : ''}
      </label>
      <div className="space-y-3">
        {subQuestions.map((sub: any, idx: number) => (
          <div key={sub.id} className="p-3 bg-ink-50 border border-ink-200 rounded space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-ink-500 shrink-0">{idx + 1}.</span>
              <Input
                value={sub.title}
                onChange={(e) => updateSubQuestion(sub.id, { title: e.target.value })}
                placeholder="小题题干"
                className="!h-8 flex-1"
              />
              <button
                type="button"
                onClick={() => removeSubQuestion(sub.id)}
                className="text-[11px] text-red-600 hover:underline px-1 shrink-0"
              >
                删除
              </button>
            </div>

            {/* 该小题的选项 */}
            <div className="space-y-1 pl-4">
              {sub.options.map((opt: Option) => {
                const isCorrect = sub.answer === opt.id
                return (
                  <div key={opt.id} className="flex items-center gap-1">
                    {isAssess && (
                      <button
                        type="button"
                        onClick={() =>
                          updateSubQuestion(sub.id, { answer: isCorrect ? undefined : opt.id })
                        }
                        className={
                          'w-5 h-5 text-xs shrink-0 ' +
                          (isCorrect ? 'text-green-600' : 'text-ink-300 hover:text-green-600')
                        }
                      >
                        {isCorrect ? '✓' : '○'}
                      </button>
                    )}
                    <span className="text-[11px] text-ink-500 w-5 shrink-0">{opt.label}</span>
                    <Input
                      value={opt.content}
                      onChange={(e) => {
                        const nextOpts = sub.options.map((o: Option) =>
                          o.id === opt.id ? { ...o, content: e.target.value } : o,
                        )
                        updateSubQuestion(sub.id, { options: nextOpts })
                      }}
                      className="!h-7 flex-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nextOpts = sub.options.filter((o: Option) => o.id !== opt.id)
                        updateSubQuestion(sub.id, { options: nextOpts })
                      }}
                      className="text-[10px] text-red-600 hover:underline px-1 shrink-0"
                    >
                      ×
                    </button>
                  </div>
                )
              })}
              <button
                type="button"
                onClick={() => {
                  const letter = String.fromCharCode(65 + sub.options.length)
                  updateSubQuestion(sub.id, {
                    options: [
                      ...sub.options,
                      { id: uid('opt'), label: letter, content: '新选项' },
                    ],
                  })
                }}
                className="text-[10px] text-brand-text hover:underline"
              >
                + 添加选项
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addSubQuestion}
        className="text-xs text-brand-text hover:underline"
      >
        + 添加小题
      </button>
    </div>
  )
}

/* ---------- 填空 ---------- */
function FillBody({
  question,
  isAssess,
  onChange,
}: {
  question: any
  isAssess: boolean
  onChange: (patch: any) => void
}) {
  const blanks = question.blanks ?? 1
  const answer: string[][] = question.answer ?? []

  function setBlanks(n: number) {
    const safe = Math.max(1, Math.min(6, n))
    const next = [...answer]
    while (next.length < safe) next.push([])
    next.length = safe
    onChange({ blanks: safe, answer: next })
  }
  function setBlankAccepts(i: number, val: string) {
    const next = [...answer]
    while (next.length <= i) next.push([])
    next[i] = val.split('/').map((x) => x.trim()).filter(Boolean)
    onChange({ answer: next })
  }

  return (
    <div className="space-y-3">
      <div className="text-[11px] text-ink-500 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded leading-relaxed">
        <div className="font-medium text-emerald-800 mb-0.5">💡 填空题适用</div>
        <div>固定关键词、术语、年代、名词。答案短（≤ 50 字）、可机器评分。</div>
        <div className="mt-1 text-ink-500">
          若需要大段解释，请改用<span className="text-emerald-800 font-medium">简答题</span>。
          下拉选词请用<span className="text-emerald-800 font-medium">单选题</span>。
        </div>
      </div>

      <Field label="展示方式">
        <select
          value={question.fillStyle ?? (blanks === 1 ? 'single' : 'multi')}
          onChange={(e) => {
            const newStyle = e.target.value
            const patch: any = { fillStyle: newStyle }
            // 切换到 single：锁定 blanks=1，清空多余 answer
            if (newStyle === 'single') {
              patch.blanks = 1
              patch.inlineText = undefined
              patch.materialImage = undefined
              const next = [...answer]
              next.length = 1
              patch.answer = next
            }
            // 切换到 inline：清空 blanks/materialImage，空数由模板自动计算
            if (newStyle === 'inline') {
              patch.materialImage = undefined
              // blanks 由 inlineText 的 ___ 数量决定，不在这里设置
            }
            // 切换到 multi：清空 inlineText/materialImage
            if (newStyle === 'multi') {
              patch.inlineText = undefined
              patch.materialImage = undefined
            }
            // 切换到 material：清空 inlineText
            if (newStyle === 'material') {
              patch.inlineText = undefined
            }
            onChange(patch)
          }}
          className="w-full h-9 border border-ink-200 rounded px-2 text-sm bg-white"
        >
          <option value="single">1. 单空输入式（核心术语 / 关键词）</option>
          <option value="inline">2. 句中填空式（补全定义 / 固定表达）</option>
          <option value="multi">3. 多空填空式（多个相关概念）</option>
          <option value="material">4. 材料辅助式（看图 / 案例后填写）</option>
        </select>
      </Field>

      {/* 句中填空：模板字符串 */}
      {(question.fillStyle ?? 'multi') === 'inline' && (
        <Field label="句子模板" hint="用 ___ 表示空位">
          <Textarea
            rows={2}
            value={question.inlineText ?? ''}
            onChange={(e) => {
              const text = e.target.value
              const count = (text.match(/___/g) ?? []).length || 1
              onChange({ inlineText: text, blanks: count })
            }}
            placeholder="例：人工智能（AI）的核心是让机器模拟人类的 ___ 行为。"
          />
        </Field>
      )}

      {/* 材料辅助：图片 URL */}
      {(question.fillStyle ?? 'multi') === 'material' && (
        <Field label="材料图片 URL" hint="可选">
          <Input
            value={question.materialImage ?? ''}
            onChange={(e) => onChange({ materialImage: e.target.value })}
            placeholder="https://..."
          />
        </Field>
      )}

      {/* 空数：single 固定1，inline 自动计算，multi/material 可配 */}
      {((question.fillStyle ?? 'multi') === 'multi' || (question.fillStyle ?? 'multi') === 'material') && (
        <Field label="空数（1-6）" hint="推荐 1-3 个">
          <Input
            type="number"
            value={blanks}
            onChange={(e) => setBlanks(Math.max(1, Math.min(6, Number(e.target.value) || 1)))}
            className="!w-24"
          />
        </Field>
      )}

      {!isAssess && (
        <Field label="填空提示" hint="可选 · 输入框 placeholder">
          <Input
            value={question.placeholder ?? ''}
            onChange={(e) => onChange({ placeholder: e.target.value })}
            placeholder="如：请填写"
          />
        </Field>
      )}

      {isAssess && (
        <Field label="错别字容错">
          <label className="text-xs text-ink-700 inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="accent-brand"
              checked={question.fuzzyMatch ?? false}
              onChange={(e) => onChange({ fuzzyMatch: e.target.checked })}
            />
            一个字差异给一半分
          </label>
        </Field>
      )}

      {isAssess &&
        Array.from({ length: blanks }).map((_, i) => (
          <Field
            key={i}
            label={`第 ${i + 1} 空 · 标准答案`}
            hint="多个用 / 分隔"
          >
            <Input
              value={(answer[i] ?? []).join(' / ')}
              onChange={(e) => setBlankAccepts(i, e.target.value)}
              placeholder="如：人工智能 / AI / Artificial Intelligence"
            />
          </Field>
        ))}
    </div>
  )
}

/* ---------- 简答 ---------- */
function ShortAnswerBody({
  question,
  isAssess,
  onChange,
}: {
  question: any
  isAssess: boolean
  onChange: (patch: any) => void
}) {
  const shortStyle = question.shortStyle ?? 'long'
  // 切换展示方式时同步默认字数，并清理旧模式的专属字段
  function setShortStyle(s: string) {
    const presets: Record<string, { min: number; max: number }> = {
      short:      { min: 10,  max: 50  },
      long:       { min: 50,  max: 300 },
      material:   { min: 50,  max: 300 },
      structured: { min: 30,  max: 200 },
      ai:         { min: 50,  max: 300 },
    }
    const p = presets[s] ?? presets.long
    const patch: any = { shortStyle: s, minLength: p.min, maxLength: p.max }

    // 清理不属于新模式的字段
    if (s !== 'structured') patch.structuredFields = undefined
    if (s !== 'material') {
      patch.materialText = undefined
      patch.materialImage = undefined
    }
    if (s !== 'ai') patch.aiPrompt = undefined

    onChange(patch)
  }
  const fields: string[] = question.structuredFields ?? []

  return (
    <div className="space-y-3">
      <div className="text-[11px] text-ink-500 px-3 py-2 bg-sky-50 border border-sky-100 rounded leading-relaxed">
        <div className="font-medium text-sky-800 mb-0.5">💡 简答题适用</div>
        <div>开放性回答 · 理解 / 分析 / 反思。需要教师或 AI 评分。</div>
        <div className="mt-1 text-ink-500">
          若答案是固定关键词 → 请改用<span className="text-sky-800 font-medium">填空题</span>。
        </div>
      </div>

      <Field label="展示方式">
        <select
          value={shortStyle}
          onChange={(e) => setShortStyle(e.target.value)}
          className="w-full h-9 border border-ink-200 rounded px-2 text-sm bg-white"
        >
          <option value="short">1. 短答式（1-3 行 · 10-50 字）</option>
          <option value="long">2. 长文本简答式（4-6 行 · 50-150 字）</option>
          <option value="material">3. 图文材料简答式（看材料后答）</option>
          <option value="structured">4. 结构化简答式（多字段分别填写）</option>
          <option value="ai">5. AI 辅助简答式（带灵感按钮）</option>
        </select>
      </Field>

      {/* 图文材料模式专属：粘贴材料 */}
      {shortStyle === 'material' && (
        <>
          <Field label="材料正文" hint="可选">
            <Textarea
              rows={3}
              value={question.materialText ?? ''}
              onChange={(e) => onChange({ materialText: e.target.value })}
              placeholder="2023 年，生成式 AI 迎来爆发..."
            />
          </Field>
          <Field label="材料图片 URL" hint="可选">
            <Input
              value={question.materialImage ?? ''}
              onChange={(e) => onChange({ materialImage: e.target.value })}
              placeholder="https://..."
            />
          </Field>
        </>
      )}

      {/* 结构化模式专属：字段列表 */}
      {shortStyle === 'structured' && (
        <Field label="字段列表" hint="每行一个字段名">
          <Textarea
            rows={3}
            value={fields.join('\n')}
            onChange={(e) =>
              onChange({
                structuredFields: e.target.value
                  .split('\n')
                  .map((x) => x.trim())
                  .filter(Boolean),
              })
            }
            placeholder={'观点\n论据\n反例'}
          />
          {fields.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {fields.map((f, i) => (
                <span key={i} className="lf-tag !text-[10px]">字段 {i + 1}：{f}</span>
              ))}
            </div>
          )}
        </Field>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Field label="最少字数">
          <Input
            type="number"
            value={question.minLength ?? 50}
            onChange={(e) =>
              onChange({ minLength: Math.max(0, Number(e.target.value) || 0) })
            }
          />
        </Field>
        <Field label="最多字数">
          <Input
            type="number"
            value={question.maxLength ?? 300}
            onChange={(e) =>
              onChange({ maxLength: Math.max(1, Number(e.target.value) || 1) })
            }
          />
        </Field>
      </div>

      <Field label="输入提示" hint="placeholder">
        <Input
          value={question.placeholder ?? ''}
          onChange={(e) => onChange({ placeholder: e.target.value })}
          placeholder="如：请结合生活举一个 AI 的例子"
        />
      </Field>

      {isAssess && (
        <>
          <Field label="评分模式">
            <select
              value={question.gradeMode ?? 'manual'}
              onChange={(e) => onChange({ gradeMode: e.target.value })}
              className="w-full h-9 border border-ink-200 rounded px-2 text-sm bg-white"
            >
              <option value="manual">教师人工评分</option>
              <option value="ai">AI 初评 + 教师复核</option>
              <option value="keyword">关键词命中评分（轻量）</option>
            </select>
          </Field>

          {(question.gradeMode ?? 'manual') === 'keyword' && (
            <Field label="关键词列表" hint="用 / 分隔">
              <Input
                value={(question.keywords ?? []).join(' / ')}
                onChange={(e) =>
                  onChange({
                    keywords: e.target.value
                      .split('/')
                      .map((x: string) => x.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="如：监督学习 / 训练数据 / 标签"
              />
            </Field>
          )}

          <Field label="参考答案 / 评分要点">
            <Textarea
              rows={3}
              value={question.answer ?? ''}
              onChange={(e) => onChange({ answer: e.target.value })}
              placeholder="例：要点 1 - 模型基于海量数据预训练；要点 2 - 核心是概率预测..."
            />
          </Field>
        </>
      )}

      {!isAssess && (
        <Field label="问卷选项">
          <label className="text-xs text-ink-700 inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="accent-brand"
              checked={question.anonymous ?? false}
              onChange={(e) => onChange({ anonymous: e.target.checked })}
            />
            匿名收集（不显示学生姓名）
          </label>
        </Field>
      )}
    </div>
  )
}

/* ---------- 排序 ---------- */
function SortBody({
  question,
  isAssess,
  onChange,
}: {
  question: any
  isAssess: boolean
  onChange: (patch: any) => void
}) {
  const items: { id: string; content: string }[] = question.items ?? []
  const answer: string[] = question.answer ?? []

  function addItem() {
    const id = uid('sort')
    const next = [...items, { id, content: `选项 ${items.length + 1}` }]
    onChange({
      items: next,
      ...(isAssess ? { answer: [...answer, id] } : {}),
    })
  }
  function updateItem(id: string, content: string) {
    onChange({
      items: items.map((it) => (it.id === id ? { ...it, content } : it)),
    })
  }
  function removeItem(id: string) {
    onChange({
      items: items.filter((it) => it.id !== id),
      ...(isAssess ? { answer: answer.filter((x) => x !== id) } : {}),
    })
  }
  function moveAnswer(id: string, delta: -1 | 1) {
    const idx = answer.indexOf(id)
    const tgt = idx + delta
    if (idx < 0 || tgt < 0 || tgt >= answer.length) return
    const next = [...answer]
    ;[next[idx], next[tgt]] = [next[tgt], next[idx]]
    onChange({ answer: next })
  }

  return (
    <div className="space-y-3">
      <Field label="展示方式">
        <select
          value={question.sortStyle ?? 'updown'}
          onChange={(e) => onChange({ sortStyle: e.target.value })}
          className="w-full h-9 border border-ink-200 rounded px-2 text-sm bg-white"
        >
          <option value="updown">上下移式（↑↓ 调整顺序）</option>
          <option value="timeline">时间线式（纵向流程，适合步骤/时间顺序）</option>
        </select>
      </Field>
      <Field label="待排序项">
        <div className="space-y-1.5">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-1">
              <Input
                value={it.content}
                onChange={(e) => updateItem(it.id, e.target.value)}
                className="!h-8 flex-1"
              />
              <button
                type="button"
                onClick={() => removeItem(it.id)}
                className="text-[11px] text-red-600 hover:underline px-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="text-xs text-brand-text hover:underline mt-2"
        >
          + 添加选项
        </button>
      </Field>

      {isAssess && answer.length > 0 && (
        <Field label="正确顺序 · 用 ↑ ↓ 调整">
          <div className="space-y-1.5">
            {answer.map((id, i) => {
              const it = items.find((x) => x.id === id)
              if (!it) return null
              return (
                <div
                  key={id}
                  className="flex items-center gap-1 px-2 py-1 border border-ink-200 rounded bg-white"
                >
                  <span className="text-[11px] text-ink-500 w-5">{i + 1}.</span>
                  <span className="text-xs text-ink-900 flex-1 truncate">
                    {it.content}
                  </span>
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => moveAnswer(id, -1)}
                    className="text-[11px] px-1 h-6 hover:bg-ink-50 text-ink-500 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={i === answer.length - 1}
                    onClick={() => moveAnswer(id, 1)}
                    className="text-[11px] px-1 h-6 hover:bg-ink-50 text-ink-500 disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
              )
            })}
          </div>
        </Field>
      )}
    </div>
  )
}

/* ---------- 分类 ---------- */
function ClassifyBody({
  question,
  isAssess,
  onChange,
}: {
  question: any
  isAssess: boolean
  onChange: (patch: any) => void
}) {
  const categories: { id: string; name: string }[] = question.categories ?? []
  const items: { id: string; content: string }[] = question.items ?? []
  const answer: Record<string, string> = question.answer ?? {}

  function addCategory() {
    onChange({
      categories: [
        ...categories,
        { id: uid('cat'), name: `分类 ${categories.length + 1}` },
      ],
    })
  }
  function updateCategory(id: string, name: string) {
    onChange({
      categories: categories.map((c) => (c.id === id ? { ...c, name } : c)),
    })
  }
  function removeCategory(id: string) {
    const nextAns = { ...answer }
    Object.keys(nextAns).forEach((k) => { if (nextAns[k] === id) delete nextAns[k] })
    onChange({
      categories: categories.filter((c) => c.id !== id),
      answer: nextAns,
    })
  }
  function addItem() {
    onChange({
      items: [...items, { id: uid('item'), content: `项目 ${items.length + 1}` }],
    })
  }
  function updateItem(id: string, content: string) {
    onChange({ items: items.map((it) => (it.id === id ? { ...it, content } : it)) })
  }
  function removeItem(id: string) {
    const nextAns = { ...answer }
    delete nextAns[id]
    onChange({ items: items.filter((it) => it.id !== id), answer: nextAns })
  }
  function setItemCategory(itemId: string, catId: string) {
    onChange({ answer: { ...answer, [itemId]: catId } })
  }

  return (
    <div className="space-y-3">
      <Field label="分类">
        <div className="space-y-1.5">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-1">
              <Input
                value={c.name}
                onChange={(e) => updateCategory(c.id, e.target.value)}
                className="!h-8 flex-1"
              />
              <button
                type="button"
                onClick={() => removeCategory(c.id)}
                className="text-[11px] text-red-600 hover:underline px-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addCategory}
          className="text-xs text-brand-text hover:underline mt-2"
        >
          + 添加分类
        </button>
      </Field>

      <Field label="待分类项">
        <div className="space-y-1.5">
          {items.map((it) => {
            const assigned = !!answer[it.id]
            return (
              <div
                key={it.id}
                className={
                  'flex items-center gap-1 p-1.5 rounded ' +
                  (isAssess && !assigned ? 'bg-amber-50 border border-amber-200' : '')
                }
              >
                <Input
                  value={it.content}
                  onChange={(e) => updateItem(it.id, e.target.value)}
                  className="!h-8 flex-1"
                />
                {isAssess && (
                  <select
                    value={answer[it.id] ?? ''}
                    onChange={(e) => setItemCategory(it.id, e.target.value)}
                    className="h-8 border border-ink-200 rounded px-1 text-xs bg-white w-24"
                  >
                    <option value="">→ 未分配</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => removeItem(it.id)}
                  className="text-[11px] text-red-600 hover:underline px-1"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="text-xs text-brand-text hover:underline mt-2"
        >
          + 添加项目
        </button>
      </Field>
    </div>
  )
}

/* ---------- 词组选配 ---------- */
function WordComposeBody({
  question,
  isAssess,
  onChange,
}: {
  question: any
  isAssess: boolean
  onChange: (patch: any) => void
}) {
  const leftItems: { id: string; content: string }[] = question.leftItems ?? []
  const rightItems: { id: string; content: string }[] = question.rightItems ?? []
  const answer: { leftId: string; rightId: string }[] = question.answer ?? []

  function addLeft() {
    onChange({
      leftItems: [...leftItems, { id: uid('L'), content: `左 ${leftItems.length + 1}` }],
    })
  }
  function addRight() {
    onChange({
      rightItems: [...rightItems, { id: uid('R'), content: `右 ${rightItems.length + 1}` }],
    })
  }
  function updateLeft(id: string, content: string) {
    onChange({ leftItems: leftItems.map((x) => (x.id === id ? { ...x, content } : x)) })
  }
  function updateRight(id: string, content: string) {
    onChange({ rightItems: rightItems.map((x) => (x.id === id ? { ...x, content } : x)) })
  }
  function removeLeft(id: string) {
    onChange({
      leftItems: leftItems.filter((x) => x.id !== id),
      answer: answer.filter((p) => p.leftId !== id),
    })
  }
  function removeRight(id: string) {
    onChange({
      rightItems: rightItems.filter((x) => x.id !== id),
      answer: answer.filter((p) => p.rightId !== id),
    })
  }
  function setPair(leftId: string, rightId: string) {
    const next = [...answer]
    const idx = next.findIndex((p) => p.leftId === leftId)
    if (idx >= 0) next[idx] = { leftId, rightId }
    else next.push({ leftId, rightId })
    onChange({ answer: next })
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Field label="左侧项">
            {leftItems.map((x) => (
              <div key={x.id} className="mb-1 flex gap-1">
                <Input
                  value={x.content}
                  onChange={(e) => updateLeft(x.id, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeLeft(x.id)}
                  className="lf-btn-ghost !h-9 !w-9 shrink-0 text-red-600"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addLeft}
              className="lf-btn-secondary !h-8 text-xs w-full"
            >
              + 添加左项
            </button>
          </Field>
        </div>
        <div>
          <Field label="右侧项">
            {rightItems.map((x) => (
              <div key={x.id} className="mb-1 flex gap-1">
                <Input
                  value={x.content}
                  onChange={(e) => updateRight(x.id, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeRight(x.id)}
                  className="lf-btn-ghost !h-9 !w-9 shrink-0 text-red-600"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addRight}
              className="lf-btn-secondary !h-8 text-xs w-full"
            >
              + 添加右项
            </button>
          </Field>
        </div>
      </div>

      {isAssess && (
        <Field label="正确配对">
          <div className="space-y-1.5">
            {leftItems.map((left) => {
              const pair = answer.find((p) => p.leftId === left.id)
              return (
                <div key={left.id} className="flex items-center gap-2 text-xs">
                  <span className="w-32 truncate text-ink-700">{left.content}</span>
                  <span>→</span>
                  <select
                    value={pair?.rightId ?? ''}
                    onChange={(e) => setPair(left.id, e.target.value)}
                    className="flex-1 h-8 border border-ink-200 rounded px-2 text-sm bg-white"
                  >
                    <option value="">未设置</option>
                    {rightItems.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.content}
                      </option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>
        </Field>
      )}
    </div>
  )
}

/* ---------- 通用字段组件 ---------- */

/* ---------- 新建题目 ---------- */
function makeNewQuestion(type: QuestionType, isAssess: boolean): Question {
  const base = {
    id: uid('q'),
    type,
    title: '',
    score: isAssess ? 10 : undefined,
  }
  switch (type) {
    case 'singleChoice':
    case 'multipleChoice':
      return { ...base, options: [], answer: type === 'singleChoice' ? null : [] } as unknown as Question
    case 'judge':
      return { ...base, answer: null } as unknown as Question
    case 'fillBlank':
      return { ...base, blanks: 1, answer: [[]] } as unknown as Question
    case 'shortAnswer':
      return { ...base, answer: '' } as unknown as Question
    case 'sort':
      return { ...base, items: [], answer: [] } as unknown as Question
    case 'classify':
      return { ...base, categories: [], items: [], answer: {} } as unknown as Question
    case 'wordCompose':
      return { ...base, leftItems: [], rightItems: [], answer: [] } as unknown as Question
    case 'ratingScale':
      return { ...base, score: undefined, max: 5, style: 'star', labels: ['很不满意', '非常满意'] } as unknown as Question
    case 'workUpload':
      return { ...base, score: undefined, accept: '图片 / PDF', needNote: true, uploadHint: '' } as unknown as Question
    case 'knowledgeReview':
      return {
        ...base,
        score: undefined,
        reviewStyle: 'flip',
        cards: [
          { id: uid('rc'), front: '概念', back: '解释' },
        ],
      } as unknown as Question
    case 'promptPractice':
      return {
        ...base,
        goal: '',
        structure: ['角色', '任务', '要求'],
        example: '',
        answer: '',
      } as unknown as Question
    case 'materialGroup':
      return {
        ...base,
        materialText: '',
        subQuestions: [
          {
            id: uid('sub'),
            title: '',
            options: [
              { id: uid('opt'), label: 'A', content: '选项一' },
              { id: uid('opt'), label: 'B', content: '选项二' },
            ],
          },
        ],
      } as unknown as Question
    default:
      return base as Question
  }
}
