import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, Icon, DonutChart, BarChart, HBar } from '@/components/ui'
import { TeacherReports } from './Reports'
import { TeacherAnalytics } from './Analytics'
import {
  getCourses,
  getActivities,
  getNodeSubmissions,
  getStudents,
  getClasses,
} from '@/store'
import { pct } from '@/utils'

/**
 * 教师端 - 学情数据
 * 路径：/teacher/data
 *
 * 结构：顶部「概览仪表盘」（指标卡 + 可视化，一眼掌握）→ 下方按需展开明细：
 *   - 活动数据（原 Reports）
 *   - 班级分析（原 Analytics）
 */

const TABS = [
  { key: 'overview', label: '概览', icon: 'chart' as const },
  { key: 'activity', label: '活动数据', icon: 'fileText' as const },
  { key: 'class', label: '班级分析', icon: 'users' as const },
]
type TabKey = (typeof TABS)[number]['key']

export function TeacherData() {
  const [params] = useSearchParams()
  const initialTab = (params.get('tab') as TabKey) || 'overview'
  const [tab, setTab] = useState<TabKey>(
    TABS.some((t) => t.key === initialTab) ? initialTab : 'overview',
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">学情数据</h2>
        <p className="text-sm text-ink-500 mt-1">课堂作答与班级学情，一目了然</p>
      </div>

      {/* Tab 切换 */}
      <div className="flex items-center gap-1 border-b border-ink-100">
        {TABS.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key as TabKey)}
              className={
                'px-4 h-10 text-sm border-b-2 -mb-px transition inline-flex items-center gap-1.5 ' +
                (active
                  ? 'border-brand text-brand-text font-medium'
                  : 'border-transparent text-ink-500 hover:text-ink-900')
              }
            >
              <Icon name={t.icon} className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'overview' && <Overview />}
      {tab === 'activity' && <TeacherReports />}
      {tab === 'class' && <TeacherAnalytics />}
    </div>
  )
}

/* ============================================================
 * 概览仪表盘
 * ============================================================ */
function Overview() {
  const stats = useMemo(() => computeOverview(), [])

  return (
    <div className="space-y-5">
      {/* 指标卡（融入原工作台统计） */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon="book" label="课程" value={stats.courseCount} hint={`${stats.lessonCount} 个课节`} />
        <MetricCard icon="fileText" label="互动活动" value={stats.activityCount} hint="问卷 / 测评 / 互动" />
        <MetricCard icon="send" label="累计提交" value={stats.submissionCount} hint={`${stats.activeStudents} 名学生参与`} />
        <MetricCard icon="check" label="平均分" value={stats.avgScore} hint={`正确率 ${pct(stats.avgCorrectRate, 0)}`} accent />
      </div>

      {/* 可视化区：完成率环形 + 成绩分布柱状 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 整体完成率 */}
        <Card title="整体完成率">
          <div className="flex items-center gap-5 py-2">
            <div className="text-brand">
              <DonutChart value={stats.completionRate} size={104} color="text-brand" track="text-ink-100">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-ink-900">{pct(stats.completionRate, 0)}</div>
                </div>
              </DonutChart>
            </div>
            <div className="text-xs text-ink-600 space-y-1.5">
              <div>应完成 <span className="font-medium text-ink-900">{stats.expectedCount}</span> 人次</div>
              <div>已提交 <span className="font-medium text-ink-900">{stats.submittedCount}</span> 人次</div>
              <div className="text-ink-400">按已发布课程的互动节点统计</div>
            </div>
          </div>
        </Card>

        {/* 成绩分布 */}
        <Card title="测评成绩分布" className="lg:col-span-2">
          {stats.scoreBuckets.every((b) => b.value === 0) ? (
            <div className="py-10 text-center text-xs text-ink-500">暂无测评提交数据</div>
          ) : (
            <BarChart
              data={stats.scoreBuckets}
              height={150}
            />
          )}
        </Card>
      </div>

      {/* 维度掌握 + 班级活跃 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="知识维度掌握">
          {stats.dimensions.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink-500">暂无维度数据</div>
          ) : (
            <ul className="space-y-3">
              {stats.dimensions.map((d) => (
                <li key={d.name}>
                  <HBar
                    label={d.name}
                    value={d.rate}
                    color={d.rate >= 0.8 ? 'bg-emerald-400' : d.rate >= 0.6 ? 'bg-brand' : 'bg-amber-400'}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="各班参与情况">
          {stats.classRows.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink-500">暂无班级数据</div>
          ) : (
            <ul className="space-y-3">
              {stats.classRows.map((c) => (
                <li key={c.name}>
                  <HBar
                    label={c.name}
                    value={c.rate}
                    hint={`${c.active}/${c.total} 人`}
                    color="bg-sky-400"
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: Parameters<typeof Icon>[0]['name']
  label: string
  value: number | string
  hint?: string
  accent?: boolean
}) {
  return (
    <Card className="!p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-ink-500">{label}</div>
          <div className={'text-2xl font-semibold mt-1 ' + (accent ? 'text-brand-text' : 'text-ink-900')}>
            {value}
          </div>
          {hint && <div className="text-[11px] text-ink-400 mt-1">{hint}</div>}
        </div>
        <div className={'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ' + (accent ? 'bg-brand-soft text-brand-text' : 'bg-ink-50 text-ink-500')}>
          <Icon name={icon} className="w-[18px] h-[18px]" />
        </div>
      </div>
    </Card>
  )
}

/* ============================================================
 * 概览数据计算（跨全部课程聚合）
 * ============================================================ */
function computeOverview() {
  const courses = getCourses()
  const activities = getActivities()
  const subs = getNodeSubmissions()
  const students = getStudents()
  const classes = getClasses()

  const published = courses.filter((c) => c.status === 'published')

  let lessonCount = 0
  const publishedInteractNodeIds: string[] = []
  courses.forEach((c) => {
    c.lessons.forEach((l) => {
      lessonCount++
      l.nodes.forEach((n) => {
        if (n.type !== 'content' && c.status === 'published') publishedInteractNodeIds.push(n.id)
      })
    })
  })

  // 完成率：已发布互动节点 × 学生数 为分母
  const studentTotal = students.length
  const expectedCount = publishedInteractNodeIds.length * studentTotal
  const submitKeys = new Set(subs.map((s) => `${s.studentId}-${s.lessonNodeId}`))
  const submittedCount = submitKeys.size
  const completionRate = expectedCount === 0 ? 0 : submittedCount / expectedCount

  // 测评聚合
  const assessSubs = subs.filter(
    (s) => activities.find((a) => a.id === s.activityId)?.type === 'assessment',
  )
  const avgScore =
    assessSubs.length === 0
      ? 0
      : Math.round((assessSubs.reduce((sum, s) => sum + (s.score ?? 0), 0) / assessSubs.length) * 10) / 10
  const avgCorrectRate =
    assessSubs.length === 0
      ? 0
      : assessSubs.reduce((sum, s) => sum + (s.correctRate ?? 0), 0) / assessSubs.length

  // 成绩分布（按正确率分档）
  const buckets = [
    { label: '优秀\n≥90', min: 0.9, color: 'bg-emerald-400', value: 0 },
    { label: '良好\n70-90', min: 0.7, color: 'bg-brand', value: 0 },
    { label: '及格\n60-70', min: 0.6, color: 'bg-sky-400', value: 0 },
    { label: '待提升\n<60', min: 0, color: 'bg-amber-400', value: 0 },
  ]
  assessSubs.forEach((s) => {
    const r = s.correctRate ?? 0
    const b = buckets.find((x) => r >= x.min)
    if (b) b.value++
  })
  const scoreBuckets = buckets.map((b) => ({ label: b.label, value: b.value, color: b.color }))

  // 维度掌握（跨 activity 聚合）
  const dimMap = new Map<string, { name: string; earned: number; full: number }>()
  assessSubs.forEach((sub) => {
    const act = activities.find((a) => a.id === sub.activityId)
    if (!act?.questions) return
    act.questions.forEach((q) => {
      const a = sub.answers.find((x) => x.questionId === q.id)
      if (!a) return
      ;(q.dimensions ?? []).forEach((dimId) => {
        const dimName = act.dimensions?.find((d) => d.id === dimId)?.name ?? dimId
        const cur = dimMap.get(dimId) ?? { name: dimName, earned: 0, full: 0 }
        cur.earned += a.score ?? 0
        cur.full += q.score ?? 0
        dimMap.set(dimId, cur)
      })
    })
  })
  const dimensions = Array.from(dimMap.values())
    .map((d) => ({ name: d.name, rate: d.full === 0 ? 0 : d.earned / d.full }))
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 6)

  // 各班参与率
  const classRows = classes.map((cls) => {
    const ids = new Set(cls.studentIds)
    const active = new Set(subs.filter((s) => ids.has(s.studentId)).map((s) => s.studentId)).size
    const total = cls.studentIds.length
    return { name: cls.name, active, total, rate: total === 0 ? 0 : active / total }
  })

  return {
    courseCount: courses.length,
    lessonCount,
    activityCount: activities.length,
    submissionCount: subs.length,
    activeStudents: new Set(subs.map((s) => s.studentId)).size,
    avgScore,
    avgCorrectRate,
    completionRate,
    expectedCount,
    submittedCount,
    scoreBuckets,
    dimensions,
    classRows,
    publishedCount: published.length,
  }
}
