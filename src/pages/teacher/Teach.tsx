import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, ProgressBar, Tag, Icon } from '@/components/ui'
import type { IconName } from '@/components/ui'
import { SimpleMarkdown } from '@/components/SimpleMarkdown'
import { QuestionRenderer } from '@/components/question'
import { CourseCover } from '@/components/CourseCover'
import {
  getCourseById,
  getNodeSubmissions,
  getStudents,
  getClasses,
} from '@/store'
import { createEmptyAnswer, pct, resolveNode } from '@/utils'
import type { ResolvedNode, LessonNodeType } from '@/types'

/**
 * 教师端 - 上课（课堂教学模式）
 * 路径：/teacher/course/:courseId/teach
 *
 * 还原"机房微机课"的真实上课场景：
 *  - 左：课节 + 节点（PPT）目录，点击跳转
 *  - 中：演示舞台。图文节点 = 投屏幻灯片；问卷/测评节点 = 下发给学生 + 实时作答
 *  - 右：配套 AI 教案（本节要点 / 讲解建议 / 预计时长 / 课堂提示）
 */

const NODE_ICON: Record<LessonNodeType, IconName> = {
  content: 'fileText',
  survey: 'clipboard',
  assessment: 'check',
  aiPractice: 'sparkles',
  feedback: 'message',
}
const NODE_LABEL: Record<LessonNodeType, string> = {
  content: '讲解',
  survey: '问卷',
  assessment: '测评',
  aiPractice: 'AI 互动',
  feedback: '反馈',
}

export function TeacherTeach() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const course = courseId ? getCourseById(courseId) : undefined

  const allStudents = getStudents()
  const classes = getClasses()
  const subs = getNodeSubmissions()

  const [lessonIdx, setLessonIdx] = useState(0)
  const [nodeIdx, setNodeIdx] = useState(0)
  // 已下发的节点 id 集合（课堂内本地状态，模拟"推送给学生"）
  const [pushed, setPushed] = useState<Set<string>>(new Set())

  if (!course) {
    return (
      <div className="p-6">
        <Card>
          <div className="py-12 text-center text-sm text-ink-500">课程不存在</div>
        </Card>
      </div>
    )
  }

  const lessons = [...course.lessons].sort((a, b) => a.order - b.order)
  const lesson = lessons[lessonIdx]
  const nodes: ResolvedNode[] = useMemo(
    () =>
      lesson
        ? [...lesson.nodes].sort((a, b) => a.order - b.order).map((n) => resolveNode(n))
        : [],
    [lesson?.id],
  )
  const node = nodes[nodeIdx]

  // 班级人数（取第一个班，demo 简化）
  const classStudentCount =
    classes[0]?.studentIds.length ?? allStudents.length

  function goNode(i: number) {
    if (i < 0 || i >= nodes.length) return
    setNodeIdx(i)
  }
  function switchLesson(i: number) {
    setLessonIdx(i)
    setNodeIdx(0)
  }

  return (
    <div className="flex flex-col h-full bg-ink-900">
      {/* 顶栏 */}
      <header className="h-12 shrink-0 bg-ink-900 text-white flex items-center px-4 gap-3 border-b border-ink-700">
        <button
          onClick={() => navigate('/teacher/courses')}
          className="text-xs text-ink-300 hover:text-white flex items-center gap-1"
        >
          ✕ 退出上课
        </button>
        <div className="w-px h-5 bg-ink-700" />
        <CourseCover courseId={course.id} title={course.title} height="xs" className="w-7 rounded" />
        <span className="text-sm font-medium truncate max-w-xs">{course.title}</span>
        {/* 课节切换 */}
        <div className="ml-4 flex items-center gap-1 overflow-x-auto">
          {lessons.map((l, i) => (
            <button
              key={l.id}
              onClick={() => switchLesson(i)}
              className={
                'px-2.5 h-7 text-xs rounded whitespace-nowrap transition ' +
                (i === lessonIdx
                  ? 'bg-brand text-white'
                  : 'text-ink-300 hover:bg-ink-700')
              }
            >
              第{i + 1}节
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-ink-300">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            授课中 · {classStudentCount} 名学生在线
          </span>
        </div>
      </header>

      {/* 三栏主体 */}
      <div className="flex-1 min-h-0 flex">
        {/* 左：目录 */}
        <aside className="w-60 shrink-0 bg-ink-800 text-ink-200 overflow-y-auto">
          <div className="px-3 py-2.5 text-[11px] text-ink-400 sticky top-0 bg-ink-800 border-b border-ink-700">
            {lesson?.title ?? '课节'} · {nodes.length} 个环节
          </div>
          <nav className="p-2 space-y-1">
            {nodes.map((n, i) => {
              const active = i === nodeIdx
              const wasPushed = pushed.has(n.id)
              return (
                <button
                  key={n.id}
                  onClick={() => goNode(i)}
                  className={
                    'w-full text-left px-2.5 py-2 rounded text-xs transition flex items-start gap-2 ' +
                    (active ? 'bg-brand text-white' : 'hover:bg-ink-700')
                  }
                >
                  <Icon name={NODE_ICON[n.type]} className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="flex-1 min-w-0">
                    <span className="block truncate">{n.title}</span>
                    <span className={'text-[10px] ' + (active ? 'text-blue-100' : 'text-ink-400')}>
                      {i + 1}. {NODE_LABEL[n.type]}
                      {wasPushed && ' · 已下发'}
                    </span>
                  </span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* 中：演示舞台 */}
        <main className="flex-1 min-w-0 bg-ink-100 flex flex-col">
          {node ? (
            <TeachStage
              node={node}
              pushed={pushed.has(node.id)}
              onPush={() => setPushed((p) => new Set(p).add(node.id))}
              subs={subs}
              classStudentCount={classStudentCount}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-ink-500">
              本课节暂无环节
            </div>
          )}
          {/* 底部翻页 */}
          <div className="h-14 shrink-0 bg-white border-t border-ink-200 flex items-center justify-between px-6">
            <Button variant="secondary" onClick={() => goNode(nodeIdx - 1)} disabled={nodeIdx === 0}>
              ← 上一页
            </Button>
            <span className="text-xs text-ink-500">
              {nodeIdx + 1} / {nodes.length}
            </span>
            <Button variant="primary" onClick={() => goNode(nodeIdx + 1)} disabled={nodeIdx >= nodes.length - 1}>
              下一页 →
            </Button>
          </div>
        </main>

        {/* 右：AI 教案 */}
        <aside className="w-72 shrink-0 bg-white border-l border-ink-200 overflow-y-auto">
          {node && <LessonPlanPanel node={node} index={nodeIdx} />}
        </aside>
      </div>
    </div>
  )
}

/* PLACEHOLDER_SUBCOMPONENTS */

/* ============================================================
 * 中间演示舞台：图文=投屏幻灯片；问卷/测评=下发 + 实时作答
 * ============================================================ */
function TeachStage({
  node,
  pushed,
  onPush,
  subs,
  classStudentCount,
}: {
  node: ResolvedNode
  pushed: boolean
  onPush: () => void
  subs: ReturnType<typeof getNodeSubmissions>
  classStudentCount: number
}) {
  // 已作答人数（模拟：用 mock 提交里命中本节点的去重学生数）
  const answered = new Set(
    subs.filter((s) => s.lessonNodeId === node.id).map((s) => s.studentId),
  ).size
  const answerRate = classStudentCount === 0 ? 0 : answered / classStudentCount

  // —— 图文 / AI互动：当幻灯片投屏 ——
  if (node.type === 'content' || node.type === 'feedback' || node.type === 'aiPractice') {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto p-8 flex justify-center">
        <div className="w-full max-w-3xl">
          <div className="bg-white rounded-lg shadow-card border border-ink-200 px-10 py-8 min-h-[60vh]">
            <div className="flex items-center gap-2 mb-5">
              <Icon name={NODE_ICON[node.type]} className="w-5 h-5 text-ink-500" />
              <Tag>{NODE_LABEL[node.type]}</Tag>
            </div>
            {node.content ? (
              <SimpleMarkdown content={node.content} />
            ) : (
              <div className="text-center py-16 text-ink-400">
                <Icon name={NODE_ICON[node.type]} className="w-10 h-10 mx-auto mb-3 text-ink-300" />
                <div className="text-lg font-medium text-ink-700">{node.title}</div>
                {node.description && (
                  <p className="text-sm text-ink-500 mt-2">{node.description}</p>
                )}
                {node.type === 'aiPractice' && (
                  <p className="text-xs text-ink-400 mt-4">
                    引导学生在自己的设备上体验本互动
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // —— 问卷 / 测评：下发给学生 + 实时作答 ——
  const questions = node.questions ?? []
  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-8 flex justify-center">
      <div className="w-full max-w-3xl space-y-4">
        {/* 下发控制条 */}
        <div className="bg-white rounded-lg shadow-card border border-ink-200 p-5">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Tag variant={node.type === 'assessment' ? 'brand' : 'default'}>
                  {NODE_LABEL[node.type]}
                </Tag>
                <h2 className="text-base font-medium text-ink-900 truncate">{node.title}</h2>
              </div>
              <p className="text-xs text-ink-500">
                {questions.length} 题
                {node.type === 'assessment' && node.totalScore != null && ` · 共 ${node.totalScore} 分`}
                {node.required && ' · 必答'}
              </p>
            </div>
            {!pushed ? (
              <Button variant="primary" onClick={onPush} className="shrink-0 inline-flex items-center gap-1.5">
                <Icon name="send" className="w-4 h-4" />
                下发给学生
              </Button>
            ) : (
              <div className="shrink-0 text-right">
                <div className="text-xs text-green-600 font-medium">✓ 已下发</div>
                <div className="text-[11px] text-ink-500 mt-0.5">学生设备上已显示</div>
              </div>
            )}
          </div>

          {/* 实时作答进度 */}
          {pushed && (
            <div className="mt-4 pt-4 border-t border-ink-100">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-ink-700">实时作答</span>
                <span className="text-ink-500">
                  {answered} / {classStudentCount} 人已提交 · {pct(answerRate, 0)}
                </span>
              </div>
              <ProgressBar value={answerRate} height={8} />
              <p className="text-[11px] text-ink-400 mt-2">
                作答数据会进入「学情数据」，下课后可查看完整分析
              </p>
            </div>
          )}
        </div>

        {/* 题目预览（教师可见，便于讲解） */}
        <div className="bg-white rounded-lg shadow-card border border-ink-200 p-6">
          <div className="text-[11px] text-ink-400 mb-3">题目预览（投屏给学生看）</div>
          <ol className="space-y-5">
            {questions.map((q, i) => (
              <li key={q.id} className="border border-ink-100 rounded p-4">
                <div className="flex items-center gap-2 text-xs text-ink-500 mb-2">
                  <span>第 {i + 1} 题</span>
                  {node.type === 'assessment' && q.score != null && <Tag>{q.score} 分</Tag>}
                </div>
                <h4 className="text-sm text-ink-900 mb-3">{q.title}</h4>
                <div className="pointer-events-none opacity-90">
                  <QuestionRenderer question={q} value={createEmptyAnswer(q)} onChange={() => {}} />
                </div>
              </li>
            ))}
            {questions.length === 0 && (
              <li className="text-center text-sm text-ink-400 py-8">本活动还没有题目</li>
            )}
          </ol>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
 * 右侧 AI 教案面板（按节点类型派生教学建议）
 * ============================================================ */
function LessonPlanPanel({ node, index }: { node: ResolvedNode; index: number }) {
  const plan = derivePlan(node)
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-ink-200">
        <Icon name="graduation" className="w-5 h-5 text-brand-text" />
        <div>
          <div className="text-sm font-medium text-ink-900">AI 教案</div>
          <div className="text-[11px] text-ink-500">第 {index + 1} 环节 · {NODE_LABEL[node.type]}</div>
        </div>
      </div>

      <PlanBlock icon="clock" title="建议时长">
        <span className="text-sm text-ink-900">{plan.minutes} 分钟</span>
      </PlanBlock>

      <PlanBlock icon="target" title="本环节目标">
        <p className="text-xs text-ink-700 leading-relaxed">{plan.goal}</p>
      </PlanBlock>

      <PlanBlock icon="message" title="讲解建议">
        <ul className="space-y-1.5">
          {plan.tips.map((t, i) => (
            <li key={i} className="text-xs text-ink-700 leading-relaxed flex gap-1.5">
              <span className="text-brand-text shrink-0">·</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </PlanBlock>

      {plan.watch && (
        <PlanBlock icon="alert" title="课堂提示">
          <p className="text-xs text-amber-700 leading-relaxed bg-amber-50 border border-amber-100 rounded p-2.5">
            {plan.watch}
          </p>
        </PlanBlock>
      )}
    </div>
  )
}

function PlanBlock({ icon, title, children }: { icon: IconName; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-[11px] text-ink-500 mb-1.5 flex items-center gap-1.5">
        <Icon name={icon} className="w-3.5 h-3.5" />
        {title}
      </div>
      {children}
    </div>
  )
}

/** 按节点类型派生教学建议（demo：规则生成，未来可接 AI） */
function derivePlan(node: ResolvedNode): {
  minutes: number
  goal: string
  tips: string[]
  watch?: string
} {
  const qn = node.questions?.length ?? 0
  switch (node.type) {
    case 'content':
      return {
        minutes: 5,
        goal: node.description || '讲清本环节的核心概念，建立学生的直观认知。',
        tips: [
          '先用生活例子导入，再给定义，降低理解门槛。',
          '投屏时放慢节奏，关键术语板书或重复一遍。',
          '可随机点 1–2 名学生复述，确认理解。',
        ],
      }
    case 'survey':
      return {
        minutes: 3,
        goal: '收集学生的真实想法 / 课堂反馈，本环节不计分。',
        tips: [
          '强调"没有对错，凭真实想法选"，鼓励参与。',
          '下发后留 1–2 分钟，观察作答进度再继续。',
          '可现场念几条匿名结果，活跃气氛。',
        ],
      }
    case 'assessment':
      return {
        minutes: Math.max(5, qn * 2),
        goal: '检测学生对本节知识的掌握，及时发现薄弱点。',
        tips: [
          '下发前先口头说明题量与时长，让学生有预期。',
          '盯住实时作答进度，多数人完成后再公布答案。',
          '讲评时优先讲错误率高的题，结合解析。',
        ],
        watch: qn === 0 ? '本测评还没有题目，记得先在备课里配置。' : undefined,
      }
    case 'aiPractice':
      return {
        minutes: 8,
        goal: node.description || '让学生动手体验 AI 工具，建立感性认识。',
        tips: [
          '先教师演示一遍操作流程，再让学生自己试。',
          '巡视机房，关注卡住的学生。',
          '请 1–2 名学生展示成果，集体点评。',
        ],
      }
    default:
      return {
        minutes: 3,
        goal: node.description || '课后小结与反馈。',
        tips: ['回顾本课要点，布置延伸思考。'],
      }
  }
}
