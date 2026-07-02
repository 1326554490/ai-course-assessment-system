import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, ProgressBar, Tag, StatNumber } from '@/components/ui'
import {
  getActivities,
  getClasses,
  getCourses,
  getNodeSubmissions,
  getStudents,
} from '@/store'
import { fmtDateTime, pct } from '@/utils'
import { QUESTION_TYPE_LABEL } from '@/types'
import type { Activity, Question, StudentSubmission } from '@/types'

/**
 * 教师端 - 班级学习分析
 *
 * 跨课程、跨节点聚合，回答四个问题：
 *  1. 班级整体表现如何（参与 / 完成率 / 平均分）
 *  2. 学生在哪个维度上最薄弱（维度热力）
 *  3. 哪些题目错得最多（共性错题）
 *  4. 哪些学生需要重点关注（学生分布）
 */
export function TeacherAnalytics() {
  const courses = useMemo(() => getCourses(), [])
  const activities = useMemo(() => getActivities(), [])
  const allSubs = useMemo(() => getNodeSubmissions(), [])
  const students = useMemo(() => getStudents(), [])
  const classes = useMemo(() => getClasses(), [])

  const [classId, setClassId] = useState<string>(classes[0]?.id ?? '')
  const [courseId, setCourseId] = useState<string>('all')

  // 当前班级学生
  const classStudents = students.filter((s) => s.classId === classId)
  const classStudentIds = new Set(classStudents.map((s) => s.id))

  // 当前课程范围
  const scopeCourses =
    courseId === 'all' ? courses : courses.filter((c) => c.id === courseId)

  // 当前 scope 内的所有 Activity 节点
  const scopeActIds = new Set<string>()
  const scopeNodeIds = new Set<string>()
  scopeCourses.forEach((c) => {
    c.lessons.forEach((l) => {
      l.nodes.forEach((n) => {
        if (n.activityId) {
          scopeActIds.add(n.activityId)
          scopeNodeIds.add(n.id)
        }
      })
    })
  })

  // 当前 scope 内的提交
  const subs = allSubs.filter(
    (s) =>
      classStudentIds.has(s.studentId) && scopeActIds.has(s.activityId),
  )
  const assessSubs = subs.filter((s) =>
    activities.find((a) => a.id === s.activityId)?.type === 'assessment',
  )

  // 概览
  const totalScore = assessSubs.reduce((sum, s) => sum + (s.score ?? 0), 0)
  const avgScore =
    assessSubs.length === 0 ? 0 : Math.round(totalScore / assessSubs.length * 10) / 10
  const avgCorrectRate =
    assessSubs.length === 0
      ? 0
      : assessSubs.reduce((sum, s) => sum + (s.correctRate ?? 0), 0) / assessSubs.length

  // 完成率：班级人数 × scope 节点数 vs 实际提交数
  const expectedCount = classStudents.length * scopeNodeIds.size
  const submitKeys = new Set(subs.map((s) => `${s.studentId}-${s.lessonNodeId}`))
  const completionRate = expectedCount === 0 ? 0 : submitKeys.size / expectedCount

  // 维度热力（跨 activity 聚合）
  const dimMap = new Map<
    string,
    { name: string; earned: number; full: number; questionCount: number }
  >()
  assessSubs.forEach((sub) => {
    const act = activities.find((a) => a.id === sub.activityId)
    if (!act?.questions) return
    act.questions.forEach((q) => {
      const a = sub.answers.find((x) => x.questionId === q.id)
      if (!a) return
      ;(q.dimensions ?? []).forEach((dimId) => {
        const dimName = act.dimensions?.find((d) => d.id === dimId)?.name ?? dimId
        const cur = dimMap.get(dimId) ?? {
          name: dimName,
          earned: 0,
          full: 0,
          questionCount: 0,
        }
        cur.earned += a.score ?? 0
        cur.full += q.score ?? 0
        cur.questionCount += 1
        dimMap.set(dimId, cur)
      })
    })
  })
  const dimensions = Array.from(dimMap.entries())
    .map(([id, v]) => ({
      id,
      name: v.name,
      rate: v.full === 0 ? 0 : v.earned / v.full,
      earned: v.earned,
      full: v.full,
      questionCount: v.questionCount,
    }))
    .sort((a, b) => a.rate - b.rate)

  // 共性错题 Top10（跨 activity）
  type WrongRow = {
    question: Question
    activity: Activity
    wrongCount: number
    totalCount: number
    wrongRate: number
  }
  const wrongMap = new Map<string, WrongRow>()
  assessSubs.forEach((sub) => {
    const act = activities.find((a) => a.id === sub.activityId)
    if (!act?.questions) return
    act.questions.forEach((q) => {
      const a = sub.answers.find((x) => x.questionId === q.id)
      if (!a) return
      const cur = wrongMap.get(q.id) ?? {
        question: q,
        activity: act,
        wrongCount: 0,
        totalCount: 0,
        wrongRate: 0,
      }
      cur.totalCount += 1
      if (a.correct === false) cur.wrongCount += 1
      cur.wrongRate = cur.totalCount === 0 ? 0 : cur.wrongCount / cur.totalCount
      wrongMap.set(q.id, cur)
    })
  })
  const wrongList = Array.from(wrongMap.values())
    .filter((w) => w.totalCount >= 3 && w.wrongRate > 0)
    .sort((a, b) => b.wrongRate - a.wrongRate)
    .slice(0, 10)

  // 学生分布（按平均分分档）
  type StudentRow = {
    studentId: string
    name: string
    submitCount: number
    avgScore: number
    avgRate: number
  }
  const studentRows: StudentRow[] = classStudents.map((stu) => {
    const my = assessSubs.filter((s) => s.studentId === stu.id)
    const sumScore = my.reduce((sum, s) => sum + (s.score ?? 0), 0)
    const sumRate = my.reduce((sum, s) => sum + (s.correctRate ?? 0), 0)
    return {
      studentId: stu.id,
      name: stu.name,
      submitCount: my.length,
      avgScore: my.length === 0 ? 0 : Math.round((sumScore / my.length) * 10) / 10,
      avgRate: my.length === 0 ? 0 : sumRate / my.length,
    }
  })
  // 按正确率分档
  const buckets = [
    { label: '优秀（≥90%）',   min: 0.9, max: 1.01, color: 'bg-brand text-white' },
    { label: '良好（70-90%）', min: 0.7, max: 0.9,  color: 'bg-brand-soft text-brand-text' },
    { label: '及格（60-70%）', min: 0.6, max: 0.7,  color: 'bg-amber-100 text-amber-700' },
    { label: '需关注（<60%）', min: 0,   max: 0.6,  color: 'bg-red-50 text-red-600' },
  ]
  const distribution = buckets.map((b) => ({
    ...b,
    students: studentRows.filter(
      (r) => r.submitCount > 0 && r.avgRate >= b.min && r.avgRate < b.max,
    ),
  }))
  const notStarted = studentRows.filter((r) => r.submitCount === 0)

  return (
    <div className="space-y-5">
      {/* 筛选 */}
      <Card className="!p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-500">班级</span>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="h-8 border border-ink-200 rounded px-2 text-xs bg-white"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-500">课程</span>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="h-8 border border-ink-200 rounded px-2 text-xs bg-white"
            >
              <option value="all">全部课程</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-ink-500">
              范围：{classStudents.length} 名学生 · {scopeNodeIds.size} 个互动节点
            </span>
            <Link
              to="/teacher/students"
              className="text-xs text-brand-text hover:underline flex items-center gap-1"
            >
              查看学生详情 →
            </Link>
          </div>
        </div>
      </Card>

      {/* 概览 */}
      <div className="grid grid-cols-4 gap-4">
        <StatNumber label="参与学生" value={`${new Set(subs.map((s) => s.studentId)).size} / ${classStudents.length}`} hint="至少完成 1 个互动" />
        <StatNumber label="完成率"   value={pct(completionRate, 0)} hint={`累计 ${subs.length} 次提交`} />
        <StatNumber label="平均分"   value={avgScore} hint={`${assessSubs.length} 次测评`} />
        <StatNumber label="平均正确率" value={pct(avgCorrectRate, 0)} hint="测评类聚合" />
      </div>

      {/* 维度热力 + 共性错题 */}
      <div className="grid grid-cols-2 gap-4">
        <Card title={`维度掌握（${dimensions.length}）`}>
          {dimensions.length === 0 ? (
            <div className="py-6 text-center text-xs text-ink-500">暂无测评数据</div>
          ) : (
            <ul className="space-y-3">
              {dimensions.map((d) => (
                <li key={d.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-ink-900">{d.name}</span>
                    <span className="text-ink-500">
                      {d.earned} / {d.full} · {pct(d.rate, 0)}
                    </span>
                  </div>
                  <ProgressBar value={d.rate} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={`共性错题 Top ${wrongList.length}`}>
          {wrongList.length === 0 ? (
            <div className="py-6 text-center text-xs text-ink-500">
              当前范围内无错题
            </div>
          ) : (
            <ul className="space-y-2">
              {wrongList.map((w, i) => (
                <li
                  key={w.question.id}
                  className="flex items-start gap-3 px-3 py-2 border border-ink-200 rounded"
                >
                  <span className="text-xs text-ink-500 w-6 shrink-0 mt-0.5">
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-ink-500 mb-1">
                      <Tag className="!text-[10px]">
                        {QUESTION_TYPE_LABEL[w.question.type]}
                      </Tag>
                      <span className="truncate">{w.activity.title}</span>
                    </div>
                    <div className="text-sm text-ink-900 truncate">
                      {w.question.title}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm text-red-600 font-medium">
                      {pct(w.wrongRate, 0)}
                    </div>
                    <div className="text-[11px] text-ink-500">
                      {w.wrongCount}/{w.totalCount} 错
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* 学生分布 */}
      <Card title="学生分布">
        <div className="grid grid-cols-4 gap-3 mb-4">
          {distribution.map((b, i) => (
            <div
              key={i}
              className="border border-ink-200 rounded p-3"
            >
              <div className={`inline-block px-2 py-0.5 rounded text-[11px] ${b.color}`}>
                {b.label}
              </div>
              <div className="mt-2 text-2xl font-medium text-ink-900">
                {b.students.length}
              </div>
              <div className="text-[11px] text-ink-500 mt-1">
                {b.students.length === 0
                  ? '—'
                  : b.students
                      .slice(0, 4)
                      .map((s) => s.name)
                      .join('、') +
                    (b.students.length > 4 ? '…' : '')}
              </div>
            </div>
          ))}
        </div>

        {notStarted.length > 0 && (
          <div className="text-xs text-ink-500 px-3 py-2 bg-ink-50 rounded border border-ink-200">
            <span className="text-ink-700 font-medium">{notStarted.length} 名未参与：</span>{' '}
            {notStarted.map((s) => s.name).join('、')}
          </div>
        )}
      </Card>
    </div>
  )
}
