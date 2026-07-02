import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Card, ProgressBar, StatNumber, Tag, Button, Input, Textarea } from '@/components/ui'
import { CourseCover } from '@/components/CourseCover'
import {
  getCourseById,
  getNodeSubmissions,
  getStudents,
  gradeQuestionAnswer,
} from '@/store'
import { fmtDateTime, fmtDuration, pct, resolveNode } from '@/utils'
import type {
  AssessmentNode,
  Course,
  Lesson,
  LessonNode,
  ResolvedNode,
  StudentSubmission,
  Student,
  SurveyNode,
} from '@/types'
import { QUESTION_TYPE_LABEL } from '@/types'

/**
 * 教师端 - 课程数据报告
 *
 * 围绕"课程 → 课节 → 节点"组织：
 * - 顶部：课程信息 + 整体统计
 * - 节点导航：列出所有互动节点
 * - 节点详情：根据节点类型展示
 *   - survey：选项占比 + 学生名单 / 填空汇总
 *   - assessment：参与/平均/最高/最低 + 维度 + 每题正确率 + 易错题 + 学生明细
 *   - aiPractice：参与人数 + 体验时间
 */
export function TeacherCourseReport() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const course = courseId ? getCourseById(courseId) : undefined
  const subs = useMemo(() => getNodeSubmissions(), [])
  const students = useMemo(() => getStudents(), [])

  if (!course) {
    return (
      <div className="p-6">
        <Card>
          <div className="py-12 text-center text-sm text-ink-500">
            课程不存在
          </div>
        </Card>
      </div>
    )
  }

  // 平铺所有互动节点（注水成 ResolvedNode）
  const interactNodes: { lesson: Lesson; node: ResolvedNode }[] = []
  course.lessons.forEach((l) => {
    l.nodes.forEach((n) => {
      if (n.type !== 'content' && n.type !== 'feedback') {
        interactNodes.push({ lesson: l, node: resolveNode(n) })
      }
    })
  })

  const [currentNodeId, setCurrentNodeId] = useState<string>(
    interactNodes[0]?.node.id ?? '',
  )
  const current = interactNodes.find((x) => x.node.id === currentNodeId)

  // 整体统计
  const studentTotal = students.length
  const allInteractIds = interactNodes.map((x) => x.node.id)
  const allInteractSubs = subs.filter((s) =>
    allInteractIds.includes(s.lessonNodeId),
  )
  const uniqueStudentSubmits = new Set(allInteractSubs.map((s) => s.studentId))
    .size

  const completionRate =
    allInteractIds.length === 0
      ? 0
      : allInteractIds.reduce((acc, nid) => {
          const ss = new Set(
            subs.filter((s) => s.lessonNodeId === nid).map((s) => s.studentId),
          )
          return acc + (studentTotal === 0 ? 0 : ss.size / studentTotal)
        }, 0) / allInteractIds.length

  return (
    <div className="space-y-5">
      {/* —— 顶部 —— */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <CourseCover
            courseId={course.id}
            title={course.title}
            height="sm"
            className="w-20 shrink-0"
          />
          <div>
            <button
              onClick={() => navigate('/teacher/courses')}
              className="text-xs text-ink-500 hover:text-ink-900 mb-1"
            >
              ← 返回课程列表
            </button>
            <h2 className="text-lg font-medium text-ink-900">{course.title}</h2>
            <div className="flex items-center gap-2 text-xs text-ink-500 mt-1">
              <Tag>{course.gradeRange}</Tag>
              <span>{course.lessons.length} 课节</span>
              <span>·</span>
              <span>{interactNodes.length} 个互动节点</span>
              <span>·</span>
              <span>更新于 {fmtDateTime(course.updatedAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/teacher/course/${course.id}/editor`}>
            <Button variant="secondary">编辑课节</Button>
          </Link>
        </div>
      </div>

      {/* —— 整体统计 —— */}
      <div className="grid grid-cols-4 gap-4">
        <StatNumber
          label="参与学生"
          value={`${uniqueStudentSubmits} / ${studentTotal}`}
          hint="至少完成一个互动"
        />
        <StatNumber
          label="累计提交"
          value={allInteractSubs.length}
          hint="所有互动节点"
        />
        <StatNumber
          label="平均完成率"
          value={pct(completionRate, 0)}
          hint={`${interactNodes.length} 个节点`}
        />
        <StatNumber
          label="互动节点"
          value={interactNodes.length}
          hint={(() => {
            const counts = { survey: 0, assessment: 0, aiPractice: 0 } as Record<string, number>
            interactNodes.forEach((x) => {
              counts[x.node.type] = (counts[x.node.type] ?? 0) + 1
            })
            return `${counts.survey} 问卷 · ${counts.assessment} 测评 · ${counts.aiPractice} AI`
          })()}
        />
      </div>

      {interactNodes.length === 0 ? (
        <Card>
          <div className="py-12 text-center text-sm text-ink-500">
            该课程暂无互动节点
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {/* —— 左侧：节点导航 —— */}
          <Card className="!p-0 col-span-1">
            <div className="px-4 py-3 border-b border-ink-200 text-sm font-medium text-ink-900">
              互动节点
            </div>
            <ul className="p-2 space-y-1 max-h-[600px] overflow-y-auto">
              {interactNodes.map(({ lesson, node }) => {
                const active = node.id === currentNodeId
                const nodeSubs = subs.filter((s) => s.lessonNodeId === node.id)
                const studentSet = new Set(nodeSubs.map((s) => s.studentId))
                return (
                  <li key={node.id}>
                    <button
                      onClick={() => setCurrentNodeId(node.id)}
                      className={
                        'w-full text-left px-3 py-2 rounded text-xs border transition ' +
                        (active
                          ? 'border-brand bg-brand-softer'
                          : 'border-ink-200 hover:bg-ink-50')
                      }
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <Tag
                          variant={node.type === 'assessment' ? 'brand' : 'default'}
                          className="!text-[10px]"
                        >
                          {NODE_TYPE_LABEL[node.type]}
                        </Tag>
                        <span className="text-[10px] text-ink-500 ml-auto">
                          {studentSet.size}/{studentTotal}
                        </span>
                      </div>
                      <div
                        className={
                          'text-sm truncate ' +
                          (active ? 'text-brand-text font-medium' : 'text-ink-900')
                        }
                      >
                        {node.title}
                      </div>
                      <div className="text-[10px] text-ink-500 truncate mt-0.5">
                        {lesson.title}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Card>

          {/* —— 右侧：节点详情 —— */}
          <div className="col-span-3 space-y-4">
            {current ? (
              <NodeReport
                course={course}
                lesson={current.lesson}
                node={current.node}
                subs={subs.filter((s) => s.lessonNodeId === current.node.id)}
                students={students}
              />
            ) : (
              <Card>
                <div className="py-12 text-center text-sm text-ink-500">
                  从左侧选择一个节点查看数据
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const NODE_TYPE_LABEL: Record<string, string> = {
  content: '图文',
  survey: '问卷',
  assessment: '测评',
  aiPractice: 'AI 互动',
  feedback: '反馈',
}

/* ============================================================
 * 节点详情区
 * ============================================================ */
function NodeReport({
  course,
  lesson,
  node,
  subs,
  students,
}: {
  course: Course
  lesson: Lesson
  node: ResolvedNode
  subs: StudentSubmission[]
  students: Student[]
}) {
  const studentTotal = students.length
  const submittedSet = new Set(subs.map((s) => s.studentId))
  const submittedCount = submittedSet.size
  const unsubmittedStudents = students.filter((s) => !submittedSet.has(s.id))

  // 顶部：节点头
  return (
    <>
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-ink-500 mb-1">
              <Tag variant={node.type === 'assessment' ? 'brand' : 'default'}>
                {NODE_TYPE_LABEL[node.type]}
              </Tag>
              <span>来自《{course.title}》· {lesson.title}</span>
            </div>
            <h3 className="text-base font-medium text-ink-900">{node.title}</h3>
            {(node as any).description && (
              <p className="text-xs text-ink-500 mt-1">{(node as any).description}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-[11px] text-ink-500">完成情况</div>
            <div className="text-base font-medium text-ink-900">
              {submittedCount} / {studentTotal}
            </div>
            <div className="text-[11px] text-ink-500">
              {pct(studentTotal === 0 ? 0 : submittedCount / studentTotal, 0)}
            </div>
          </div>
        </div>
      </Card>

      {/* 按节点类型分发 */}
      {node.type === 'survey' && (
        <SurveyNodeReport
          node={node as SurveyNode}
          subs={subs}
          students={students}
          unsubmitted={unsubmittedStudents}
        />
      )}
      {node.type === 'assessment' && (
        <AssessmentNodeReport
          node={node as AssessmentNode}
          subs={subs}
          students={students}
          unsubmitted={unsubmittedStudents}
        />
      )}
      {node.type === 'aiPractice' && (
        <AIPracticeNodeReport
          subs={subs}
          students={students}
          unsubmitted={unsubmittedStudents}
        />
      )}
    </>
  )
}

/* ============================================================
 * Survey 节点报告
 * ============================================================ */
function SurveyNodeReport({
  node,
  subs,
  students,
  unsubmitted,
}: {
  node: SurveyNode
  subs: StudentSubmission[]
  students: Student[]
  unsubmitted: Student[]
}) {
  const [openOption, setOpenOption] = useState<{ qid: string; key: string } | null>(null)
  const studentName = (id: string) =>
    students.find((s) => s.id === id)?.name ?? id
  const questions = node.questions ?? []

  return (
    <>
      {unsubmitted.length > 0 && (
        <Card title={`未提交学生（${unsubmitted.length}）`}>
          <ul className="flex flex-wrap gap-1.5">
            {unsubmitted.map((s) => (
              <li key={s.id} className="lf-tag">{s.name}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="逐题统计">
        <ol className="space-y-5">
          {questions.map((q, qi) => {
            const answered = subs.filter((s) =>
              s.answers.find((a) => a.questionId === q.id),
            )

            // 选项类
            if (q.type === 'singleChoice' || q.type === 'multipleChoice') {
              const optStats = q.options.map((o) => {
                const studentIds: string[] = []
                answered.forEach((s) => {
                  const a = s.answers.find((x) => x.questionId === q.id)
                  if (!a) return
                  if (a.value.type === 'singleChoice' && a.value.optionId === o.id)
                    studentIds.push(s.studentId)
                  if (a.value.type === 'multipleChoice' && a.value.optionIds.includes(o.id))
                    studentIds.push(s.studentId)
                })
                return { id: o.id, label: `${o.label}. ${o.content}`, studentIds }
              })
              const denom = subs.length || 1
              return (
                <li key={q.id} className="border border-ink-200 rounded p-4">
                  <QuestionHeader index={qi} q={q} />
                  <div className="space-y-2 mt-3">
                    {optStats.map((opt) => {
                      const open = openOption?.qid === q.id && openOption?.key === opt.id
                      const ratio = opt.studentIds.length / denom
                      return (
                        <div key={opt.id}>
                          <button
                            onClick={() =>
                              setOpenOption(open ? null : { qid: q.id, key: opt.id })
                            }
                            className={
                              'w-full text-left px-3 py-2 rounded border transition ' +
                              (open
                                ? 'border-brand bg-brand-softer'
                                : 'border-ink-200 hover:bg-ink-50')
                            }
                          >
                            <div className="flex items-center justify-between text-sm mb-1.5">
                              <span className="text-ink-900">{opt.label}</span>
                              <span className="text-xs text-ink-500">
                                {opt.studentIds.length} 人 · {pct(ratio, 0)}
                              </span>
                            </div>
                            <ProgressBar value={ratio} />
                          </button>
                          {open && (
                            <div className="mt-2 ml-1 px-3 py-2 bg-ink-50 border border-ink-200 rounded">
                              <div className="text-[11px] text-ink-500 mb-1.5">
                                选择此项的学生（{opt.studentIds.length}）
                              </div>
                              {opt.studentIds.length === 0 ? (
                                <div className="text-xs text-ink-500">无</div>
                              ) : (
                                <ul className="flex flex-wrap gap-1.5">
                                  {opt.studentIds.map((sid) => (
                                    <li key={sid} className="lf-tag">
                                      {studentName(sid)}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </li>
              )
            }

            // 判断题
            if (q.type === 'judge') {
              const trueIds: string[] = []
              const falseIds: string[] = []
              answered.forEach((s) => {
                const a = s.answers.find((x) => x.questionId === q.id)
                if (!a || a.value.type !== 'judge' || a.value.value == null) return
                ;(a.value.value ? trueIds : falseIds).push(s.studentId)
              })
              const denom = subs.length || 1
              const rows = [
                { key: 'true',  label: '✓ 对', ids: trueIds  },
                { key: 'false', label: '✗ 错', ids: falseIds },
              ]
              return (
                <li key={q.id} className="border border-ink-200 rounded p-4">
                  <QuestionHeader index={qi} q={q} />
                  <div className="space-y-2 mt-3">
                    {rows.map((r) => {
                      const open = openOption?.qid === q.id && openOption?.key === r.key
                      const ratio = r.ids.length / denom
                      return (
                        <div key={r.key}>
                          <button
                            onClick={() =>
                              setOpenOption(open ? null : { qid: q.id, key: r.key })
                            }
                            className={
                              'w-full text-left px-3 py-2 rounded border transition ' +
                              (open ? 'border-brand bg-brand-softer' : 'border-ink-200 hover:bg-ink-50')
                            }
                          >
                            <div className="flex items-center justify-between text-sm mb-1.5">
                              <span className="text-ink-900">{r.label}</span>
                              <span className="text-xs text-ink-500">
                                {r.ids.length} 人 · {pct(ratio, 0)}
                              </span>
                            </div>
                            <ProgressBar value={ratio} />
                          </button>
                          {open && (
                            <div className="mt-2 ml-1 px-3 py-2 bg-ink-50 border border-ink-200 rounded">
                              {r.ids.length === 0 ? (
                                <div className="text-xs text-ink-500">无</div>
                              ) : (
                                <ul className="flex flex-wrap gap-1.5">
                                  {r.ids.map((sid) => (
                                    <li key={sid} className="lf-tag">
                                      {studentName(sid)}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </li>
              )
            }

            // 填空 / 简答：聚合回答
            if (q.type === 'fillBlank' || q.type === 'shortAnswer') {
              const list: { studentId: string; text: string }[] = []
              answered.forEach((s) => {
                const a = s.answers.find((x) => x.questionId === q.id)
                if (!a) return
                if (a.value.type === 'fillBlank') {
                  const t = a.value.blanks.join(' / ').trim()
                  if (t) list.push({ studentId: s.studentId, text: t })
                }
                if (a.value.type === 'shortAnswer') {
                  const t = a.value.text.trim()
                  if (t) list.push({ studentId: s.studentId, text: t })
                }
              })
              return (
                <li key={q.id} className="border border-ink-200 rounded p-4">
                  <QuestionHeader index={qi} q={q} />
                  {q.type === 'shortAnswer' && (q as any).answer && (
                    <div className="mt-3 px-3 py-2 bg-brand-softer border border-brand-soft rounded text-xs text-ink-700">
                      <div className="font-medium text-brand-text mb-1">📖 参考答案</div>
                      <div className="leading-relaxed">{(q as any).answer}</div>
                    </div>
                  )}
                  {list.length === 0 ? (
                    <div className="text-xs text-ink-500 mt-3">暂无回答</div>
                  ) : (
                    <ul className="divide-y divide-ink-100 border border-ink-200 rounded mt-3">
                      {list.map((a, i) => (
                        <li key={i} className="px-3 py-2 text-sm flex items-start gap-3">
                          <span className="text-[11px] text-ink-500 w-16 shrink-0 pt-0.5">
                            {studentName(a.studentId)}
                          </span>
                          <span className="text-ink-900 leading-relaxed flex-1">
                            {a.text}
                          </span>
                          {q.type === 'shortAnswer' && q.score != null && (
                            <span className="text-[11px] text-ink-500 shrink-0">
                              · 待批改 / {q.score} 分
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            }

            return null
          })}
        </ol>
      </Card>
    </>
  )
}

/* ============================================================
 * Assessment 节点报告
 * ============================================================ */
function AssessmentNodeReport({
  node,
  subs,
  students,
  unsubmitted,
}: {
  node: AssessmentNode
  subs: StudentSubmission[]
  students: Student[]
  unsubmitted: Student[]
}) {
  const studentName = (id: string) =>
    students.find((s) => s.id === id)?.name ?? id
  const questions = node.questions ?? []

  // 分数统计
  const scores = subs.map((s) => s.score ?? 0)
  const avg =
    scores.length === 0
      ? 0
      : Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
  const max = scores.length === 0 ? 0 : Math.max(...scores)
  const min = scores.length === 0 ? 0 : Math.min(...scores)

  // 每题正确率
  const accuracy = questions.map((q) => {
    let correct = 0
    let count = 0
    subs.forEach((s) => {
      const a = s.answers.find((x) => x.questionId === q.id)
      if (!a) return
      count++
      if (a.correct) correct++
    })
    return {
      questionId: q.id,
      title: q.title,
      type: q.type,
      correctCount: correct,
      totalCount: count,
      rate: count === 0 ? 0 : correct / count,
    }
  })

  // 维度掌握
  const dimMastery = (node.dimensions ?? []).map((d) => {
    const qs = questions.filter((q) => (q.dimensions ?? []).includes(d.id))
    let earned = 0
    let full = 0
    subs.forEach((sub) => {
      qs.forEach((q) => {
        full += q.score ?? 0
        const a = sub.answers.find((x) => x.questionId === q.id)
        earned += a?.score ?? 0
      })
    })
    return {
      ...d,
      rate: full === 0 ? 0 : earned / full,
    }
  })

  // 易错题 top 5
  const wrong = [...accuracy].sort((a, b) => a.rate - b.rate).slice(0, 5)

  // 学生明细
  const rows = subs.map((s) => ({
    sub: s,
    student: students.find((x) => x.id === s.studentId),
  }))
  rows.sort((a, b) => (b.sub.score ?? 0) - (a.sub.score ?? 0))

  return (
    <>
      {/* 分数大卡 */}
      <div className="grid grid-cols-4 gap-4">
        <StatNumber
          label="平均分"
          value={avg}
          hint={`满分 ${node.totalScore ?? 0}`}
        />
        <StatNumber label="最高分" value={max} />
        <StatNumber label="最低分" value={min} />
        <StatNumber
          label="未提交"
          value={unsubmitted.length}
          hint={
            unsubmitted.length > 0
              ? unsubmitted.slice(0, 3).map((u) => u.name).join('、') +
                (unsubmitted.length > 3 ? '…' : '')
              : '全员已交 🎉'
          }
        />
      </div>

      {/* 维度掌握 */}
      {dimMastery.length > 0 && (
        <Card title="维度掌握情况">
          <ul className="space-y-3">
            {dimMastery.map((d) => (
              <li key={d.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-ink-900">{d.name}</span>
                  <span className="text-ink-500">{pct(d.rate, 0)}</span>
                </div>
                <ProgressBar value={d.rate} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* 每题正确率 */}
      <Card title="每题正确率">
        <ul className="space-y-3">
          {accuracy.map((a, i) => (
            <li key={a.questionId}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-ink-900 truncate pr-2">
                  第 {i + 1} 题 · {a.title}
                  <span className="ml-2 lf-tag !h-5 !px-1.5 !text-[10px]">
                    {QUESTION_TYPE_LABEL[a.type]}
                  </span>
                </span>
                <span className="text-ink-500 shrink-0">
                  {a.correctCount} / {a.totalCount} · {pct(a.rate, 0)}
                </span>
              </div>
              <ProgressBar value={a.rate} />
            </li>
          ))}
        </ul>
      </Card>

      {/* 易错题 */}
      <Card title={`易错题 Top ${wrong.length}`}>
        {wrong.length === 0 ? (
          <div className="text-xs text-ink-500 py-4 text-center">暂无数据</div>
        ) : (
          <ol className="space-y-2">
            {wrong.map((w, i) => (
              <li
                key={w.questionId}
                className="px-3 py-2 border border-ink-200 rounded flex items-center justify-between"
              >
                <span className="text-sm text-ink-900 truncate pr-2">
                  <span className="text-ink-500 mr-2">#{i + 1}</span>
                  {w.title}
                </span>
                <span className="text-xs text-ink-500 shrink-0">
                  正确率 {pct(w.rate, 0)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      {/* 学生明细 */}
      <Card title={`学生明细（${rows.length}）`}>
        {rows.length === 0 ? (
          <div className="py-6 text-center text-xs text-ink-500">暂无提交</div>
        ) : (
          <table className="lf-table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>学生</th>
                <th className="w-24">得分</th>
                <th className="w-24">正确率</th>
                <th className="w-24">用时</th>
                <th className="w-32">提交时间</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.sub.id}>
                  <td className="text-ink-500">{i + 1}</td>
                  <td>
                    <Link
                      to={`/teacher/student/${r.sub.studentId}`}
                      className="text-ink-900 hover:text-brand-text hover:underline"
                    >
                      {r.student?.name ?? r.sub.studentId}
                    </Link>
                  </td>
                  <td>
                    <span className="text-ink-900 font-medium">
                      {r.sub.score ?? 0}
                    </span>
                    <span className="text-xs text-ink-500"> / {node.totalScore ?? 0}</span>
                  </td>
                  <td>{pct(r.sub.correctRate ?? 0, 0)}</td>
                  <td className="text-xs text-ink-500">
                    {fmtDuration(r.sub.durationSec)}
                  </td>
                  <td className="text-xs text-ink-500">
                    {fmtDateTime(r.sub.submittedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* —— 简答题批改 —— */}
      <ShortAnswerGrading node={node} subs={subs} students={students} />

      {unsubmitted.length > 0 && (
        <Card title={`未提交学生（${unsubmitted.length}）`}>
          <ul className="flex flex-wrap gap-1.5">
            {unsubmitted.map((s) => (
              <li key={s.id} className="lf-tag">{s.name}</li>
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}

/* ============================================================
 * 简答题批改区
 * 列出所有简答题题目 + 每个学生的回答，支持手动评分
 * ============================================================ */
function ShortAnswerGrading({
  node,
  subs,
  students,
}: {
  node: AssessmentNode
  subs: StudentSubmission[]
  students: Student[]
}) {
  const [tick, setTick] = useState(0)
  const questions = (node.questions ?? []).filter((q) => q.type === 'shortAnswer')
  if (questions.length === 0) return null

  return (
    <Card
      title={`简答题批改（${questions.length} 题）`}
      extra={
        <span className="text-[11px] text-ink-500">
          自动判分不可靠，请教师人工评阅
        </span>
      }
    >
      <div className="space-y-5">
        {questions.map((q, qi) => {
          const fullScore = q.score ?? 0
          // 找到所有回答了这道题的学生
          const rows = subs
            .map((s) => {
              const a = s.answers.find((x) => x.questionId === q.id)
              if (!a || a.value.type !== 'shortAnswer') return null
              const text = a.value.text.trim()
              if (!text) return null
              const stu = students.find((x) => x.id === s.studentId)
              return { sub: s, ans: a, text, student: stu }
            })
            .filter(Boolean) as Array<{
              sub: StudentSubmission
              ans: StudentSubmission['answers'][number]
              text: string
              student?: Student
            }>

          const gradedCount = rows.filter((r) => r.sub.status === 'graded' || (r.ans.score ?? 0) > 0).length

          return (
            <div key={q.id} className="border border-ink-200 rounded p-4">
              <div className="flex items-center gap-2 text-xs text-ink-500 mb-2">
                <span>第 {qi + 1} 题</span>
                <Tag>{QUESTION_TYPE_LABEL[q.type]}</Tag>
                {q.score != null && <Tag>{q.score} 分</Tag>}
                <span className="ml-auto">
                  已评 {gradedCount} / {rows.length}
                </span>
              </div>
              <h4 className="text-sm text-ink-900 mb-2">{q.title}</h4>

              {(q as any).answer && (
                <div className="px-3 py-2 bg-brand-softer border border-brand-soft rounded text-xs text-ink-700 mb-3">
                  <div className="font-medium text-brand-text mb-1">📖 参考答案</div>
                  <div className="leading-relaxed">{(q as any).answer}</div>
                </div>
              )}

              {rows.length === 0 ? (
                <div className="text-xs text-ink-500 py-2">暂无回答</div>
              ) : (
                <ul className="space-y-2">
                  {rows.map((r) => (
                    <GradeRow
                      key={r.sub.id}
                      studentId={r.sub.studentId}
                      studentName={r.student?.name ?? r.sub.studentId}
                      text={r.text}
                      fullScore={fullScore}
                      currentScore={r.ans.score ?? 0}
                      currentCorrect={!!r.ans.correct}
                      onGrade={(score, correct) => {
                        gradeQuestionAnswer(r.sub.id, q.id, { score, correct })
                        setTick((x) => x + 1)
                      }}
                    />
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function GradeRow({
  studentId,
  studentName,
  text,
  fullScore,
  currentScore,
  currentCorrect,
  onGrade,
}: {
  studentId: string
  studentName: string
  text: string
  fullScore: number
  currentScore: number
  currentCorrect: boolean
  onGrade: (score: number, correct: boolean) => void
}) {
  const [score, setScore] = useState(currentScore)
  const [comment, setComment] = useState('')
  const dirty = score !== currentScore

  return (
    <li className="border border-ink-200 rounded p-3">
      <div className="flex items-start gap-3">
        <Link
          to={`/teacher/student/${studentId}`}
          className="text-[11px] text-ink-500 hover:text-brand-text hover:underline w-16 shrink-0 pt-1"
        >
          {studentName}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-ink-900 leading-relaxed whitespace-pre-wrap">
            {text}
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Input
            type="number"
            min={0}
            max={fullScore}
            value={score}
            onChange={(e) =>
              setScore(Math.max(0, Math.min(fullScore, Number(e.target.value) || 0)))
            }
            className="!h-8 !w-20 text-center"
          />
          <span className="text-xs text-ink-500">/ {fullScore}</span>
          <Button
            variant={dirty ? 'primary' : 'secondary'}
            onClick={() => onGrade(score, score >= fullScore * 0.6)}
            disabled={!dirty}
            className="!h-8 !px-3 text-xs"
          >
            {dirty ? '保存' : currentScore > 0 ? '已评' : '未评'}
          </Button>
        </div>
      </div>
    </li>
  )
}
function AIPracticeNodeReport({
  subs,
  students,
  unsubmitted,
}: {
  subs: StudentSubmission[]
  students: Student[]
  unsubmitted: Student[]
}) {
  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <StatNumber label="参与人数" value={subs.length} />
        <StatNumber
          label="未参与"
          value={unsubmitted.length}
          hint={
            unsubmitted.length > 0
              ? unsubmitted.slice(0, 3).map((u) => u.name).join('、')
              : '全员已参与'
          }
        />
        <StatNumber
          label="参与率"
          value={pct(students.length === 0 ? 0 : subs.length / students.length, 0)}
        />
      </div>

      <Card title="参与记录">
        {subs.length === 0 ? (
          <div className="py-6 text-center text-xs text-ink-500">
            还没有学生参与本互动
          </div>
        ) : (
          <ul className="divide-y divide-ink-100">
            {subs.map((s) => {
              const stu = students.find((x) => x.id === s.studentId)
              return (
                <li
                  key={s.id}
                  className="py-2.5 flex items-center justify-between"
                >
                  <Link
                    to={`/teacher/student/${s.studentId}`}
                    className="text-sm text-ink-900 hover:text-brand-text hover:underline"
                  >
                    {stu?.name ?? s.studentId}
                  </Link>
                  <span className="text-xs text-ink-500">
                    {fmtDateTime(s.submittedAt)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </>
  )
}

function QuestionHeader({ index, q }: { index: number; q: any }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-ink-500 mb-1">
        <span>第 {index + 1} 题</span>
        <Tag className="!text-[10px]">
          {(QUESTION_TYPE_LABEL as any)[q.type]}
        </Tag>
        {q.required && <Tag variant="brand" className="!text-[10px]">必答</Tag>}
      </div>
      <h4 className="text-sm text-ink-900">{q.title}</h4>
    </div>
  )}

