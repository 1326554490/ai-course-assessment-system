import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, ProgressBar, Tag } from '@/components/ui'
import { CourseCover } from '@/components/CourseCover'
import { SimpleMarkdown } from '@/components/SimpleMarkdown'
import { QuestionRenderer } from '@/components/question'
import { AIPracticeSimulator } from '@/components/AIPracticeSimulator'
import {
  getCourseById,
  getNodeSubmission,
  getNodeSubmissions,
  getProgress,
  markNodeCompleted,
  saveNodeSubmission,
  setCurrentNode,
  clearNodeSubmission,
  uncompleteNode,
} from '@/store'
import { CURRENT_STUDENT_ID } from '@/mock'
import {
  createEmptyAnswer,
  fmtDuration,
  gradeAnswer,
  isAnswered,
  pct,
  resolveNode,
  summarize,
  uid,
} from '@/utils'
import type {
  AIPracticeNode,
  AnswerValue,
  AssessmentNode,
  ContentNode,
  ResolvedNode,
  StudentSubmission,
  QuestionAnswer,
  SurveyNode,
} from '@/types'

/**
 * 学生端 - 课程学习页（核心）
 * 左侧：节点列表 + 学习进度
 * 中间：当前节点内容（content / survey / assessment / aiPractice）
 * 底部：上一节点 / 下一节点
 */
export function StudentLesson() {
  const { courseId, lessonId } = useParams()
  const navigate = useNavigate()

  const course = courseId ? getCourseById(courseId) : undefined
  const lesson = course?.lessons.find((l) => l.id === lessonId)

  const nodes = useMemo(
    () =>
      [...(lesson?.nodes ?? [])]
        .sort((a, b) => a.order - b.order)
        .map((n) => resolveNode(n)),
    [lesson],
  )

  // —— 进度状态 —— 从 LS 加载，并在节点切换时同步
  const initialProgress = getProgress(CURRENT_STUDENT_ID, course?.id ?? '', lesson?.id ?? '')
  const [completedSet, setCompletedSet] = useState<Set<string>>(
    () => new Set(initialProgress?.completedNodeIds ?? []),
  )
  const [currentIdx, setCurrentIdx] = useState(() => {
    if (initialProgress?.currentNodeId) {
      const i = nodes.findIndex((n) => n.id === initialProgress.currentNodeId)
      if (i >= 0) return i
    }
    return 0
  })

  const currentNode = nodes[currentIdx]

  // 进入节点时记录"当前位置"
  useEffect(() => {
    if (!currentNode || !course || !lesson) return
    setCurrentNode(CURRENT_STUDENT_ID, course.id, lesson.id, currentNode.id)
  }, [currentNode?.id, course?.id, lesson?.id])

  // —— 所有 hooks 已调用完毕，下面才做条件返回（Hooks 规则）——
  if (!course || !lesson) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <div className="py-12 text-center text-sm text-ink-500">
            课程或课节不存在
          </div>
        </Card>
      </div>
    )
  }
  if (!currentNode) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <div className="py-12 text-center text-sm text-ink-500">
            本课节暂无内容
          </div>
        </Card>
      </div>
    )
  }

  function complete(nodeId: string) {
    if (completedSet.has(nodeId)) return
    markNodeCompleted(CURRENT_STUDENT_ID, course!.id, lesson!.id, nodeId)
    setCompletedSet((prev) => {
      const next = new Set(prev)
      next.add(nodeId)
      return next
    })
  }

  function goPrev() {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1)
  }
  function goNext() {
    // content / aiPractice 节点：下一步就标记为完成
    if (currentNode.type === 'content' || currentNode.type === 'aiPractice') {
      complete(currentNode.id)
    }
    if (currentIdx < nodes.length - 1) setCurrentIdx(currentIdx + 1)
  }

  const progressRate = nodes.length === 0 ? 0 : completedSet.size / nodes.length

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-ink-50">
      {/* —— 左侧：节点列表 —— */}
      <aside className="w-72 shrink-0 bg-white border-r border-ink-200 flex flex-col">
        {/* 课程头 */}
        <div className="p-4 border-b border-ink-200">
          <button
            onClick={() => navigate('/student/courses')}
            className="text-xs text-ink-500 hover:text-ink-900 mb-3 flex items-center gap-1"
          >
            ← 返回课程列表
          </button>
          <div className="flex items-center gap-3 mb-3">
            <CourseCover courseId={course.id} title={course.title} height="xs" className="w-10" />
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-ink-900 truncate">
                {course.title}
              </h3>
              <p className="text-[11px] text-ink-500 truncate">{lesson.title}</p>
            </div>
          </div>

          {/* 进度 */}
          <div className="mb-1 flex items-center justify-between text-[11px] text-ink-500">
            <span>学习进度</span>
            <span>
              {completedSet.size} / {nodes.length}
            </span>
          </div>
          <ProgressBar value={progressRate} height={6} />
        </div>

        {/* 节点列表 */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {nodes.map((node, i) => {
            const isActive = i === currentIdx
            const isDone = completedSet.has(node.id)
            return (
              <button
                key={node.id}
                onClick={() => setCurrentIdx(i)}
                className={
                  'w-full text-left px-3 py-2.5 rounded text-xs border transition group ' +
                  (isActive
                    ? 'border-brand bg-brand-softer'
                    : 'border-ink-200 bg-white hover:bg-ink-50')
                }
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <NodeStatusBadge active={isActive} done={isDone} index={i + 1} />
                  <span
                    className={
                      'flex-1 truncate text-sm ' +
                      (isActive ? 'text-brand-text font-medium' : 'text-ink-900')
                    }
                  >
                    {node.title}
                  </span>
                </div>
                <div className="ml-7 flex items-center gap-1.5">
                  <span className="text-[10px] text-ink-500">
                    {NODE_TYPE_LABEL[node.type]}
                  </span>
                  {node.type === 'assessment' && (
                    <span className="text-[10px] text-ink-500">
                      · {(node as AssessmentNode).totalScore}分
                    </span>
                  )}
                  {(node as SurveyNode | AssessmentNode).required && (
                    <span className="text-[10px] text-brand-text">· 必答</span>
                  )}
                </div>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* —— 主内容区 —— */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 pb-32">
          {/* 顶部节点信息条 */}
          <div className="mb-4 flex items-center gap-2 text-xs text-ink-500">
            <span>第 {currentIdx + 1} / {nodes.length} 节</span>
            <span>·</span>
            <Tag variant={currentNode.type === 'assessment' ? 'brand' : 'default'}>
              {NODE_TYPE_LABEL[currentNode.type]}
            </Tag>
          </div>

          {/* 节点内容 */}
          <NodeContent
            key={currentNode.id}
            node={currentNode}
            courseId={course.id}
            onCompleted={() => complete(currentNode.id)}
          />
        </div>

        {/* 底部固定操作栏 */}
        <div className="sticky bottom-0 bg-white border-t border-ink-200 px-6 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Button variant="secondary" onClick={goPrev} disabled={currentIdx === 0}>
              ← 上一节点
            </Button>
            <div className="text-xs text-ink-500">
              {currentIdx + 1} / {nodes.length}
            </div>
            {currentIdx < nodes.length - 1 ? (
              <Button variant="primary" onClick={goNext}>
                下一节点 →
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => {
                  if (
                    currentNode.type === 'content' ||
                    currentNode.type === 'aiPractice'
                  ) {
                    complete(currentNode.id)
                  }
                  navigate('/student/courses')
                }}
              >
                完成本课 ✓
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

/* ============================================================
 * 节点状态徽标
 * ============================================================ */
function NodeStatusBadge({
  active,
  done,
  index,
}: {
  active: boolean
  done: boolean
  index: number
}) {
  if (done) {
    return (
      <span className="w-5 h-5 rounded-full bg-brand text-white text-[10px] flex items-center justify-center shrink-0">
        ✓
      </span>
    )
  }
  return (
    <span
      className={
        'w-5 h-5 rounded-full border text-[10px] flex items-center justify-center shrink-0 ' +
        (active
          ? 'border-brand text-brand-text bg-white'
          : 'border-ink-300 text-ink-500 bg-white')
      }
    >
      {index}
    </span>
  )
}

const NODE_TYPE_LABEL: Record<string, string> = {
  content:    '图文内容',
  survey:     '课堂问卷',
  assessment: '知识测评',
  aiPractice: 'AI 互动',
}

/* ============================================================
 * 主内容区分发
 * ============================================================ */
function NodeContent({
  node,
  courseId,
  onCompleted,
}: {
  node: ResolvedNode
  courseId: string
  onCompleted: () => void
}) {
  switch (node.type) {
    case 'content':
      return <ContentNodeView node={node as ContentNode} />
    case 'survey':
      return <SurveyNodeView node={node as SurveyNode} onCompleted={onCompleted} />
    case 'assessment':
      return <AssessmentNodeView node={node as AssessmentNode} courseId={courseId} onCompleted={onCompleted} />
    case 'aiPractice':
      return <AIPracticeNodeView node={node as AIPracticeNode} onCompleted={onCompleted} />
    case 'feedback':
      return <ContentNodeView node={node as ContentNode} />
  }
  return null
}

/* ============================================================
 * Content 节点 - 渲染 Markdown
 * ============================================================ */
function ContentNodeView({ node }: { node: ContentNode }) {
  const content = node.content ?? ''
  const minutes = Math.max(1, Math.round(content.length / 200))
  return (
    <Card>
      <div className="flex items-center gap-2 text-xs text-ink-500 mb-4 pb-3 border-b border-ink-100">
        <span>📖 阅读约 {minutes} 分钟</span>
      </div>
      <SimpleMarkdown content={node.content ?? ''} />
    </Card>
  )
}

/* ============================================================
 * Survey 节点 - 课堂小问卷
 * ============================================================ */
function SurveyNodeView({
  node,
  onCompleted,
}: {
  node: SurveyNode
  onCompleted: () => void
}) {
  const existing = getNodeSubmission(CURRENT_STUDENT_ID, node.id)

  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(() => {
    const questions = node.questions ?? []
    if (existing) {
      const map: Record<string, AnswerValue> = {}
      existing.answers.forEach((a) => (map[a.questionId] = a.value))
      // 没作答的题补空
      questions.forEach((q) => {
        if (!map[q.id]) map[q.id] = createEmptyAnswer(q)
      })
      return map
    }
    const init: Record<string, AnswerValue> = {}
    questions.forEach((q) => (init[q.id] = createEmptyAnswer(q)))
    return init
  })

  const [submitted, setSubmitted] = useState(!!existing)
  const [errorIdx, setErrorIdx] = useState<number>(-1)
  const startedAt = useMemo(() => Date.now(), [node.id])

  function handleSubmit() {
    const missing = questions.findIndex(
      (q) => q.required && !isAnswered(q, answers[q.id]),
    )
    if (missing >= 0) {
      setErrorIdx(missing)
      return
    }
    const sub: StudentSubmission = {
      id: uid('nsub'),
      studentId: CURRENT_STUDENT_ID,
      activityId: node.activityId ?? '',
      lessonNodeId: node.id,
      lessonId: node.lessonId,
      answers: questions.map((q) => ({
        questionId: q.id,
        value: answers[q.id],
      })),
      submittedAt: new Date().toISOString(),
      durationSec: Math.round((Date.now() - startedAt) / 1000),
      status: 'submitted',
    }
    saveNodeSubmission(sub)
    setSubmitted(true)
    onCompleted()
  }

  const questions = node.questions ?? []

  if (submitted) {
    return (
      <div className="space-y-4">
        <Card>
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-brand-soft border border-brand text-brand-text flex items-center justify-center text-lg shrink-0">
              ✓
            </div>
            <div>
              <h3 className="text-base font-medium text-ink-900">
                问卷已提交，谢谢参与！
              </h3>
              <p className="text-xs text-ink-500 mt-1">
                下方是你的回答（问卷不计分，仅供老师了解情况）
              </p>
            </div>
          </div>

          <ol className="space-y-4">
            {questions.map((q, i) => (
              <li key={q.id} className="border border-ink-200 rounded p-4">
                <div className="text-xs text-ink-500 mb-2">第 {i + 1} 题</div>
                <h4 className="text-sm text-ink-900 mb-3">{q.title}</h4>
                <QuestionRenderer
                  question={q}
                  value={answers[q.id]}
                  onChange={() => {}}
                  readOnly
                />
              </li>
            ))}
          </ol>
        </Card>

        {/* 全班匿名汇总 */}
        <ClassAnonymousSummary node={node} />
      </div>
    )
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        <Tag>课堂问卷</Tag>
        {node.required && <Tag variant="brand">必答</Tag>}
        <span className="text-xs text-ink-500 ml-auto">
          {questions.length} 题 · 不计分
        </span>
      </div>
      <h3 className="text-base font-medium text-ink-900">{node.title}</h3>
      {node.description && (
        <p className="text-xs text-ink-500 mt-1 mb-4">{node.description}</p>
      )}

      <ol className="space-y-4 mt-4">
        {questions.map((q, i) => (
          <li
            key={q.id}
            className={
              'border rounded p-4 ' +
              (errorIdx === i ? 'border-red-300 bg-red-50/40' : 'border-ink-200')
            }
          >
            <div className="flex items-center gap-2 text-xs text-ink-500 mb-2">
              <span>第 {i + 1} 题</span>
              {q.required && <Tag variant="brand">必答</Tag>}
            </div>
            <h4 className="text-sm text-ink-900 mb-3">{q.title}</h4>
            <QuestionRenderer
              question={q}
              value={answers[q.id]}
              onChange={(v) =>
                setAnswers((prev) => ({ ...prev, [q.id]: v }))
              }
            />
            {errorIdx === i && (
              <div className="mt-2 text-xs text-red-600">本题为必答题</div>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-6 flex justify-center">
        <Button variant="primary" onClick={handleSubmit}>
          提交问卷
        </Button>
      </div>
    </Card>
  )
}

/* ============================================================
 * Assessment 节点 - 知识测评（带判分）
 * ============================================================ */
function AssessmentNodeView({
  node,
  courseId,
  onCompleted,
}: {
  node: AssessmentNode
  courseId: string
  onCompleted: () => void
}) {
  const existing = getNodeSubmission(CURRENT_STUDENT_ID, node.id)
  const questions = node.questions ?? []

  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(() => {
    if (existing) {
      const map: Record<string, AnswerValue> = {}
      existing.answers.forEach((a) => (map[a.questionId] = a.value))
      questions.forEach((q) => {
        if (!map[q.id]) map[q.id] = createEmptyAnswer(q)
      })
      return map
    }
    const init: Record<string, AnswerValue> = {}
    questions.forEach((q) => (init[q.id] = createEmptyAnswer(q)))
    return init
  })

  const [result, setResult] = useState<StudentSubmission | undefined>(existing)
  const [errorIdx, setErrorIdx] = useState<number>(-1)
  const startedAt = useMemo(() => Date.now(), [node.id])

  function handleSubmit() {
    const missing = questions.findIndex(
      (q) => !isAnswered(q, answers[q.id]),
    )
    if (missing >= 0) {
      setErrorIdx(missing)
      return
    }
    const qaList: QuestionAnswer[] = questions.map((q) => {
      const v = answers[q.id]
      const g = gradeAnswer(q, v)
      return { questionId: q.id, value: v, score: g.score, correct: g.correct }
    })
    const s = summarize(questions, qaList)

    // 维度得分
    const dimensionScores: Record<string, number> = {}
    ;(node.dimensions ?? []).forEach((d) => {
      const qs = questions.filter((q) => (q.dimensions ?? []).includes(d.id))
      let earned = 0, full = 0
      qs.forEach((q) => {
        full += q.score ?? 0
        const a = qaList.find((x) => x.questionId === q.id)
        earned += a?.score ?? 0
      })
      dimensionScores[d.id] = full === 0 ? 0 : earned / full
    })

    const sub: StudentSubmission = {
      id: uid('nsub'),
      studentId: CURRENT_STUDENT_ID,
      activityId: node.activityId ?? '',
      lessonNodeId: node.id,
      lessonId: node.lessonId,
      answers: qaList,
      score: s.totalScore,
      correctRate: s.correctRate,
      dimensionScores,
      submittedAt: new Date().toISOString(),
      durationSec: Math.round((Date.now() - startedAt) / 1000),
      status: 'submitted',
    }
    saveNodeSubmission(sub)
    setResult(sub)
    onCompleted()
  }

  // —— 已提交：展示结果反馈 ——
  if (result) {
    const fullScore = node.totalScore ?? 0
    const totalScore = result.score ?? 0
    const correctRate = result.correctRate ?? 0
    const correctCount = result.answers.filter((a) => a.correct).length
    const passed = node.passScore == null || totalScore >= node.passScore

    // 教师在「活动设置」里配置的反馈开关（默认显示成绩与解析，维度雷达默认关）
    const showScore = node.showResultToStudent !== false
    const showExplanation = node.showExplanation !== false
    const showDimensionRadar = node.showDimensionRadar === true

    // 维度得分
    const dimScore = (node.dimensions ?? []).map((d) => {
      const qs = questions.filter((q) => (q.dimensions ?? []).includes(d.id))
      let earned = 0
      let full = 0
      qs.forEach((q) => {
        full += q.score ?? 0
        const a = result.answers.find((x) => x.questionId === q.id)
        earned += a?.score ?? 0
      })
      return {
        ...d,
        rate: full === 0 ? 0 : earned / full,
        text: `${earned} / ${full}`,
      }
    })

    return (
      <div className="space-y-4">
        {/* 分数大卡 —— 教师关闭"显示成绩"时只显示提交确认 */}
        {showScore ? (
        <Card className={passed ? 'border-brand bg-brand-softer' : ''}>
          <div className="flex items-start gap-4">
            <div
              className={
                'w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0 ' +
                (passed
                  ? 'bg-brand text-white'
                  : 'bg-ink-200 text-ink-700')
              }
            >
              {passed ? '🎉' : '💪'}
            </div>
            <div className="flex-1">
              <div className="text-xs text-ink-500 mb-1">本节测评结果</div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-medium text-brand-text">
                  {totalScore}
                </span>
                <span className="text-sm text-ink-500">/ {fullScore} 分</span>
                <Tag variant="brand" className="ml-2">
                  正确率 {pct(correctRate, 0)}
                </Tag>
              </div>
              <div className="text-xs text-ink-500">
                答对 {correctCount} / {questions.length} 题 ·
                用时 {fmtDuration(result.durationSec)}
              </div>
            </div>
          </div>
        </Card>
        ) : (
          <Card className="border-brand bg-brand-softer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center text-lg shrink-0">
                ✓
              </div>
              <div>
                <h3 className="text-base font-medium text-ink-900">测评已提交</h3>
                <p className="text-xs text-ink-500 mt-0.5">
                  成绩将由老师统一公布，请耐心等待
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* 维度掌握 —— 需教师开启"显示维度雷达"且显示成绩 */}
        {showScore && showDimensionRadar && dimScore.length > 0 && (
          <Card title="维度掌握">
            <ul className="space-y-3">
              {dimScore.map((d) => (
                <li key={d.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-ink-900">{d.name}</span>
                    <span className="text-ink-500">
                      {d.text} · {pct(d.rate, 0)}
                    </span>
                  </div>
                  <ProgressBar value={d.rate} />
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* 逐题反馈 —— 需教师开启"显示对错与解析" */}
        {showExplanation && (
        <Card title="题目反馈">
          <ol className="space-y-4">
            {questions.map((q, i) => {
              const a = result.answers.find((x) => x.questionId === q.id)
              return (
                <li key={q.id} className="border border-ink-200 rounded p-4">
                  <div className="flex items-center gap-2 text-xs text-ink-500 mb-2">
                    <span>第 {i + 1} 题</span>
                    {q.score != null && <Tag>{q.score} 分</Tag>}
                    {a?.correct ? (
                      <Tag variant="brand">✓ 答对 · 得 {a?.score ?? 0} 分</Tag>
                    ) : (
                      <span className="lf-tag !bg-red-50 !text-red-600 !border-red-100">
                        ✗ 答错 · 得 {a?.score ?? 0} 分
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm text-ink-900 mb-3">{q.title}</h4>
                  <QuestionRenderer
                    question={q}
                    value={answers[q.id]}
                    onChange={() => {}}
                    readOnly
                  />
                  {q.explanation && (
                    <div className="mt-3 px-3 py-2 bg-brand-softer border border-brand-soft rounded text-xs text-ink-700">
                      <div className="font-medium text-brand-text mb-1">解析</div>
                      <div className="leading-relaxed">{q.explanation}</div>
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        </Card>
        )}

        {/* 重新作答 */}
        <Card className="!p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-ink-900 mb-1">想再挑战一次？</div>
              <div className="text-xs text-ink-500">
                重做会清掉本次成绩，重新计入新的提交记录
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                if (!confirm('重新作答会覆盖你这次的成绩，确定吗？')) return
                clearNodeSubmission(CURRENT_STUDENT_ID, node.id)
                uncompleteNode(CURRENT_STUDENT_ID, courseId, node.lessonId ?? '', node.id)
                setResult(undefined)
                // 清空答案
                const init: Record<string, AnswerValue> = {}
                questions.forEach((q) => (init[q.id] = createEmptyAnswer(q)))
                setAnswers(init)
                setErrorIdx(-1)
              }}
            >
              🔄 重新作答
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // —— 作答中 ——
  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        <Tag variant="brand">知识测评</Tag>
        <Tag>{node.totalScore ?? 0} 分</Tag>
        {node.passScore && <span className="text-xs text-ink-500">及格 {node.passScore} 分</span>}
        <span className="text-xs text-ink-500 ml-auto">
          {questions.length} 题
        </span>
      </div>
      <h3 className="text-base font-medium text-ink-900">{node.title}</h3>
      {node.description && (
        <p className="text-xs text-ink-500 mt-1">{node.description}</p>
      )}

      <ol className="space-y-4 mt-4">
        {questions.map((q, i) => (
          <li
            key={q.id}
            className={
              'border rounded p-4 ' +
              (errorIdx === i ? 'border-red-300 bg-red-50/40' : 'border-ink-200')
            }
          >
            <div className="flex items-center gap-2 text-xs text-ink-500 mb-2">
              <span>第 {i + 1} 题</span>
              {q.score != null && <Tag>{q.score} 分</Tag>}
            </div>
            <h4 className="text-sm text-ink-900 mb-3">{q.title}</h4>
            <QuestionRenderer
              question={q}
              value={answers[q.id]}
              onChange={(v) =>
                setAnswers((prev) => ({ ...prev, [q.id]: v }))
              }
            />
            {errorIdx === i && (
              <div className="mt-2 text-xs text-red-600">请先作答本题</div>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-6 flex justify-center">
        <Button variant="primary" onClick={handleSubmit}>
          提交测评
        </Button>
      </div>
    </Card>
  )
}

/* ============================================================
 * AI Practice 节点 - 互动占位
 * ============================================================ */
function AIPracticeNodeView({
  node,
  onCompleted,
}: {
  node: AIPracticeNode
  onCompleted: () => void
}) {
  const [tried, setTried] = useState(
    () => !!getNodeSubmission(CURRENT_STUDENT_ID, node.id),
  )

  function handleTry() {
    if (tried) return
    const sub: StudentSubmission = {
      id: uid('nsub'),
      studentId: CURRENT_STUDENT_ID,
      activityId: node.activityId ?? '',
      lessonNodeId: node.id,
      lessonId: node.lessonId,
      answers: [],
      submittedAt: new Date().toISOString(),
      status: 'submitted',
    }
    saveNodeSubmission(sub)
    setTried(true)
    onCompleted()
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        <Tag>AI 互动练习</Tag>
        {tried && <Tag variant="brand">已体验</Tag>}
      </div>
      <h3 className="text-base font-medium text-ink-900">{node.title}</h3>
      {node.description && (
        <p className="text-xs text-ink-500 mt-1 mb-4">{node.description}</p>
      )}

      {/* 真实可交互的 AI 模拟器 */}
      <AIPracticeSimulator
        practiceType={node.practiceType}
        examples={node.examples}
        onInteract={handleTry}
      />

      <div className="mt-4 text-center">
        {tried ? (
          <span className="text-xs text-ink-500">
            ✓ 已体验过本节互动，可以继续下一节点
          </span>
        ) : (
          <span className="text-xs text-ink-500">
            尝试一下 AI 互动，体验完会自动标记完成
          </span>
        )}
      </div>
    </Card>
  )
}

/* ============================================================
 * 问卷全班匿名汇总
 * 看看其他同学都怎么回答
 * ============================================================ */
function ClassAnonymousSummary({ node }: { node: SurveyNode }) {
  const questions = node.questions ?? []
  const allSubs = getNodeSubmissions().filter((s) => s.lessonNodeId === node.id)

  if (allSubs.length === 0) return null

  return (
    <Card
      title="看看大家怎么答 👥"
      extra={<Tag className="!text-[10px]">{allSubs.length} 人已作答</Tag>}
    >
      <ol className="space-y-5">
        {questions.map((q, i) => {
          if (q.type === 'singleChoice' || q.type === 'multipleChoice') {
            const opts = q.options ?? []
            const counts = opts.map((o) => ({
              id: o.id,
              label: o.label,
              count: allSubs.filter((s) => {
                const a = s.answers.find((x) => x.questionId === q.id)
                if (!a) return false
                if (a.value.type === 'singleChoice') {
                  return a.value.optionId === o.id
                }
                if (a.value.type === 'multipleChoice') {
                  return a.value.optionIds.includes(o.id)
                }
                return false
              }).length,
            }))
            const maxCount = Math.max(...counts.map((c) => c.count), 1)
            return (
              <li key={q.id}>
                <div className="text-xs text-ink-500 mb-2">
                  第 {i + 1} 题 ·{' '}
                  {q.type === 'singleChoice' ? '单选' : '多选'}
                </div>
                <h4 className="text-sm text-ink-900 mb-3">{q.title}</h4>
                <ul className="space-y-2">
                  {counts.map((c) => (
                    <li key={c.id} className="flex items-center gap-3">
                      <div className="w-32 shrink-0 text-xs text-ink-700">
                        {c.label}
                      </div>
                      <div className="flex-1 h-6 bg-ink-100 rounded overflow-hidden relative">
                        <div
                          className="h-full bg-brand-soft transition-all"
                          style={{
                            width: `${(c.count / maxCount) * 100}%`,
                          }}
                        />
                        <span className="absolute inset-0 flex items-center px-2 text-xs text-ink-700">
                          {c.count} 人
                          {allSubs.length > 0 &&
                            ` · ${Math.round((c.count / allSubs.length) * 100)}%`}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            )
          }

          if (q.type === 'fillBlank' || q.type === 'shortAnswer') {
            const list: string[] = []
            allSubs.forEach((s) => {
              const a = s.answers.find((x) => x.questionId === q.id)
              if (!a) return
              if (a.value.type === 'fillBlank') {
                const t = a.value.blanks.join(' / ').trim()
                if (t) list.push(t)
              }
              if (a.value.type === 'shortAnswer') {
                const t = a.value.text.trim()
                if (t) list.push(t)
              }
            })
            if (list.length === 0) return null
            return (
              <li key={q.id}>
                <div className="text-xs text-ink-500 mb-2">
                  第 {i + 1} 题 ·{' '}
                  {q.type === 'fillBlank' ? '填空' : '简答'}
                </div>
                <h4 className="text-sm text-ink-900 mb-3">{q.title}</h4>
                <ul className="space-y-1.5 max-h-32 overflow-y-auto bg-ink-50 rounded p-3">
                  {list.map((text, j) => (
                    <li key={j} className="text-xs text-ink-700 leading-relaxed">
                      ▸ {text}
                    </li>
                  ))}
                </ul>
              </li>
            )
          }

          // 其他题型暂不展示汇总
          return null
        })}
      </ol>
    </Card>
  )
}
