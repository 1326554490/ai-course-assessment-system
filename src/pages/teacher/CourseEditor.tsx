import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Input, Tag, Textarea, Icon } from '@/components/ui'
import type { IconName } from '@/components/ui'
import { CourseCover } from '@/components/CourseCover'
import { SimpleMarkdown } from '@/components/SimpleMarkdown'
import { QuestionRenderer } from '@/components/question'
import {
  getActivityById,
  getCourseById,
  saveActivity,
  saveCourse,
} from '@/store'
import { createEmptyAnswer, uid } from '@/utils'
import { QUESTION_TYPE_LABEL, SURVEY_ALLOWED_TYPES, ASSESSMENT_ALLOWED_TYPES } from '@/types'
import type {
  Activity,
  Course,
  Dimension,
  LessonNode,
  LessonNodeType,
  ResolvedNode,
  Question,
  QuestionType,
  Option,
} from '@/types'

const NODE_TYPE_LABEL: Record<LessonNodeType, string> = {
  content:    '图文内容',
  survey:     '课堂问卷',
  assessment: '知识测评',
  aiPractice: 'AI 互动',
  feedback:   '课后反馈',
}

const NODE_TYPE_ICON: Record<LessonNodeType, IconName> = {
  content:    'fileText',
  survey:     'clipboard',
  assessment: 'check',
  aiPractice: 'sparkles',
  feedback:   'message',
}

/**
 * 教师端 - 课节编辑器（完整版）
 *
 * 三栏布局：
 *  - 左侧：节点列表 + 增删改序
 *  - 中间：当前节点预览（学生端视角）
 *  - 右侧：节点配置面板（包括题目编辑）
 *
 * 本版本支持完整的题目编辑功能（增删改题、正确答案、分值、维度）
 */
export function TeacherCourseEditor() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const original = courseId ? getCourseById(courseId) : undefined

  if (!original) {
    return (
      <div className="p-6">
        <Card>
          <div className="py-12 text-center text-sm text-ink-500">课程不存在</div>
        </Card>
      </div>
    )
  }

  const [course, setCourse] = useState<Course>(() =>
    JSON.parse(JSON.stringify(original)),
  )
  /** 本次编辑会话内被修改过的 Activity（按 id 索引） */
  const [activityDrafts, setActivityDrafts] = useState<Record<string, Activity>>({})
  const [currentLessonId, setCurrentLessonId] = useState<string>(
    course.lessons[0]?.id ?? '',
  )
  const [currentNodeId, setCurrentNodeId] = useState<string>(
    course.lessons[0]?.nodes[0]?.id ?? '',
  )
  const [dirty, setDirty] = useState(false)

  const currentLesson = useMemo(
    () => course.lessons.find((l) => l.id === currentLessonId),
    [course, currentLessonId],
  )
  const currentRawNode = useMemo(
    () => currentLesson?.nodes.find((n) => n.id === currentNodeId),
    [currentLesson, currentNodeId],
  )
  /** 获取当前节点对应的 activity（优先草稿，回退到 store） */
  const currentActivity = useMemo<Activity | undefined>(() => {
    if (!currentRawNode?.activityId) return undefined
    return (
      activityDrafts[currentRawNode.activityId] ??
      getActivityById(currentRawNode.activityId)
    )
  }, [currentRawNode, activityDrafts])

  /** 注水后的当前节点 - 中间预览用 */
  const currentResolved = useMemo<ResolvedNode | undefined>(() => {
    if (!currentRawNode) return undefined
    const base: ResolvedNode = { ...currentRawNode, required: currentRawNode.completionRequired }
    const act = currentActivity
    if (!act) return base
    base.activity = act
    base.questions = act.questions
    base.dimensions = act.dimensions
    base.practiceType = act.practiceType
    base.examples = act.examples
    if (act.type === 'assessment' && act.scoringRule) {
      base.totalScore = act.scoringRule.totalScore
      base.passScore = act.scoringRule.passScore
    }
    if (act.feedbackConfig) {
      base.showResultToStudent = act.feedbackConfig.showScore !== false
    }
    return base
  }, [currentRawNode, currentActivity])

  function markDirty() { setDirty(true) }

  /** 更新当前节点绑定的 activity（如果没有则创建一个新的） */
  function updateCurrentActivity(patch: Partial<Activity>) {
    if (!currentRawNode) return
    let activityId = currentRawNode.activityId
    let base: Activity | undefined

    if (activityId) {
      base = activityDrafts[activityId] ?? getActivityById(activityId)
    }

    // 节点还没绑定 activity → 创建一个新的并把 activityId 写回节点
    if (!base) {
      activityId = uid('act')
      const nodeType = currentRawNode.type
      const actType: Activity['type'] =
        nodeType === 'assessment' ? 'assessment'
      : nodeType === 'aiPractice' ? 'aiPractice'
      :                             'survey'
      base = {
        id: activityId,
        type: actType,
        title: currentRawNode.title,
        description: currentRawNode.description ?? '',
        questions: [],
        ...(actType === 'assessment'
          ? {
              scoringRule: { totalScore: 0 },
              dimensions: [],
              feedbackConfig: { showScore: true, showExplanation: true },
            }
          : {}),
      }
      // 把新 activityId 关联到节点上
      updateNode(currentRawNode.id, { activityId })
    }

    const next = { ...base, ...patch } as Activity
    setActivityDrafts((prev) => ({ ...prev, [activityId!]: next }))
    markDirty()
  }

  function updateNode(nodeId: string, patch: Partial<LessonNode>) {
    setCourse((prev) => ({
      ...prev,
      lessons: prev.lessons.map((l) =>
        l.id !== currentLessonId
          ? l
          : {
              ...l,
              nodes: l.nodes.map((n) =>
                n.id === nodeId ? ({ ...n, ...patch } as LessonNode) : n,
              ),
            },
      ),
    }))
    markDirty()
  }

  function addNode(type: LessonNodeType) {
    if (!currentLesson) return
    const orderNext =
      currentLesson.nodes.reduce((m, n) => Math.max(m, n.order), 0) + 1
    const id = uid('node')
    const title =
        type === 'content'    ? '新建图文'
      : type === 'survey'     ? '新建问卷'
      : type === 'assessment' ? '新建测评'
      : type === 'aiPractice' ? '新建 AI 互动'
      :                         '新建反馈'

    // 活动型节点：立即创建并落库对应 activity，避免"点进题目配置无页面"
    let activityId: string | undefined
    if (type === 'survey' || type === 'assessment' || type === 'aiPractice') {
      activityId = uid('act')
      const actType: Activity['type'] =
        type === 'assessment' ? 'assessment'
      : type === 'aiPractice' ? 'aiPractice'
      :                         'survey'
      const newAct: Activity = {
        id: activityId,
        type: actType,
        title,
        description: '',
        questions: [],
        ...(actType === 'assessment'
          ? {
              scoringRule: { totalScore: 0 },
              dimensions: [],
              feedbackConfig: { showScore: true, showExplanation: true },
            }
          : {}),
      }
      saveActivity(newAct)
      setActivityDrafts((prev) => ({ ...prev, [activityId!]: newAct }))
    }

    const node: LessonNode = {
      id,
      lessonId: currentLesson.id,
      type,
      order: orderNext,
      title,
      description: '',
      activityId,
      content:
        type === 'content' || type === 'feedback'
          ? '# 新章节\n\n在右侧编辑正文。支持 Markdown：用 # 写标题，- 写列表，**粗体**'
          : undefined,
      completionRequired: type === 'assessment',
    }
    setCourse((prev) => ({
      ...prev,
      lessons: prev.lessons.map((l) =>
        l.id !== currentLessonId ? l : { ...l, nodes: [...l.nodes, node] },
      ),
    }))
    setCurrentNodeId(id)
    markDirty()
  }

  function removeNode(nodeId: string) {
    if (!confirm('确定删除这个节点？此操作不可撤销。')) return
    setCourse((prev) => ({
      ...prev,
      lessons: prev.lessons.map((l) =>
        l.id !== currentLessonId
          ? l
          : { ...l, nodes: l.nodes.filter((n) => n.id !== nodeId) },
      ),
    }))
    if (currentNodeId === nodeId) {
      const next = currentLesson?.nodes.find((n) => n.id !== nodeId)
      setCurrentNodeId(next?.id ?? '')
    }
    markDirty()
  }

  function moveNode(nodeId: string, delta: -1 | 1) {
    if (!currentLesson) return
    const ns = [...currentLesson.nodes].sort((a, b) => a.order - b.order)
    const idx = ns.findIndex((n) => n.id === nodeId)
    const tgt = idx + delta
    if (idx < 0 || tgt < 0 || tgt >= ns.length) return
    ;[ns[idx], ns[tgt]] = [ns[tgt], ns[idx]]
    const reordered = ns.map((n, i) => ({ ...n, order: i + 1 }))
    setCourse((prev) => ({
      ...prev,
      lessons: prev.lessons.map((l) =>
        l.id !== currentLessonId ? l : { ...l, nodes: reordered },
      ),
    }))
    markDirty()
  }

  /* —— 课节管理 —— */
  function addLesson() {
    const lessonId = uid('lesson')
    const firstNodeId = uid('node')
    const orderNext = course.lessons.reduce((m, l) => Math.max(m, l.order), 0) + 1
    const newLesson = {
      id: lessonId,
      courseId: course.id,
      title: `第 ${orderNext} 课`,
      description: '',
      duration: 25,
      order: orderNext,
      status: 'draft' as const,
      nodes: [
        {
          id: firstNodeId,
          lessonId,
          type: 'content' as const,
          order: 1,
          title: '课程导入',
          description: '',
          content: '# 课程导入\n\n在右侧面板编辑课程内容...',
        },
      ],
    }
    setCourse((prev) => ({ ...prev, lessons: [...prev.lessons, newLesson] }))
    setCurrentLessonId(lessonId)
    setCurrentNodeId(firstNodeId)
    markDirty()
  }

  function renameLesson(lessonId: string) {
    const l = course.lessons.find((x) => x.id === lessonId)
    if (!l) return
    const next = window.prompt('课节名称', l.title)
    if (!next || next.trim() === '' || next === l.title) return
    setCourse((prev) => ({
      ...prev,
      lessons: prev.lessons.map((x) =>
        x.id === lessonId ? { ...x, title: next.trim() } : x,
      ),
    }))
    markDirty()
  }

  function removeLesson(lessonId: string) {
    if (course.lessons.length <= 1) {
      alert('至少保留一节课')
      return
    }
    if (!confirm('确定删除这一课节？该课节下的所有节点都会删除，且不可撤销。')) return
    setCourse((prev) => {
      const next = prev.lessons.filter((l) => l.id !== lessonId)
      // 重新计算 order
      next.sort((a, b) => a.order - b.order).forEach((l, i) => (l.order = i + 1))
      return { ...prev, lessons: next }
    })
    if (currentLessonId === lessonId) {
      const fallback = course.lessons.find((l) => l.id !== lessonId)
      if (fallback) {
        setCurrentLessonId(fallback.id)
        setCurrentNodeId(fallback.nodes[0]?.id ?? '')
      }
    }
    markDirty()
  }

  function persistDrafts() {
    // 先保存所有 activity 草稿
    Object.values(activityDrafts).forEach((act) => saveActivity(act))
    saveCourse(course)
    setActivityDrafts({})
    setDirty(false)
  }

  function handleSave() {
    persistDrafts()
  }

  function previewStudentLesson() {
    if (!currentLessonId) return
    // 预览前先落库，避免学生端读取不到当前课节 / 节点草稿。
    persistDrafts()

    // 当前应用使用 HashRouter。直接打开 /student/... 会绕过 hash 路由，
    // 在新标签页被静态服务器当成真实路径请求，从而出现 404。
    const previewUrl = `${window.location.origin}${window.location.pathname}#/student/course/${course.id}/lesson/${currentLessonId}`
    window.open(previewUrl, '_blank', 'noopener,noreferrer')
  }

  /** 打开题目配置中心：先落库（避免跳转后绑定/草稿丢失），再跳转 */
  function openActivityConfig(activityId: string) {
    // 检查是否有未保存的修改
    if (dirty || Object.keys(activityDrafts).length > 0) {
      const confirm = window.confirm(
        '进入精细配置前需要先保存当前编辑。是否保存并继续？\n\n' +
        '点击"确定"：保存并进入精细配置\n' +
        '点击"取消"：留在当前页面'
      )
      if (!confirm) return

      // 用户确认保存
      persistDrafts()
    }
    navigate(`/teacher/activity/${activityId}/config`)
  }

  return (
    <div className="flex h-full bg-ink-50 overflow-hidden">
      {/* —— 左：节点列表 —— */}
      <aside className="w-64 shrink-0 bg-white border-r border-ink-200 flex flex-col">
        <div className="p-3 border-b border-ink-200">
          <button
            onClick={() => navigate('/teacher/courses')}
            className="text-xs text-ink-500 hover:text-ink-900 mb-2 flex items-center gap-1"
          >
            ← 返回课程列表
          </button>
          <div className="flex items-center gap-2">
            <CourseCover
              courseId={course.id}
              title={course.title}
              height="xs"
              className="w-10 shrink-0"
            />
            <div className="min-w-0">
              <div className="text-sm font-medium text-ink-900 truncate">
                {course.title}
              </div>
              <div className="text-[11px] text-ink-500">
                {course.gradeRange} ·{' '}
                {course.status === 'published' ? '已发布' : '草稿'}
              </div>
            </div>
          </div>
        </div>

        {/* 课节管理 */}
        <div className="px-3 py-2 border-b border-ink-200">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] text-ink-500">
              课节（{course.lessons.length}）
            </label>
            <button
              type="button"
              onClick={addLesson}
              className="text-[11px] text-brand-text hover:underline"
            >
              + 新增
            </button>
          </div>
          <ul className="space-y-1">
            {course.lessons
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((l) => {
                const active = l.id === currentLessonId
                return (
                  <li key={l.id}>
                    <div
                      className={
                        'flex items-center gap-1 rounded text-xs border ' +
                        (active
                          ? 'border-brand bg-brand-softer'
                          : 'border-ink-200 bg-white hover:bg-ink-50')
                      }
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentLessonId(l.id)
                          setCurrentNodeId(l.nodes[0]?.id ?? '')
                        }}
                        className={
                          'flex-1 text-left px-2 py-1.5 truncate ' +
                          (active ? 'text-brand-text font-medium' : 'text-ink-700')
                        }
                      >
                        {l.title}
                        <span className="text-[10px] text-ink-500 ml-1">
                          · {l.nodes.length}节点
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => renameLesson(l.id)}
                        className="px-1 h-6 text-ink-500 hover:text-ink-900"
                        title="重命名"
                      >
                        ✎
                      </button>
                      {course.lessons.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLesson(l.id)}
                          className="px-1 h-6 text-ink-500 hover:text-red-600"
                          title="删除"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
          </ul>
        </div>

        {/* 节点列表 */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {currentLesson?.nodes
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((node, i, arr) => {
              const active = node.id === currentNodeId
              return (
                <div
                  key={node.id}
                  className={
                    'rounded border transition group ' +
                    (active
                      ? 'border-brand bg-brand-softer'
                      : 'border-ink-200 bg-white hover:bg-ink-50')
                  }
                >
                  <button
                    onClick={() => setCurrentNodeId(node.id)}
                    className="w-full text-left px-3 py-2"
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <Icon name={NODE_TYPE_ICON[node.type]} className="w-4 h-4 shrink-0 text-ink-500" />
                      <span
                        className={
                          'flex-1 truncate text-sm ' +
                          (active ? 'text-brand-text font-medium' : 'text-ink-900')
                        }
                      >
                        {node.title}
                      </span>
                    </div>
                    <div className="ml-7 text-[10px] text-ink-500">
                      {NODE_TYPE_LABEL[node.type]}
                      {node.activityId && (
                        <span className="ml-2 text-brand-text">·已绑定活动</span>
                      )}
                    </div>
                  </button>
                  {active && (
                    <div className="px-3 pb-2 flex items-center gap-1 border-t border-brand-soft mt-1 pt-1.5">
                      <button
                        onClick={() => moveNode(node.id, -1)}
                        disabled={i === 0}
                        className="text-[11px] px-1.5 h-6 rounded hover:bg-white text-ink-700 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveNode(node.id, 1)}
                        disabled={i === arr.length - 1}
                        className="text-[11px] px-1.5 h-6 rounded hover:bg-white text-ink-700 disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removeNode(node.id)}
                        className="ml-auto text-[11px] text-red-600 hover:underline"
                      >
                        删除
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

          {currentLesson?.nodes.length === 0 && (
            <div className="py-8 text-center text-xs text-ink-500">
              空课节，从下方添加节点
            </div>
          )}
        </nav>

        {/* 添加节点 */}
        <div className="shrink-0 p-3 border-t border-ink-200 space-y-1">
          <div className="text-[11px] text-ink-500 mb-1">添加节点</div>
          <div className="grid grid-cols-2 gap-1">
            <AddBtn label="图文"  icon="fileText"  onClick={() => addNode('content')} />
            <AddBtn label="问卷"  icon="clipboard" onClick={() => addNode('survey')} />
            <AddBtn label="测评"  icon="check"     onClick={() => addNode('assessment')} />
            <AddBtn label="AI互动" icon="sparkles" onClick={() => addNode('aiPractice')} />
            <AddBtn label="反馈"  icon="message"   onClick={() => addNode('feedback')} />
          </div>
        </div>
      </aside>

      {/* —— 中：预览 —— */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="h-12 px-6 bg-white border-b border-ink-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-xs text-ink-500">
            <span>正在编辑</span>
            <span className="text-ink-900 font-medium">{currentRawNode?.title ?? '—'}</span>
            <span className="text-ink-300">|</span>
            <span>课程状态</span>
            <select
              value={course.status}
              onChange={(e) => {
                setCourse((prev) => ({
                  ...prev,
                  status: e.target.value as Course['status'],
                }))
                markDirty()
              }}
              className="h-7 border border-ink-200 rounded px-2 text-xs bg-white"
            >
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
              <option value="archived">已归档</option>
            </select>
            {dirty && (
              <span className="ml-2 lf-tag !bg-amber-50 !text-amber-700 !border-amber-100">
                未保存
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentLessonId ? (
              <button
                type="button"
                onClick={previewStudentLesson}
                className="lf-btn-ghost !h-8 text-xs"
              >
                👁 预览学生端
              </button>
            ) : (
              <button
                disabled
                className="lf-btn-ghost !h-8 text-xs opacity-50 cursor-not-allowed"
                title="请先添加课节"
              >
                👁 预览学生端
              </button>
            )}
            <Button
              variant="secondary"
              onClick={() => navigate('/teacher/courses')}
            >
              退出
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={!dirty}>
              {dirty ? '保存改动' : '已保存'}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-ink-50">
          <div className="max-w-3xl mx-auto p-6">
            {currentResolved ? (
              <PreviewArea node={currentResolved} />
            ) : (
              <Card>
                <div className="py-12 text-center text-sm text-ink-500">
                  从左侧选择或添加节点开始编辑
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* —— 右：配置面板 —— */}
      <aside className="w-96 shrink-0 bg-white border-l border-ink-200 overflow-y-auto">
        {currentRawNode ? (
          <ConfigPanel
            node={currentRawNode}
            activity={currentActivity}
            onChange={(patch) => updateNode(currentRawNode.id, patch)}
            onActivityChange={updateCurrentActivity}
            openActivityConfig={openActivityConfig}
          />
        ) : (
          <div className="p-6 text-center text-xs text-ink-500">
            选择一个节点查看配置
          </div>
        )}
      </aside>
    </div>
  )
}

/* ============================================================
 * 添加节点按钮
 * ============================================================ */
function AddBtn({
  label,
  icon,
  onClick,
}: {
  label: string
  icon: IconName
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="text-xs h-8 rounded border border-ink-200 hover:border-brand hover:bg-brand-softer hover:text-brand-text flex items-center justify-center gap-1.5"
    >
      <Icon name={icon} className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  )
}

/* ============================================================
 * 中间预览区
 * ============================================================ */
function PreviewArea({ node }: { node: ResolvedNode }) {
  const questions = node.questions ?? []

  if (node.type === 'content' || node.type === 'feedback') {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-ink-100 text-xs text-ink-500">
          <Tag>{NODE_TYPE_LABEL[node.type]}</Tag>
          <span>📖 预览效果</span>
        </div>
        <SimpleMarkdown content={node.content || '（请在右侧编辑内容）'} />
      </Card>
    )
  }

  if (node.type === 'survey') {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <Tag>课堂问卷</Tag>
          {node.required && <Tag variant="brand">必答</Tag>}
          <span className="text-xs text-ink-500 ml-auto">
            {questions.length} 题
          </span>
        </div>
        <h3 className="text-base font-medium text-ink-900">{node.title}</h3>
        {node.description && (
          <p className="text-xs text-ink-500 mt-1 mb-4">{node.description}</p>
        )}
        {questions.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-500 border-2 border-dashed border-ink-200 rounded mt-4">
            暂无题目（在右侧添加题目）
          </div>
        ) : (
          <QuestionsPreview questions={questions} />
        )}
      </Card>
    )
  }

  if (node.type === 'assessment') {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <Tag variant="brand">知识测评</Tag>
          <Tag>{node.totalScore ?? 0} 分</Tag>
          <span className="text-xs text-ink-500 ml-auto">
            {questions.length} 题
          </span>
        </div>
        <h3 className="text-base font-medium text-ink-900">{node.title}</h3>
        {node.description && (
          <p className="text-xs text-ink-500 mt-1 mb-4">{node.description}</p>
        )}
        {node.dimensions && node.dimensions.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="text-xs text-ink-500">维度：</span>
            {node.dimensions.map((d) => (
              <Tag key={d.id} className="!text-[10px]">
                {d.name}
              </Tag>
            ))}
          </div>
        )}
        {questions.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-500 border-2 border-dashed border-ink-200 rounded mt-4">
            暂无题目（在右侧添加题目）
          </div>
        ) : (
          <QuestionsPreview questions={questions} showScore />
        )}
      </Card>
    )
  }

  // aiPractice
  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        <Tag>AI 互动练习</Tag>
      </div>
      <h3 className="text-base font-medium text-ink-900">{node.title}</h3>
      {node.description && (
        <p className="text-xs text-ink-500 mt-1 mb-4">{node.description}</p>
      )}
      <div className="border-2 border-dashed border-ink-300 rounded p-8 bg-ink-50 mt-4">
        <div className="text-center">
          <div className="text-4xl mb-3">🤖</div>
          <div className="text-sm text-ink-700 mb-1">AI 互动区（演示占位）</div>
          {node.practiceType && (
            <div className="text-xs text-ink-500">
              类型：{node.practiceType}
            </div>
          )}
        </div>
        {node.examples && node.examples.length > 0 && (
          <div className="bg-white rounded border border-ink-200 p-4 max-w-md mx-auto mt-4">
            <div className="text-xs text-ink-500 mb-2">示例任务</div>
            <ul className="space-y-1.5">
              {node.examples.map((ex, i) => (
                <li key={i} className="text-sm text-ink-700 flex items-start gap-2">
                  <span className="text-brand-text">▸</span>
                  <span>{ex}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  )
}

function QuestionsPreview({
  questions,
  showScore = false,
}: {
  questions: ResolvedNode['questions']
  showScore?: boolean
}) {
  if (!questions) return null
  return (
    <ol className="space-y-3 mt-4">
      {questions.map((q, i) => {
        const empty = createEmptyAnswer(q)
        return (
          <li key={q.id} className="border border-ink-200 rounded p-4">
            <div className="flex items-center gap-2 text-xs text-ink-500 mb-2">
              <span>第 {i + 1} 题</span>
              <Tag>{QUESTION_TYPE_LABEL[q.type]}</Tag>
              {showScore && q.score != null && <Tag>{q.score} 分</Tag>}
              {q.required && <Tag variant="brand">必答</Tag>}
            </div>
            <h4 className="text-sm text-ink-900 mb-3">{q.title}</h4>
            <div className="opacity-75 pointer-events-none">
              <QuestionRenderer
                question={q}
                value={empty}
                onChange={() => {}}
                readOnly
              />
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/* ============================================================
 * 右侧配置面板（基础属性 + 题目编辑）
 * ============================================================ */
function ConfigPanel({
  node,
  activity,
  onChange,
  onActivityChange,
  openActivityConfig,
}: {
  node: LessonNode
  activity?: Activity
  onChange: (patch: Partial<LessonNode>) => void
  onActivityChange: (patch: Partial<Activity>) => void
  openActivityConfig: (activityId: string) => void
}) {
  const isActivityNode =
    node.type === 'survey' ||
    node.type === 'assessment' ||
    node.type === 'aiPractice'
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-ink-200">
        <Icon name={NODE_TYPE_ICON[node.type]} className="w-5 h-5 text-ink-500" />
        <div>
          <div className="text-sm font-medium text-ink-900">
            {NODE_TYPE_LABEL[node.type]}
          </div>
          <div className="text-[11px] text-ink-500">节点属性 + 内容编辑</div>
        </div>
      </div>

      <Field label="节点标题">
        <Input
          value={node.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="如：课程导入 / 知识讲解 / 课堂小测"
        />
      </Field>

      <Field label="节点说明" hint="对学生展示">
        <Textarea
          rows={2}
          value={node.description ?? ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="可选"
        />
      </Field>

      {(node.type === 'content' || node.type === 'feedback') && (
        <Field label="正文内容" hint="支持 Markdown">
          <Textarea
            rows={16}
            value={node.content ?? ''}
            onChange={(e) => onChange({ content: e.target.value })}
            placeholder={'# 标题\n\n用 # 写标题，- 写列表，**粗体**'}
          />
        </Field>
      )}

      <Field label="完成要求">
        <label className="text-xs text-ink-700 inline-flex items-center gap-2">
          <input
            type="checkbox"
            className="accent-brand"
            checked={node.completionRequired ?? false}
            onChange={(e) => onChange({ completionRequired: e.target.checked })}
          />
          学生必须完成才能进入下一节点
        </label>
      </Field>

      {/* —— 活动 / 题目编辑（survey / assessment / aiPractice） —— */}
      {isActivityNode && (
        <div className="border-t border-ink-200 mt-4 pt-4">
          {/* 入口：打开独立的题目配置中心（精细配置） */}
          {node.activityId && (node.type === 'survey' || node.type === 'assessment') && (
            <div className="mb-3 px-3 py-2.5 bg-brand-softer border border-brand-soft rounded-lg">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-brand-text font-medium text-xs mb-0.5">精细配置</div>
                  <div className="text-ink-500 text-[10px] leading-relaxed">
                    配选项 / 答案 / 配图 / 展示形式，并实时预览学生端
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openActivityConfig(node.activityId!)}
                  className="lf-btn-primary !h-8 !px-3 !text-xs shrink-0"
                >
                  打开 →
                </button>
              </div>
            </div>
          )}

          <ActivityEditor
            nodeType={node.type}
            activity={activity}
            onChange={onActivityChange}
          />
        </div>
      )}
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
 * ActivityEditor - 活动编辑器
 * 不同节点类型展示不同表单：
 *  - aiPractice: 互动类型 + 示例任务
 *  - survey: 题目列表（4 种题型）
 *  - assessment: 题目列表（8 种题型）+ 总分/及格分/维度/反馈
 * ============================================================ */

// 直接引用 types 中的标准清单，避免与配置中心脱节（新增题型自动同步）
const SURVEY_TYPES: QuestionType[] = SURVEY_ALLOWED_TYPES
const ASSESS_TYPES: QuestionType[] = ASSESSMENT_ALLOWED_TYPES

function ActivityEditor({
  nodeType,
  activity,
  onChange,
}: {
  nodeType: LessonNodeType
  activity?: Activity
  onChange: (patch: Partial<Activity>) => void
}) {
  const isAssess = nodeType === 'assessment'
  const isSurvey = nodeType === 'survey'
  const isAIPractice = nodeType === 'aiPractice'

  /* —— aiPractice 节点：互动类型 + 示例 —— */
  if (isAIPractice) {
    const examples = activity?.examples ?? []
    return (
      <>
        <div className="text-xs text-ink-700 font-medium mb-3">AI 互动配置</div>
        <Field label="互动类型">
          <select
            value={activity?.practiceType ?? ''}
            onChange={(e) => onChange({ practiceType: e.target.value })}
            className="w-full h-9 border border-ink-200 rounded px-2 text-sm bg-white"
          >
            <option value="">— 选择类型 —</option>
            <option value="chat">AI 对话</option>
            <option value="speechRecognition">语音识别</option>
            <option value="imageRecognition">图像识别</option>
            <option value="imageGeneration">AI 绘画</option>
            <option value="textGeneration">文本生成</option>
            <option value="promptWriting">Prompt 写作</option>
          </select>
        </Field>
        <Field label="示例任务" hint="一行一个">
          <Textarea
            rows={5}
            value={examples.join('\n')}
            onChange={(e) =>
              onChange({
                examples: e.target.value
                  .split('\n')
                  .map((x) => x.trim())
                  .filter(Boolean),
              })
            }
            placeholder={'示例 1\n示例 2\n示例 3'}
          />
        </Field>
      </>
    )
  }

  /* —— survey / assessment：题目编辑 —— */
  const questions = activity?.questions ?? []
  const dimensions = activity?.dimensions ?? []
  const allowedTypes = isAssess ? ASSESS_TYPES : SURVEY_TYPES

  function addQuestion(type: QuestionType) {
    const q = makeNewQuestion(type, isAssess)
    const next = [...questions, q]
    if (isAssess) {
      onChange({
        questions: next,
        scoringRule: {
          ...(activity?.scoringRule ?? { totalScore: 0 }),
          totalScore: next.reduce((s, x) => s + (x.score ?? 0), 0),
        },
      })
    } else {
      onChange({ questions: next })
    }
  }
  function updateQuestion(id: string, patch: Partial<Question>) {
    const next = questions.map((x) => (x.id === id ? ({ ...x, ...patch } as Question) : x))
    if (isAssess) {
      onChange({
        questions: next,
        scoringRule: {
          ...(activity?.scoringRule ?? { totalScore: 0 }),
          totalScore: next.reduce((s, x) => s + (x.score ?? 0), 0),
        },
      })
    } else {
      onChange({ questions: next })
    }
  }
  function removeQuestion(id: string) {
    if (!confirm('确定删除这道题？')) return
    const next = questions.filter((x) => x.id !== id)
    if (isAssess) {
      onChange({
        questions: next,
        scoringRule: {
          ...(activity?.scoringRule ?? { totalScore: 0 }),
          totalScore: next.reduce((s, x) => s + (x.score ?? 0), 0),
        },
      })
    } else {
      onChange({ questions: next })
    }
  }
  function moveQuestion(id: string, delta: -1 | 1) {
    const idx = questions.findIndex((x) => x.id === id)
    const tgt = idx + delta
    if (idx < 0 || tgt < 0 || tgt >= questions.length) return
    const next = [...questions]
    ;[next[idx], next[tgt]] = [next[tgt], next[idx]]
    onChange({ questions: next })
  }

  // 维度操作
  function addDimension() {
    const d: Dimension = { id: uid('dim'), name: `维度 ${dimensions.length + 1}` }
    onChange({ dimensions: [...dimensions, d] })
  }
  function updateDimension(id: string, name: string) {
    onChange({ dimensions: dimensions.map((d) => (d.id === id ? { ...d, name } : d)) })
  }
  function removeDimension(id: string) {
    onChange({ dimensions: dimensions.filter((d) => d.id !== id) })
  }

  return (
    <>
      <div className="mb-3">
        <div className="text-xs text-ink-700 font-medium">
          {isAssess ? '测评 · 题目' : '问卷 · 题目'}
        </div>
        <div className="text-[10px] text-ink-500 mt-0.5">
          快速增删题目；选项/答案/配图、及格分/维度/反馈请用上方「精细配置」
        </div>
      </div>

      {/* 题目列表 */}
      <div className="mt-2">
        <div className="text-xs text-ink-700 mb-2 flex items-center justify-between">
          <span>题目列表（{questions.length}）</span>
          {isAssess && (
            <span className="text-ink-500">总分 {activity?.scoringRule?.totalScore ?? 0}</span>
          )}
        </div>
        <div className="space-y-2">
          {questions.map((q, i) => (
            <QuestionEditorRow
              key={q.id}
              index={i}
              question={q}
              isAssess={isAssess}
              dimensions={dimensions}
              onChange={(patch) => updateQuestion(q.id, patch)}
              onRemove={() => removeQuestion(q.id)}
              onMoveUp={i === 0 ? undefined : () => moveQuestion(q.id, -1)}
              onMoveDown={i === questions.length - 1 ? undefined : () => moveQuestion(q.id, 1)}
            />
          ))}
        </div>

        {/* 添加题目 */}
        <div className="mt-3">
          <div className="text-[11px] text-ink-500 mb-1.5">+ 添加题目</div>
          <div className="grid grid-cols-2 gap-1">
            {allowedTypes.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => addQuestion(t)}
                className="text-xs h-8 rounded border border-ink-200 hover:border-brand hover:bg-brand-softer hover:text-brand-text"
              >
                {QUESTION_TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

/* ============================================================
 * 题目编辑行（折叠）
 * ============================================================ */
function QuestionEditorRow({
  index,
  question,
  isAssess,
  dimensions,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  index: number
  question: Question
  isAssess: boolean
  dimensions: Dimension[]
  onChange: (patch: Partial<Question>) => void
  onRemove: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}) {
  // 默认收起：备课页第一眼保持清爽，点开才看到该题的简单配置
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="border border-ink-200 rounded">
      <div className="px-2.5 py-2 flex items-center gap-2 bg-ink-50/40">
        <span className="text-[11px] text-ink-500 w-5">{index + 1}</span>
        <Tag className="!text-[10px]">{QUESTION_TYPE_LABEL[question.type]}</Tag>
        <span
          className="flex-1 text-xs text-ink-900 truncate cursor-pointer"
          onClick={() => setExpanded((v) => !v)}
        >
          {question.title || '（未命名题目）'}
        </span>
        {isAssess && (
          <span className="text-[11px] text-ink-500">{question.score ?? 0}分</span>
        )}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            disabled={!onMoveUp}
            onClick={onMoveUp}
            className="text-[11px] px-1 h-6 hover:bg-white text-ink-500 disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            disabled={!onMoveDown}
            onClick={onMoveDown}
            className="text-[11px] px-1 h-6 hover:bg-white text-ink-500 disabled:opacity-30"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[11px] px-1 h-6 hover:bg-white text-ink-500"
          >
            {expanded ? '−' : '+'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-2.5 pb-2.5 space-y-2 border-t border-ink-100 pt-2">
          {/* 题干 */}
          <div>
            <label className="text-[11px] text-ink-500">题干</label>
            <Textarea
              rows={2}
              value={question.title}
              onChange={(e) => onChange({ title: e.target.value } as any)}
              placeholder="请输入题目内容"
            />
          </div>

          {/* 测评特有：分值 + 维度 */}
          {isAssess && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-ink-500">分值</label>
                <Input
                  type="number"
                  value={question.score ?? 0}
                  onChange={(e) => onChange({ score: Number(e.target.value) || 0 } as any)}
                  className="!h-8"
                />
              </div>
              <div>
                <label className="text-[11px] text-ink-500">关联维度</label>
                <select
                  value={question.dimensions?.[0] ?? ''}
                  onChange={(e) =>
                    onChange({
                      dimensions: e.target.value ? [e.target.value] : [],
                    } as any)
                  }
                  className="w-full h-8 border border-ink-200 rounded px-2 text-xs bg-white"
                >
                  <option value="">不指定</option>
                  {dimensions.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 快速起草：不在此处配置选项/答案/配图，引导到精细配置 */}
          <div className="text-[11px] text-ink-500 bg-ink-50 border border-ink-100 rounded px-2.5 py-2 leading-relaxed">
            选项、答案、配图、展示形式请在
            <span className="text-brand-text font-medium">「精细配置」</span>
            中完成（本处仅用于快速搭题目骨架）。
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="text-[11px] text-ink-700 inline-flex items-center gap-1">
              <input
                type="checkbox"
                className="accent-brand"
                checked={question.required ?? false}
                onChange={(e) => onChange({ required: e.target.checked } as any)}
              />
              必答题
            </label>
            <button
              type="button"
              onClick={onRemove}
              className="text-[11px] text-red-600 hover:underline"
            >
              删除题目
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================================================
 * 题目主体编辑（按题型分发）
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
      return isAssess ? (
        <div>
          <label className="text-[11px] text-ink-500">正确答案</label>
          <select
            value={
              (question as any).answer === undefined
                ? ''
                : (question as any).answer ? '1' : '0'
            }
            onChange={(e) =>
              onChange({
                answer: e.target.value === '' ? undefined : e.target.value === '1',
              })
            }
            className="w-full h-8 border border-ink-200 rounded px-2 text-xs bg-white"
          >
            <option value="">— 未设置 —</option>
            <option value="1">对（✓）</option>
            <option value="0">错（✗）</option>
          </select>
        </div>
      ) : null
    case 'fillBlank':
      return <FillBody question={question as any} isAssess={isAssess} onChange={onChange} />
    case 'shortAnswer':
      return isAssess ? (
        <div>
          <label className="text-[11px] text-ink-500">参考答案</label>
          <Textarea
            rows={2}
            value={(question as any).answer ?? ''}
            onChange={(e) => onChange({ answer: e.target.value })}
            placeholder="给老师参考的标准答案"
          />
        </div>
      ) : null
    case 'sort':
      return <SortBody question={question as any} isAssess={isAssess} onChange={onChange} />
    case 'classify':
      return <ClassifyBody question={question as any} isAssess={isAssess} onChange={onChange} />
    case 'wordCompose':
      return <WordComposeBody question={question as any} isAssess={isAssess} onChange={onChange} />
  }
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
      <label className="text-[11px] text-ink-500">
        选项{isAssess ? '（点 ✓ 标正确答案）' : ''}
      </label>
      <div className="space-y-1 mt-1">
        {options.map((o) => {
          const isCorrect = correctSet.has(o.id)
          return (
            <div key={o.id} className="flex items-center gap-1">
              {isAssess && (
                <button
                  type="button"
                  onClick={() => toggleCorrect(o.id)}
                  className={
                    'w-6 h-7 rounded border text-xs ' +
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
                className="!h-7 !w-10 text-center"
              />
              <Input
                value={o.content}
                onChange={(e) => updateOpt(o.id, { content: e.target.value })}
                className="!h-7 flex-1"
              />
              <button
                type="button"
                onClick={() => removeOpt(o.id)}
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
        onClick={addOpt}
        className="text-xs text-brand-text hover:underline mt-1"
      >
        + 添加选项
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
    const safe = Math.max(1, Math.min(5, n))
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
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-ink-500">空数（1-5）</label>
          <Input
            type="number"
            value={blanks}
            onChange={(e) => setBlanks(Number(e.target.value))}
            className="!h-8"
          />
        </div>
      </div>
      {isAssess &&
        Array.from({ length: blanks }).map((_, i) => (
          <div key={i}>
            <label className="text-[11px] text-ink-500">
              第 {i + 1} 空 标准答案（多个用 / 分隔）
            </label>
            <Input
              value={(answer[i] ?? []).join(' / ')}
              onChange={(e) => setBlankAccepts(i, e.target.value)}
              placeholder="如：人工智能 / AI / Artificial Intelligence"
              className="!h-8"
            />
          </div>
        ))}
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
    onChange({ items: next, ...(isAssess ? { answer: [...answer, id] } : {}) })
  }
  function updateItem(id: string, content: string) {
    onChange({ items: items.map((it) => (it.id === id ? { ...it, content } : it)) })
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
    <div className="space-y-2">
      <div>
        <label className="text-[11px] text-ink-500">待排序项</label>
        <div className="space-y-1 mt-1">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-1">
              <Input
                value={it.content}
                onChange={(e) => updateItem(it.id, e.target.value)}
                className="!h-7 flex-1"
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
          className="text-xs text-brand-text hover:underline mt-1"
        >
          + 添加选项
        </button>
      </div>

      {isAssess && answer.length > 0 && (
        <div>
          <label className="text-[11px] text-ink-500">正确顺序（用 ↑ ↓ 调整）</label>
          <div className="space-y-1 mt-1">
            {answer.map((id, i) => {
              const it = items.find((x) => x.id === id)
              if (!it) return null
              return (
                <div key={id} className="flex items-center gap-1 px-2 py-1 border border-ink-200 rounded bg-white">
                  <span className="text-[11px] text-ink-500 w-5">{i + 1}.</span>
                  <span className="text-xs text-ink-900 flex-1 truncate">{it.content}</span>
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
        </div>
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
      categories: [...categories, { id: uid('cat'), name: `分类 ${categories.length + 1}` }],
    })
  }
  function updateCategory(id: string, name: string) {
    onChange({ categories: categories.map((c) => (c.id === id ? { ...c, name } : c)) })
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
    <div className="space-y-2">
      <div>
        <label className="text-[11px] text-ink-500">分类</label>
        <div className="space-y-1 mt-1">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-1">
              <Input
                value={c.name}
                onChange={(e) => updateCategory(c.id, e.target.value)}
                className="!h-7 flex-1"
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
          className="text-xs text-brand-text hover:underline mt-1"
        >
          + 添加分类
        </button>
      </div>

      <div>
        <label className="text-[11px] text-ink-500">待分类项</label>
        <div className="space-y-1 mt-1">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-1">
              <Input
                value={it.content}
                onChange={(e) => updateItem(it.id, e.target.value)}
                className="!h-7 flex-1"
              />
              {isAssess && (
                <select
                  value={answer[it.id] ?? ''}
                  onChange={(e) => setItemCategory(it.id, e.target.value)}
                  className="h-7 border border-ink-200 rounded px-1 text-xs bg-white w-24"
                >
                  <option value="">→ 分类</option>
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
          ))}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="text-xs text-brand-text hover:underline mt-1"
        >
          + 添加项目
        </button>
      </div>
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
    const next = answer.filter((p) => p.leftId !== leftId)
    if (rightId) next.push({ leftId, rightId })
    onChange({ answer: next })
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-ink-500">左侧</label>
          <div className="space-y-1 mt-1">
            {leftItems.map((it) => (
              <div key={it.id} className="flex items-center gap-1">
                <Input
                  value={it.content}
                  onChange={(e) => updateLeft(it.id, e.target.value)}
                  className="!h-7 flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeLeft(it.id)}
                  className="text-[11px] text-red-600 hover:underline px-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addLeft}
            className="text-xs text-brand-text hover:underline mt-1"
          >
            + 左项
          </button>
        </div>
        <div>
          <label className="text-[11px] text-ink-500">右侧</label>
          <div className="space-y-1 mt-1">
            {rightItems.map((it) => (
              <div key={it.id} className="flex items-center gap-1">
                <Input
                  value={it.content}
                  onChange={(e) => updateRight(it.id, e.target.value)}
                  className="!h-7 flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeRight(it.id)}
                  className="text-[11px] text-red-600 hover:underline px-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addRight}
            className="text-xs text-brand-text hover:underline mt-1"
          >
            + 右项
          </button>
        </div>
      </div>

      {isAssess && leftItems.length > 0 && (
        <div>
          <label className="text-[11px] text-ink-500">配对（左 → 右）</label>
          <div className="space-y-1 mt-1">
            {leftItems.map((L) => {
              const matched = answer.find((p) => p.leftId === L.id)
              return (
                <div key={L.id} className="flex items-center gap-1">
                  <span className="text-xs text-ink-900 flex-1 truncate">{L.content}</span>
                  <span className="text-[11px] text-ink-500">→</span>
                  <select
                    value={matched?.rightId ?? ''}
                    onChange={(e) => setPair(L.id, e.target.value)}
                    className="h-7 border border-ink-200 rounded px-1 text-xs bg-white flex-1"
                  >
                    <option value="">— 不配对 —</option>
                    {rightItems.map((R) => (
                      <option key={R.id} value={R.id}>{R.content}</option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================================================
 * 工具：根据题型构造空白题目
 * ============================================================ */
function makeNewQuestion(type: QuestionType, isAssess: boolean): Question {
  const id = uid('q')
  const base: any = { id, type, title: '新题目' }
  if (isAssess) base.score = 10

  switch (type) {
    case 'singleChoice':
    case 'multipleChoice':
      return {
        ...base,
        options: [
          { id: uid('opt'), label: 'A', content: '选项一' },
          { id: uid('opt'), label: 'B', content: '选项二' },
        ],
      } as Question
    case 'judge':
      return base as Question
    case 'fillBlank':
      return { ...base, blanks: 1 } as Question
    case 'shortAnswer':
      return base as Question
    case 'sort':
      return {
        ...base,
        items: [
          { id: uid('sort'), content: '步骤一' },
          { id: uid('sort'), content: '步骤二' },
          { id: uid('sort'), content: '步骤三' },
        ],
      } as Question
    case 'classify':
      return {
        ...base,
        categories: [
          { id: uid('cat'), name: '类别 A' },
          { id: uid('cat'), name: '类别 B' },
        ],
        items: [
          { id: uid('item'), content: '项目 1' },
        ],
      } as Question
    case 'wordCompose':
      return {
        ...base,
        leftItems: [
          { id: uid('L'), content: '左 1' },
        ],
        rightItems: [
          { id: uid('R'), content: '右 1' },
        ],
      } as Question
    case 'ratingScale':
      return { ...base, score: undefined, max: 5, style: 'star', labels: ['很不满意', '非常满意'] } as Question
    case 'workUpload':
      return { ...base, score: undefined, accept: '图片 / PDF', needNote: true, uploadHint: '' } as Question
    case 'knowledgeReview':
      return {
        ...base,
        score: undefined,
        reviewStyle: 'flip',
        cards: [{ id: uid('rc'), front: '概念', back: '解释' }],
      } as Question
    case 'promptPractice':
      return { ...base, goal: '', structure: ['角色', '任务', '要求'], example: '', answer: '' } as Question
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
      } as Question
    default:
      return base as Question
  }
}
