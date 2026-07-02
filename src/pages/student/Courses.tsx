import { useMemo, useState } from 'react'
import { CourseTile } from '@/components/CourseTile'
import { CURRENT_STUDENT_ID } from '@/mock'
import { getCourses, getCourseProgressRate } from '@/store'

/**
 * 学生端 - 课程
 * 按学段切换 + 名字为主的课程卡。去掉成人化的多重筛选，保持简单。
 */

const STAGE_TABS = [
  { key: 'all',     label: '全部' },
  { key: 'primary', label: '小学' },
  { key: 'junior',  label: '初中' },
  { key: 'senior',  label: '高中' },
  { key: 'tool',    label: 'AI 工具' },
] as const
type StageKey = (typeof STAGE_TABS)[number]['key']

export function StudentCourses() {
  const courses = useMemo(
    () => getCourses().filter((c) => c.status === 'published'),
    [],
  )
  const enriched = useMemo(
    () =>
      courses.map((c) => ({
        course: c,
        rate: getCourseProgressRate(CURRENT_STUDENT_ID, c.id),
      })),
    [courses],
  )

  const [stage, setStage] = useState<StageKey>('all')
  const filtered = enriched.filter((x) =>
    stage === 'all' ? true : x.course.stage === stage,
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">课程</h1>
        <p className="text-sm text-ink-500 mt-1">挑一门喜欢的课，点开就能学</p>
      </div>

      {/* 学段切换 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {STAGE_TABS.map((t) => {
          const active = stage === t.key
          return (
            <button
              key={t.key}
              onClick={() => setStage(t.key)}
              className={
                'px-4 h-10 text-sm rounded-full transition border ' +
                (active
                  ? 'bg-indigo-500 text-white font-medium border-transparent shadow-sm'
                  : 'bg-white text-ink-600 border-ink-200 hover:border-indigo-200')
              }
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* 课程网格 */}
      {filtered.length === 0 ? (
        <div className="kid-card p-12 text-center">
          <div className="text-sm text-ink-500">这个分类暂时还没有课程</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map(({ course, rate }) => (
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
    </div>
  )
}
