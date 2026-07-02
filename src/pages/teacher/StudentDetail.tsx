import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Card, ProgressBar, Tag, Button } from '@/components/ui'
import { CourseCover } from '@/components/CourseCover'
import { QuestionRenderer } from '@/components/question'
import {
  getActivities,
  getClasses,
  getCourseProgressRate,
  getCourses,
  getNodeSubmissions,
  getRecentStudyByStudent,
  getStudents,
} from '@/store'
import {
  diagnoseStudent,
  fmtDateTime,
  fmtDuration,
  pct,
} from '@/utils'
import { QUESTION_TYPE_LABEL } from '@/types'

/**
 * 教师端 - 单个学生学情详情
 *
 * 路径：/teacher/student/:studentId
 *
 * 内容：
 *  - 学生基本信息
 *  - 4 张数据卡：完成测评 / 平均分 / 平均正确率 / 错题数
 *  - 维度掌握 + 学习建议
 *  - 课程进度（每门课的完成度）
 *  - 测评成绩列表（带跳到节点报告）
 *  - 错题摘要（最近 5 题）
 */
export function TeacherStudentDetail() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const [showAllCourses, setShowAllCourses] = useState(false)

  const students = getStudents()
  const classes = getClasses()
  const courses = getCourses()
  const activities = getActivities()
  const subs = getNodeSubmissions()

  const student = students.find((s) => s.id === studentId)
  const cls = student ? classes.find((c) => c.id === student.classId) : undefined

  const diag = useMemo(
    () => (studentId ? diagnoseStudent(studentId, subs, courses, activities) : null),
    [studentId, subs, courses, activities],
  )

  // 课程进度
  const courseProgress = useMemo(
    () =>
      studentId
        ? courses.map((c) => ({
            course: c,
            rate: getCourseProgressRate(studentId, c.id),
          }))
        : [],
    [studentId, courses],
  )

  // 该学生的测评提交（按时间倒序）
  const assessSubs = useMemo(() => {
    if (!studentId) return []
    return subs
      .filter((s) => s.studentId === studentId)
      .filter((s) => {
        const a = activities.find((x) => x.id === s.activityId)
        return a?.type === 'assessment'
      })
      .sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt))
  }, [studentId, subs, activities])

  // 学习足迹
  const trace = studentId ? getRecentStudyByStudent(studentId).slice(0, 5) : []

  if (!student || !diag) {
    return (
      <Card>
        <div className="py-12 text-center text-sm text-ink-500">
          学生不存在
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {/* 返回 */}
      <button
        onClick={() => navigate('/teacher/students')}
        className="text-xs text-ink-500 hover:text-ink-900"
      >
        ← 返回学生列表
      </button>

      {/* —— 学生头部 —— */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-soft border border-brand text-brand-text flex items-center justify-center text-2xl font-medium">
            {student.name.slice(0, 1)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-medium text-ink-900">{student.name}</h1>
              <Tag>{cls?.name ?? '—'}</Tag>
              {student.studentNo && (
                <Tag className="!text-[10px]">学号 #{student.studentNo}</Tag>
              )}
            </div>
            <div className="text-xs text-ink-500">
              完成 {diag.assessmentCount} 次测评 · 错题 {diag.wrongList.length} 道 ·
              平均正确率 {pct(diag.avgCorrectRate, 0)}
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <Link to="/teacher/data?tab=class" className="lf-btn-secondary">
              查看班级
            </Link>
          </div>
        </div>
      </Card>

      {/* —— 数据卡 —— */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="完成测评" value={diag.assessmentCount} hint="累计参与次数" />
        <StatCard label="平均得分" value={diag.avgScore} hint="所有测评平均" />
        <StatCard label="平均正确率" value={pct(diag.avgCorrectRate, 0)} hint="0 ~ 100%" />
        <StatCard
          label="错题"
          value={diag.wrongList.length}
          hint={
            diag.wrongList[0]?.question?.title
              ? `最近：${diag.wrongList[0].question.title.slice(0, 14)}${diag.wrongList[0].question.title.length > 14 ? '…' : ''}`
              : '暂无错题'
          }
        />
      </div>

      {/* —— 维度掌握 + 学习建议 —— */}
      {diag.dimensions.length > 0 && (
        <div className="grid grid-cols-5 gap-4">
          <Card title="能力地图" className="col-span-3">
            <ul className="space-y-3">
              {diag.dimensions.map((d) => (
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
          </Card>

          <Card title={`学习建议（${diag.advices.length}）`} className="col-span-2">
            {diag.advices.length === 0 ? (
              <div className="py-6 text-center text-xs text-ink-500">
                🎉 各维度掌握良好
              </div>
            ) : (
              <ul className="space-y-3">
                {diag.advices.slice(0, 3).map((a, i) => (
                  <li
                    key={i}
                    className="px-3 py-2.5 border border-amber-100 bg-amber-50/40 rounded text-xs"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Tag className="!bg-amber-100 !text-amber-700 !border-amber-200 !text-[10px]">
                        薄弱 {pct(a.rate, 0)}
                      </Tag>
                      <span className="text-ink-900 font-medium">{a.dimensionName}</span>
                    </div>
                    <div className="text-ink-700 leading-relaxed">{a.message}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {/* —— 课程进度 —— */}
      <Card title={`课程进度（${courseProgress.length}）`}>
        <div className="grid grid-cols-3 gap-3">
          {courseProgress.slice(0, showAllCourses ? undefined : 6).map(({ course, rate }) => (
            <div
              key={course.id}
              className="flex items-center gap-3 border border-ink-200 rounded p-3"
            >
              <div className="w-10 shrink-0">
                <CourseCover courseId={course.id} title={course.title} height="xs" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-ink-900 truncate mb-1">{course.title}</div>
                <div className="flex items-center gap-2">
                  <ProgressBar value={rate} className="flex-1" height={4} />
                  <span className="text-[11px] text-ink-500 w-10 text-right">
                    {pct(rate, 0)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {courseProgress.length > 6 && (
          <div className="mt-3 text-center">
            <button
              onClick={() => setShowAllCourses(!showAllCourses)}
              className="text-xs text-brand-text hover:text-brand-600 transition"
            >
              {showAllCourses ? '收起 ↑' : `展开更多（${courseProgress.length - 6}）↓`}
            </button>
          </div>
        )}
      </Card>

      {/* —— 测评成绩 + 错题摘要 —— */}
      <div className="grid grid-cols-3 gap-4">
        <Card title={`测评成绩（${assessSubs.length}）`} className="col-span-2">
          {assessSubs.length === 0 ? (
            <div className="py-6 text-center text-xs text-ink-500">
              该学生还没有完成任何测评
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {assessSubs.slice(0, 8).map((sub) => {
                const act = activities.find((a) => a.id === sub.activityId)
                if (!act) return null

                // 找节点上下文
                let courseId = ''
                let courseTitle = ''
                let lessonTitle = ''
                let nodeTitle = ''
                for (const c of courses) {
                  for (const l of c.lessons) {
                    const n = l.nodes.find((x) => x.id === sub.lessonNodeId)
                    if (n) {
                      courseId = c.id
                      courseTitle = c.title
                      lessonTitle = l.title
                      nodeTitle = n.title
                      break
                    }
                  }
                }
                const fullScore = act.scoringRule?.totalScore ?? 0
                return (
                  <li
                    key={sub.id}
                    className="py-2.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[11px] text-ink-500 mb-1">
                        <Tag variant="brand" className="!text-[10px]">测评</Tag>
                        <span>{fmtDateTime(sub.submittedAt)}</span>
                        {sub.durationSec != null && (
                          <span>· {fmtDuration(sub.durationSec)}</span>
                        )}
                      </div>
                      <div className="text-sm text-ink-900 truncate">
                        {nodeTitle}
                        <span className="text-xs text-ink-500 ml-2">
                          《{courseTitle}》· {lessonTitle}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div>
                        <span className="text-base font-medium text-brand-text">
                          {sub.score ?? 0}
                        </span>
                        <span className="text-xs text-ink-500"> / {fullScore}</span>
                      </div>
                      <div className="text-[11px] text-ink-500">
                        正确率 {pct(sub.correctRate ?? 0, 0)}
                      </div>
                      {courseId && (
                        <Link
                          to={`/teacher/course/${courseId}/report`}
                          className="text-[11px] text-brand-text hover:underline"
                        >
                          数据 →
                        </Link>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card title={`错题摘要（${diag.wrongList.length}）`}>
          {diag.wrongList.length === 0 ? (
            <div className="py-6 text-center text-xs text-ink-500">🎉 暂无错题</div>
          ) : (
            <ul className="space-y-2">
              {diag.wrongList.slice(0, 5).map((w) => (
                <li
                  key={`${w.submissionId}-${w.question?.id || 'unknown'}`}
                  className="px-3 py-2 border border-ink-200 rounded text-xs"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="!text-[10px]">
                      {(QUESTION_TYPE_LABEL as any)[w.question?.type] || '未知'}
                    </Tag>
                    {w.question?.score != null && (
                      <Tag className="!text-[10px]">{w.question.score} 分</Tag>
                    )}
                    <span className="ml-auto text-red-600">
                      得 {w.studentAnswer?.score ?? 0} 分
                    </span>
                  </div>
                  <div className="text-ink-900 truncate" title={w.question?.title || '未命名题目'}>
                    {w.question?.title || '未命名题目'}
                  </div>
                  <div className="text-[10px] text-ink-500 mt-1 truncate">
                    《{w.courseTitle}》· {w.lessonTitle}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: number | string
  hint?: string
}) {
  return (
    <div className="lf-card !p-4">
      <div className="text-xs text-ink-500 mb-1">{label}</div>
      <div className="text-2xl font-medium text-ink-900 leading-none">{value}</div>
      {hint && <div className="text-xs text-ink-500 mt-2 truncate">{hint}</div>}
    </div>
  )
}
