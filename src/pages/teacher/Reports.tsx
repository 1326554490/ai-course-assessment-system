import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Tag } from '@/components/ui'
import { CourseCover } from '@/components/CourseCover'
import {
  getCourses,
  getNodeSubmissions,
  getStudents,
} from '@/store'
import { fmtDateTime, pct } from '@/utils'
import { MOCK_ACTIVITIES } from '@/mock/courses'
import type { Activity } from '@/types'

/**
 * 数据报告中心
 *
 * 新结构：报告以"课程 + 节点"为入口；按 Activity 类型分组：
 *   - 问卷活动（survey）
 *   - 测评活动（assessment）
 *   - AI 互动（aiPractice）
 *
 * 点击任一行进入该课程的 CourseReport 页（节点级详情）
 */
export function TeacherReports() {
  const courses = getCourses()
  const subs = getNodeSubmissions()
  const studentTotal = getStudents().length

  // 折叠状态：三个分组默认折叠
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    survey: false,
    assessment: false,
    aiPractice: false,
  })

  function toggle(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // 把所有 Activity 按 (course, lesson, node) 反查上下文
  type Row = {
    activity: Activity
    courseId: string
    courseTitle: string
    lessonTitle: string
    nodeTitle: string
    submitted: number
    completionRate: number
    avgScore?: number
    fullScore?: number
    updatedAt: string
  }
  const rows: Row[] = []
  courses.forEach((c) => {
    c.lessons.forEach((l) => {
      l.nodes.forEach((n) => {
        if (!n.activityId) return
        const activity = MOCK_ACTIVITIES.find((a) => a.id === n.activityId)
        if (!activity) return
        const aSubs = subs.filter((s) => s.activityId === activity.id)
        const ssIds = new Set(aSubs.map((s) => s.studentId))
        const completionRate = studentTotal === 0 ? 0 : ssIds.size / studentTotal

        let avgScore: number | undefined
        let fullScore: number | undefined
        if (activity.type === 'assessment' && activity.scoringRule) {
          fullScore = activity.scoringRule.totalScore
          if (aSubs.length > 0) {
            const avg = aSubs.reduce((sum, x) => sum + (x.score ?? 0), 0) / aSubs.length
            avgScore = Math.round(avg * 10) / 10
          }
        }

        rows.push({
          activity,
          courseId: c.id,
          courseTitle: c.title,
          lessonTitle: l.title,
          nodeTitle: n.title,
          submitted: ssIds.size,
          completionRate,
          avgScore,
          fullScore,
          updatedAt: c.updatedAt,
        })
      })
    })
  })

  const surveyRows = rows.filter((r) => r.activity.type === 'survey')
  const assessmentRows = rows.filter((r) => r.activity.type === 'assessment')
  const practiceRows = rows.filter((r) => r.activity.type === 'aiPractice')

  return (
    <div className="space-y-6">
      <ReportTable
        title="问卷报告"
        emptyText="暂无问卷活动"
        rows={surveyRows}
        showScore={false}
        expanded={expanded.survey}
        onToggle={() => toggle('survey')}
      />
      <ReportTable
        title="测评报告"
        emptyText="暂无测评活动"
        rows={assessmentRows}
        showScore
        expanded={expanded.assessment}
        onToggle={() => toggle('assessment')}
      />
      <ReportTable
        title="AI 互动数据"
        emptyText="暂无 AI 互动活动"
        rows={practiceRows}
        showScore={false}
        expanded={expanded.aiPractice}
        onToggle={() => toggle('aiPractice')}
      />
    </div>
  )
}

/* ============================================================
 * 单个报告分组的表格
 * ============================================================ */
function ReportTable({
  title,
  emptyText,
  rows,
  showScore,
  expanded,
  onToggle,
}: {
  title: string
  emptyText: string
  rows: {
    activity: Activity
    courseId: string
    courseTitle: string
    lessonTitle: string
    nodeTitle: string
    submitted: number
    completionRate: number
    avgScore?: number
    fullScore?: number
    updatedAt: string
  }[]
  showScore: boolean
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <Card>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-ink-50 transition text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink-900">{title}</span>
          <Tag variant="default" className="!text-[10px]">{rows.length}</Tag>
        </div>
        <span className="text-ink-400 text-sm">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <>
          {rows.length === 0 ? (
            <div className="text-xs text-ink-500 py-4 text-center border-t border-ink-100">{emptyText}</div>
          ) : (
        <table className="lf-table">
          <thead>
            <tr>
              <th className="w-[36%]">活动 / 课程</th>
              <th className="w-[14%]">所在课节</th>
              <th className="w-[10%]">提交</th>
              {showScore && <th className="w-[14%]">平均分</th>}
              <th className="w-[12%]">完成率</th>
              <th className="w-[10%]">更新时间</th>
              <th className="w-[8%] text-right"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.activity.id}>
                <td>
                  <div className="flex items-center gap-2 min-w-0">
                    <CourseCover
                      courseId={r.courseId}
                      title={r.courseTitle}
                      height="xs"
                      className="w-9 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-ink-900 truncate">
                        {r.activity.title}
                      </div>
                      <div className="text-[11px] text-ink-500 truncate">
                        《{r.courseTitle}》
                      </div>
                    </div>
                  </div>
                </td>
                <td className="text-xs text-ink-700">{r.lessonTitle}</td>
                <td>{r.submitted}</td>
                {showScore && (
                  <td>
                    {r.avgScore != null ? (
                      <>
                        <span className="text-ink-900 font-medium">
                          {r.avgScore}
                        </span>
                        <span className="text-xs text-ink-500"> / {r.fullScore}</span>
                      </>
                    ) : (
                      <span className="text-ink-500 text-xs">—</span>
                    )}
                  </td>
                )}
                <td>{pct(r.completionRate, 0)}</td>
                <td className="text-xs text-ink-500">
                  {fmtDateTime(r.updatedAt)}
                </td>
                <td className="text-right">
                  <Link
                    to={`/teacher/course/${r.courseId}/report`}
                    className="text-xs text-brand-text hover:underline"
                  >
                    查看报告
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          )}
        </>
      )}
    </Card>
  )
}
