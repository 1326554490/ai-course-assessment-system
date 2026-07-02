import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, Card, ProgressBar, Tag, Icon } from '@/components/ui'
import type { IconName } from '@/components/ui'
import { CourseCover } from '@/components/CourseCover'
import { CURRENT_STUDENT_ID, CURRENT_TEACHER } from '@/mock'
import {
  getActivities,
  getCourseById,
  getCourseProgressRate,
  getLastStudyInCourse,
  getNodeSubmission,
  getProgress,
} from '@/store'
import { fmtDateTime } from '@/utils'
import type { LessonNode, Lesson } from '@/types'

const NODE_TYPE_LABEL: Record<LessonNode['type'], string> = {
  content:    '图文',
  survey:     '问卷',
  assessment: '测评',
  aiPractice: 'AI 互动',
  feedback:   '反馈',
}
const NODE_TYPE_ICON: Record<LessonNode['type'], IconName> = {
  content:    'fileText',
  survey:     'clipboard',
  assessment: 'check',
  aiPractice: 'sparkles',
  feedback:   'message',
}

/**
 * 学生端 - 课程详情页
 *
 * 路径：/student/course/:courseId
 *
 * 展示：
 *  - 课程封面 + 标题 + 描述 + 年级 + 学时
 *  - 学习进度 + 继续学习按钮
 *  - 课节列表（每节包含节点缩略 + 完成度）
 *  - 老师 / 课程信息
 */
export function StudentCourseDetail() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const course = courseId ? getCourseById(courseId) : undefined
  const activities = getActivities()

  if (!course) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <div className="py-12 text-center text-sm text-ink-500">
            课程不存在
          </div>
        </Card>
      </div>
    )
  }

  const rate = getCourseProgressRate(CURRENT_STUDENT_ID, course.id)
  const last = getLastStudyInCourse(CURRENT_STUDENT_ID, course.id)

  // 统计每节课的完成度
  const lessonStats = useMemo(() => {
    return course.lessons
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((l) => {
        const prog = getProgress(CURRENT_STUDENT_ID, course.id, l.id)
        const completedSet = new Set(prog?.completedNodeIds ?? [])
        const completedCount = l.nodes.filter((n) => completedSet.has(n.id)).length
        return {
          lesson: l,
          completedCount,
          totalCount: l.nodes.length,
          rate: l.nodes.length === 0 ? 0 : completedCount / l.nodes.length,
          isCurrent: last?.lessonId === l.id,
        }
      })
  }, [course, last])

  // 课程总时长
  const totalDuration = course.lessons.reduce(
    (s, l) => s + (l.duration ?? 25),
    0,
  )

  // 统计节点类型
  let totalNodes = 0
  let interactNodes = 0
  course.lessons.forEach((l) =>
    l.nodes.forEach((n) => {
      totalNodes++
      if (n.type !== 'content' && n.type !== 'feedback') interactNodes++
    }),
  )

  // 继续学习目标 lesson
  const continueLesson = last?.lessonId
    ? course.lessons.find((l) => l.id === last.lessonId) ?? course.lessons[0]
    : course.lessons[0]

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/student/courses')}
        className="text-xs text-ink-500 hover:text-ink-900"
      >
        ← 返回课程列表
      </button>

      {/* —— 封面横幅 —— */}
      <Card className="!p-0 overflow-hidden">
        <div className="flex">
          {/* 封面 */}
          <div className="w-72 shrink-0">
            <CourseCover
              courseId={course.id}
              title={course.title}
              height="lg"
              className="!h-full"
            />
          </div>
          {/* 信息 */}
          <div className="flex-1 p-6">
            <div className="flex items-center gap-2 text-xs text-ink-500 mb-2">
              <Tag>{course.gradeRange}</Tag>
              <span>·</span>
              <span>{course.lessons.length} 课节</span>
              <span>·</span>
              <span>约 {totalDuration} 分钟</span>
              <span>·</span>
              <span>{interactNodes} 个互动节点</span>
            </div>

            <h1 className="text-2xl font-medium text-ink-900 mb-2">
              {course.title}
            </h1>
            {course.description && (
              <p className="text-sm text-ink-700 leading-relaxed mb-4">
                {course.description}
              </p>
            )}

            {/* 进度 */}
            <div className="mb-4 max-w-md">
              <div className="flex items-center justify-between text-xs text-ink-500 mb-1.5">
                <span>学习进度</span>
                <span>{Math.round(rate * 100)}%</span>
              </div>
              <ProgressBar value={rate} />
            </div>

            <div className="flex items-center gap-2">
              {continueLesson && (
                <Link
                  to={`/student/course/${course.id}/lesson/${continueLesson.id}`}
                  className="lf-btn-primary"
                >
                  {rate === 0 ? '开始学习' : rate >= 1 ? '复习课程' : '继续学习'} →
                </Link>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* —— 课节列表 —— */}
      <Card title={`课程目录（${course.lessons.length} 节）`}>
        <ol className="space-y-3">
          {lessonStats.map((stat, i) => (
            <LessonRow
              key={stat.lesson.id}
              index={i}
              courseId={course.id}
              {...stat}
            />
          ))}
        </ol>
      </Card>

      {/* —— 课程信息 —— */}
      <div className="grid grid-cols-3 gap-4">
        <Card title="课程信息">
          <ul className="text-xs space-y-2">
            <li className="flex justify-between">
              <span className="text-ink-500">年级</span>
              <span className="text-ink-900">{course.gradeRange}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-ink-500">课节数</span>
              <span className="text-ink-900">{course.lessons.length}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-ink-500">节点总数</span>
              <span className="text-ink-900">{totalNodes}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-ink-500">互动节点</span>
              <span className="text-ink-900">{interactNodes}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-ink-500">更新时间</span>
              <span className="text-ink-900">{fmtDateTime(course.updatedAt)}</span>
            </li>
          </ul>
        </Card>

        <Card title="授课老师">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-soft border border-brand text-brand-text flex items-center justify-center text-base font-medium">
              {CURRENT_TEACHER.name.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-ink-900">
                {CURRENT_TEACHER.name}
              </div>
              <div className="text-xs text-ink-500">{CURRENT_TEACHER.subject}</div>
            </div>
          </div>
        </Card>

        <Card title="学习建议">
          <ul className="text-xs space-y-2 text-ink-700 list-disc pl-4 marker:text-ink-300">
            <li>按顺序完成课节，知识层层递进</li>
            <li>内容节点先理解、再做测评</li>
            <li>测评出错没关系，看解析重做</li>
            <li>课后反馈是和老师沟通的入口</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}

/* ============================================================
 * 课节行
 * ============================================================ */
function LessonRow({
  index,
  courseId,
  lesson,
  completedCount,
  totalCount,
  rate,
  isCurrent,
}: {
  index: number
  courseId: string
  lesson: Lesson
  completedCount: number
  totalCount: number
  rate: number
  isCurrent: boolean
}) {
  const status =
    rate >= 1 ? 'done' : rate > 0 ? 'inProgress' : 'todo'
  const statusLabel: Record<typeof status, string> = {
    done:       '已学完',
    inProgress: '学习中',
    todo:       '未开始',
  }
  return (
    <li
      className={
        'border rounded p-4 transition ' +
        (isCurrent
          ? 'border-brand bg-brand-softer'
          : 'border-ink-200 hover:bg-ink-50')
      }
    >
      <div className="flex items-center gap-4">
        {/* 序号 */}
        <div
          className={
            'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ' +
            (rate >= 1
              ? 'bg-brand text-white'
              : isCurrent
                ? 'bg-white border border-brand text-brand-text'
                : 'bg-ink-100 text-ink-500')
          }
        >
          {rate >= 1 ? '✓' : index + 1}
        </div>

        {/* 主信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-ink-900 truncate">
              {lesson.title}
            </h4>
            <Tag
              variant={status === 'done' ? 'default' : status === 'inProgress' ? 'brand' : 'default'}
              className="!text-[10px]"
            >
              {statusLabel[status]}
            </Tag>
            {isCurrent && (
              <Tag variant="brand" className="!text-[10px]">上次学到</Tag>
            )}
          </div>
          {lesson.description && (
            <p className="text-xs text-ink-500 mb-2 line-clamp-1">
              {lesson.description}
            </p>
          )}

          {/* 节点类型分布 */}
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            {lesson.nodes.map((n) => (
              <span
                key={n.id}
                className="inline-flex items-center text-ink-400"
                title={`${NODE_TYPE_LABEL[n.type]}: ${n.title}`}
              >
                <Icon name={NODE_TYPE_ICON[n.type]} className="w-3.5 h-3.5" />
              </span>
            ))}
            <span className="text-[10px] text-ink-500 ml-1">
              · {lesson.nodes.length} 个节点
            </span>
            {lesson.duration && (
              <span className="text-[10px] text-ink-500 ml-1">
                · 约 {lesson.duration} 分钟
              </span>
            )}
          </div>

          {/* 进度 */}
          <div className="flex items-center gap-2 max-w-md">
            <ProgressBar value={rate} className="flex-1" height={4} />
            <span className="text-[11px] text-ink-500 w-16 text-right">
              {completedCount} / {totalCount}
            </span>
          </div>
        </div>

        {/* 进入 */}
        <Link
          to={`/student/course/${courseId}/lesson/${lesson.id}`}
          className={
            rate === 0
              ? 'lf-btn-primary !h-9 !px-4 shrink-0'
              : 'lf-btn-secondary !h-9 !px-4 shrink-0'
          }
        >
          {rate >= 1 ? '复习' : rate > 0 ? '继续' : '开始'}
        </Link>
      </div>
    </li>
  )
}
