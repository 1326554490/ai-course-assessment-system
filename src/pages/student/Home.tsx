import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CourseTile } from '@/components/CourseTile'
import { Icon } from '@/components/ui'
import { CURRENT_STUDENT_ID } from '@/mock'
import {
  getCourseProgressRate,
  getCourses,
  getLastStudyInCourse,
  getStudents,
} from '@/store'
import type { Course } from '@/types'

/**
 * 学生端首页 = 课堂总览
 *
 * 重构目标（面向小学生）：
 *  1. 一进来就看到"继续上次"的大入口（如果有）
 *  2. 按学段切换，下面是名字为主的清爽课程卡（去掉花哨海报）
 *  3. 不用成人化术语（诊断/维度/正确率），改成"学了几节课""答对了几题"
 */

const STAGE_TABS = [
  { key: 'primary', label: '小学' },
  { key: 'junior',  label: '初中' },
  { key: 'senior',  label: '高中' },
  { key: 'tool',    label: 'AI 工具' },
] as const
type StageKey = (typeof STAGE_TABS)[number]['key']

export function StudentHome() {
  const navigate = useNavigate()
  const me = getStudents().find((s) => s.id === CURRENT_STUDENT_ID)
  const courses = useMemo(
    () => getCourses().filter((c) => c.status === 'published'),
    [],
  )

  const enriched = useMemo(
    () =>
      courses.map((c) => ({
        course: c,
        rate: getCourseProgressRate(CURRENT_STUDENT_ID, c.id),
        last: getLastStudyInCourse(CURRENT_STUDENT_ID, c.id),
      })),
    [courses],
  )

  // 默认学段：用学生自己课程里最多的那个学段，否则小学
  const defaultStage: StageKey = useMemo(() => {
    const counts: Record<string, number> = {}
    courses.forEach((c) => (counts[c.stage] = (counts[c.stage] ?? 0) + 1))
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
    return (top as StageKey) ?? 'primary'
  }, [courses])

  const [stage, setStage] = useState<StageKey>(defaultStage)

  // 继续上次：最近学过且没学完的一门
  const continueCard = useMemo(
    () =>
      [...enriched]
        .filter((x) => x.rate > 0 && x.rate < 1 && x.last)
        .sort(
          (a, b) =>
            +new Date(b.last!.lastStudyAt) - +new Date(a.last!.lastStudyAt),
        )[0],
    [enriched],
  )

  const stageCourses = enriched.filter((x) => x.course.stage === stage)
  const stageMeta = STAGE_TABS.find((t) => t.key === stage)!

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* —— 1. 欢迎 + 继续上次 —— */}
      <section>
        <h1 className="text-2xl font-bold text-ink-900 mb-4">
          你好，{me?.name ?? '同学'}
        </h1>

        {continueCard ? (
          <ContinueBanner data={continueCard} onJump={(u) => navigate(u)} />
        ) : (
          <div className="kid-card p-6">
            <div className="text-lg font-semibold text-ink-900">开始你的第一节课</div>
            <div className="text-sm text-ink-500 mt-1">
              从下面挑一门感兴趣的课程，点开就能学
            </div>
          </div>
        )}
      </section>

      {/* —— 2. 课堂总览：学段切换 + 课程卡 —— */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-ink-900">全部课程</h2>
          {/* 学段切换 */}
          <div className="flex items-center gap-1.5 bg-white rounded-full p-1 shadow-card border border-ink-100">
            {STAGE_TABS.map((t) => {
              const active = stage === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setStage(t.key)}
                  className={
                    'px-4 h-9 text-sm rounded-full transition ' +
                    (active
                      ? 'bg-indigo-500 text-white font-medium shadow-sm'
                      : 'text-ink-500 hover:bg-ink-50')
                  }
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        {stageCourses.length === 0 ? (
          <div className="kid-card p-12 text-center">
            <div className="text-sm text-ink-500">
              {stageMeta.label}阶段暂时还没有课程
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {stageCourses.map(({ course, rate }) => (
              <CourseTile
                key={course.id}
                courseId={course.id}
                title={course.title}
                gradeRange={course.gradeRange}
                lessonCount={course.lessons.length}
                rate={rate}
                to={`/student/course/${course.id}`}
                cta={rate >= 1 ? '再看看' : rate > 0 ? '继续学' : '开始学'}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

/* ============================================================
 * 继续上次横幅 —— 一个又大又明确的主入口
 * ============================================================ */
function ContinueBanner({
  data,
  onJump,
}: {
  data: { course: Course; rate: number; last: ReturnType<typeof getLastStudyInCourse> }
  onJump: (url: string) => void
}) {
  const { course, rate, last } = data
  const lesson = course.lessons.find((l) => l.id === last?.lessonId)
  const node = lesson?.nodes.find((n) => n.id === (last as any)?.nodeId)

  // 如果找不到 lesson，回退到第一课节；如果课程没有课节，跳到课程详情页
  const url = lesson
    ? `/student/course/${course.id}/lesson/${lesson.id}`
    : course.lessons.length > 0
    ? `/student/course/${course.id}/lesson/${course.lessons[0].id}`
    : `/student/course/${course.id}`
  const pctRound = Math.round(rate * 100)

  return (
    <div className="rounded-3xl bg-indigo-500 text-white shadow-lg overflow-hidden">
      <div className="p-6 sm:p-7 flex items-center gap-5">
        <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-white/20 items-center justify-center shrink-0">
          <Icon name="book" className="w-8 h-8" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-white/80 mb-1">继续上次学习</div>
          <div className="text-xl font-bold truncate">{course.title}</div>
          <div className="text-sm text-white/80 mt-1 truncate">
            学到：{lesson?.title}
            {node ? ` · ${node.title}` : ''}
          </div>
          {/* 进度条 */}
          <div className="mt-3 flex items-center gap-3 max-w-md">
            <div className="flex-1 h-2.5 rounded-full bg-white/25 overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${Math.max(4, pctRound)}%` }}
              />
            </div>
            <span className="text-sm text-white/90 w-10 text-right">{pctRound}%</span>
          </div>
        </div>
        <button
          onClick={() => onJump(url)}
          className="shrink-0 inline-flex items-center gap-1.5 px-5 sm:px-6 h-12 rounded-full bg-white text-indigo-700 font-semibold text-base shadow-sm hover:bg-indigo-50 transition active:scale-95"
        >
          继续学 →
        </button>
      </div>
    </div>
  )
}
