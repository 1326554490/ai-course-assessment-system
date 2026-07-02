import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { Card, Button, ProgressBar, Tag, StatNumber, Input, Textarea, Icon } from '@/components/ui'
import { CourseCover } from '@/components/CourseCover'
import {
  getActivities,
  getClasses,
  getCourses,
  getNodeSubmissions,
  getStudents,
  saveCourse,
} from '@/store'
import { fmtDateTime, pct, uid } from '@/utils'
import type { Activity, Course, NodeSubmission, Student } from '@/types'

/**
 * 教师端工作台 - 围绕"课程"组织
 * - 标题区 + 主操作（新建课程 / 进入课程管理）
 * - 5 个统计卡：课程总数 / 已发布课节 / 互动节点 / 累计提交 / 平均完成率
 * - 进行中课程概览（带每节互动进度）
 * - 最近互动数据 + 草稿
 */
export function TeacherHome() {
  const navigate = useNavigate()
  const courses = getCourses()
  const subs = getNodeSubmissions()
  const students = getStudents()
  const activities = getActivities()
  const classes = getClasses()

  const [showCreate, setShowCreate] = useState(false)

  const published = courses.filter((c) => c.status === 'published')
  const drafts = courses.filter((c) => c.status === 'draft')

  // 全部 lesson / node 数
  let totalLessons = 0
  let totalNodes = 0
  let totalInteractNodes = 0
  let publishedLessons = 0
  let publishedInteractNodeIds: string[] = []
  courses.forEach((c) => {
    c.lessons.forEach((l) => {
      totalLessons++
      if (c.status === 'published') publishedLessons++
      l.nodes.forEach((n) => {
        totalNodes++
        if (n.type !== 'content') {
          totalInteractNodes++
          if (c.status === 'published') publishedInteractNodeIds.push(n.id)
        }
      })
    })
  })

  // 平均完成率：以 published 课程的"互动节点"为分母，"有提交的学生数 / 班级人数"为单节完成率
  // 这里简化：完成率 = 提交学生数 / 学生总数
  const studentTotal = students.length
  const avgCompletion =
    publishedInteractNodeIds.length === 0
      ? 0
      : publishedInteractNodeIds.reduce((acc, nid) => {
          const ss = new Set(
            subs.filter((s) => s.lessonNodeId === nid).map((s) => s.studentId),
          )
          return acc + (studentTotal === 0 ? 0 : ss.size / studentTotal)
        }, 0) / publishedInteractNodeIds.length

  // 待查看报告 = 至少有 1 个学生提交的"已发布课程"
  const reportsToCheck = published.filter((c) =>
    c.lessons.some((l) =>
      l.nodes.some((n) => subs.some((s) => s.lessonNodeId === n.id)),
    ),
  ).length

  // 进行中课程：已发布并且有互动节点
  const ongoing = published.filter((c) =>
    c.lessons.some((l) => l.nodes.some((n) => n.type !== 'content')),
  )

  // —— 待批改简答题 ——
  const pendingGrading = useMemo(() => {
    type Pending = {
      activityId: string
      activityTitle: string
      courseId: string
      courseTitle: string
      lessonId: string
      pendingCount: number
    }
    const map = new Map<string, Pending>()
    activities.forEach((a) => {
      if (a.type !== 'assessment') return
      const shortQs = (a.questions ?? []).filter((q) => q.type === 'shortAnswer')
      if (shortQs.length === 0) return
      const relatedSubs = subs.filter((s) => s.activityId === a.id)
      let pendingCount = 0
      relatedSubs.forEach((sub) => {
        shortQs.forEach((q) => {
          const ans = sub.answers.find((x) => x.questionId === q.id)
          if (!ans) return
          // 简答题且 score 为 0 且 status 不是 graded 视为待批改
          if (sub.status !== 'graded' && (ans.score ?? 0) === 0) pendingCount++
        })
      })
      if (pendingCount === 0) return

      // 找 course / lesson 上下文
      for (const c of courses) {
        for (const l of c.lessons) {
          const n = l.nodes.find((x) => x.activityId === a.id)
          if (n) {
            map.set(a.id, {
              activityId: a.id,
              activityTitle: a.title,
              courseId: c.id,
              courseTitle: c.title,
              lessonId: l.id,
              pendingCount,
            })
            return
          }
        }
      }
    })
    return Array.from(map.values()).sort((a, b) => b.pendingCount - a.pendingCount)
  }, [activities, subs, courses])

  return (
    <div className="space-y-6">
      {/* —— 标题 + 主操作 —— */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-medium text-ink-900">工作台</h2>
          <p className="text-sm text-ink-500 mt-1">
            选一门课开始上课，或新建 / 编辑课程内容
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/teacher/activities">
            <Button variant="secondary">题库 / 配置题目</Button>
          </Link>
          <Link to="/teacher/courses">
            <Button variant="secondary">全部课程</Button>
          </Link>
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            + 新建课程
          </Button>
        </div>
      </div>

      {/* —— 进行中课程（工作台主体）—— */}
      <Card
        title={`进行中课程（${ongoing.length}）`}
        extra={
          <Link to="/teacher/courses" className="text-xs text-brand-text hover:underline">
            管理全部课程 →
          </Link>
        }
      >
        {ongoing.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-sm text-ink-500 mb-3">还没有进行中的课程</div>
            <Button variant="primary" onClick={() => setShowCreate(true)}>
              + 新建第一门课程
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {ongoing.map((c) => (
              <CourseRow key={c.id} course={c} subs={subs} students={students} />
            ))}
          </ul>
        )}
      </Card>

      {/* —— 待办：待批改 + 草稿 —— */}
      <div className="grid grid-cols-2 gap-4">
        <Card
          title={`待批改（${pendingGrading.reduce((s, p) => s + p.pendingCount, 0)} 份）`}
          extra={<span className="text-[11px] text-ink-500">简答题需人工评阅</span>}
        >
          {pendingGrading.length === 0 ? (
            <div className="py-6 text-center text-xs text-ink-500">没有待批改的作答</div>
          ) : (
            <ul className="space-y-2">
              {pendingGrading.slice(0, 5).map((p) => (
                <li
                  key={p.activityId}
                  className="flex items-center justify-between gap-3 px-3 py-2 border border-amber-100 bg-amber-50/40 rounded"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-ink-900 truncate">{p.activityTitle}</div>
                    <div className="text-[11px] text-ink-500 truncate">《{p.courseTitle}》</div>
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    <span className="text-sm text-amber-700 font-medium">{p.pendingCount} 份</span>
                    <Link
                      to={`/teacher/course/${p.courseId}/report`}
                      className="text-xs text-brand-text hover:underline shrink-0"
                    >
                      去批改 →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <DraftSidebar drafts={drafts} />
      </div>

      {/* 新建课程对话框 */}
      <CreateCourseDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(courseId) => {
          setShowCreate(false)
          if (courseId) {
            navigate(`/teacher/course/${courseId}/editor`)
          }
        }}
      />
    </div>
  )
}
/* ============================================================
 * 新建课程对话框（与 Courses.tsx 同步）
 * ============================================================ */
function CreateCourseDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (courseId: string) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [gradeRange, setGradeRange] = useState('1-2年级')
  const [lessonCount, setLessonCount] = useState(1)

  if (!open) return null

  function handleCreate() {
    if (!title.trim()) {
      alert('请填写课程名称')
      return
    }
    const courseId = uid('course')
    const now = new Date().toISOString()
    const lessons = Array.from({ length: lessonCount }).map((_, i) => {
      const lessonId = uid('lesson')
      const firstNodeId = uid('node')
      return {
        id: lessonId,
        courseId,
        title: `第 ${i + 1} 课`,
        description: '',
        duration: 25,
        order: i + 1,
        status: 'draft' as const,
        nodes: [
          {
            id: firstNodeId,
            lessonId,
            type: 'content' as const,
            order: 1,
            title: '课程导入',
            description: '',
            content: '# 课程导入\n\n在右侧面板编辑课程内容...',
          },
        ],
      }
    })
    const course: Course = {
      id: courseId,
      title: title.trim(),
      description: description.trim(),
      stage: 'primary',
      gradeRange,
      cover: courseId,
      lessons,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    }
    saveCourse(course)
    onCreated(courseId)
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-card shadow-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-ink-200 flex items-center justify-between">
          <h3 className="text-base font-medium text-ink-900">新建课程</h3>
          <button
            onClick={onClose}
            className="text-ink-500 hover:text-ink-900 text-lg leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-ink-700 mb-1.5 block">
              课程名称 <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="如：认识 AI 小伙伴"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-ink-700 mb-1.5 block">课程简介</label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="一句话描述这门课程"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ink-700 mb-1.5 block">适用年级</label>
              <select
                value={gradeRange}
                onChange={(e) => setGradeRange(e.target.value)}
                className="w-full h-9 border border-ink-200 rounded px-2 text-sm bg-white"
              >
                <option value="1-2年级">小学 1-2 年级</option>
                <option value="3-4年级">小学 3-4 年级</option>
                <option value="5-6年级">小学 5-6 年级</option>
                <option value="初中">初中</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-ink-700 mb-1.5 block">课节数</label>
              <Input
                type="number"
                min={1}
                max={10}
                value={lessonCount}
                onChange={(e) =>
                  setLessonCount(Math.max(1, Math.min(10, Number(e.target.value) || 1)))
                }
              />
            </div>
          </div>
          <div className="text-[11px] text-ink-500 px-3 py-2 bg-ink-50 rounded">
            💡 新课程以"草稿"状态保存。创建后会直接进入课节编辑器。
          </div>
        </div>
        <div className="px-5 py-3 border-t border-ink-200 flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button variant="primary" onClick={handleCreate}>
            创建并编辑 →
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
 * 进行中课程 - 单条
 * ============================================================ */
function CourseRow({
  course,
  subs,
  students,
}: {
  course: Course
  subs: NodeSubmission[]
  students: Student[]
}) {
  // 把课程下所有"互动节点"汇总
  const interactNodes = course.lessons
    .flatMap((l) => l.nodes)
    .filter((n) => n.type !== 'content')

  const studentTotal = students.length
  // 计算课程级"互动完成率"= 平均每个互动节点的提交学生数 / 总学生数
  const completion =
    interactNodes.length === 0
      ? 0
      : interactNodes.reduce((acc, n) => {
          const ss = new Set(
            subs.filter((s) => s.lessonNodeId === n.id).map((s) => s.studentId),
          )
          return acc + (studentTotal === 0 ? 0 : ss.size / studentTotal)
        }, 0) / interactNodes.length

  const totalSubmissions = subs.filter((s) =>
    interactNodes.some((n) => n.id === s.lessonNodeId),
  ).length

  return (
    <li className="flex items-center gap-4 px-3 py-3 border border-ink-200 rounded">
      <CourseCover
        courseId={course.id}
        title={course.title}
        height="xs"
        className="w-10 shrink-0"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm text-ink-900 truncate">
            {course.title}
          </span>
          <Tag>{course.gradeRange}</Tag>
        </div>
        <div className="text-[11px] text-ink-500">
          {course.lessons.length} 课节 · {interactNodes.length} 个互动节点 ·
          已收 {totalSubmissions} 次提交
        </div>
        <div className="mt-2 flex items-center gap-2 max-w-md">
          <ProgressBar value={completion} className="flex-1" />
          <span className="text-xs text-ink-500 w-10 text-right">
            {Math.round(completion * 100)}%
          </span>
        </div>
      </div>

      <div className="shrink-0 inline-flex items-center gap-3 text-xs">
        <Link
          to={`/teacher/course/${course.id}/teach`}
          className="lf-btn-primary !h-7 !px-2.5 !text-[11px] inline-flex items-center gap-1"
        >
          <Icon name="play" className="w-3.5 h-3.5" />
          上课
        </Link>
        <Link
          to={`/teacher/course/${course.id}/editor`}
          className="text-ink-500 hover:text-ink-900"
        >
          备课
        </Link>
        <Link
          to={`/teacher/course/${course.id}/report`}
          className="text-ink-500 hover:text-ink-900"
        >
          数据
        </Link>
      </div>
    </li>
  )
}

/* ============================================================
 * 草稿侧栏
 * ============================================================ */
function DraftSidebar({ drafts }: { drafts: Course[] }) {
  return (
    <Card title={`课程草稿（${drafts.length}）`}>
      {drafts.length === 0 ? (
        <div className="py-6 text-center text-xs text-ink-500">暂无草稿</div>
      ) : (
        <ul className="space-y-2">
          {drafts.map((c) => (
            <li
              key={c.id}
              className="flex items-start justify-between gap-3 px-3 py-2 border border-ink-200 rounded"
            >
              <div className="min-w-0">
                <div className="text-sm text-ink-900 truncate">{c.title}</div>
                <div className="text-[11px] text-ink-500 mt-0.5">
                  {c.gradeRange} · 更新于 {fmtDateTime(c.updatedAt)}
                </div>
              </div>
              <Link
                to={`/teacher/course/${c.id}/editor`}
                className="text-xs text-brand-text hover:underline shrink-0"
              >
                �继续编辑
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

/* ============================================================
 * 学段数据看板
 * 给教师工作台一个"按学段分组"的整体视角
 * ============================================================ */
function StageOverviewCard({
  courses,
  subs,
}: {
  courses: Course[]
  subs: { activityId: string; lessonNodeId: string; studentId: string }[]
}) {
  const STAGES = [
    { key: 'primary' as const, label: '小学',   icon: '🌱', tone: 'bg-amber-50  border-amber-200  text-amber-800' },
    { key: 'junior'  as const, label: '初中',   icon: '🌿', tone: 'bg-sky-50    border-sky-200    text-sky-800' },
    { key: 'senior'  as const, label: '高中',   icon: '🌳', tone: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
    { key: 'tool'    as const, label: 'AI工具', icon: '🛠', tone: 'bg-slate-50  border-slate-200  text-slate-800' },
  ]

  // 收集课程在每个学段下的节点 / 提交
  const stats = STAGES.map((s) => {
    const sCourses = courses.filter((c) => c.stage === s.key)
    const lessonCount = sCourses.reduce((sum, c) => sum + c.lessons.length, 0)
    const nodeIds: string[] = []
    sCourses.forEach((c) =>
      c.lessons.forEach((l) =>
        l.nodes.forEach((n) => {
          if (n.type !== 'content' && n.type !== 'feedback') nodeIds.push(n.id)
        }),
      ),
    )
    const sSubs = subs.filter((x) => nodeIds.includes(x.lessonNodeId))
    return {
      ...s,
      courseCount: sCourses.length,
      lessonCount,
      submitCount: sSubs.length,
      studentSet: new Set(sSubs.map((x) => x.studentId)),
    }
  })
  const totalCourses = courses.length
  const maxSubmit = Math.max(...stats.map((x) => x.submitCount), 1)

  return (
    <Card
      title="学段分布"
      extra={<span className="text-xs text-ink-500">课程 / 课节 / 提交 数据按学段聚合</span>}
    >
      <div className="grid grid-cols-4 gap-3">
        {stats.map((s) => {
          const pct = totalCourses === 0 ? 0 : Math.round((s.courseCount / totalCourses) * 100)
          return (
            <div
              key={s.key}
              className={`rounded border ${s.tone} p-3`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium flex items-center gap-1.5">
                  <span className="text-sm">{s.icon}</span>
                  <span>{s.label}</span>
                </div>
                <span className="text-[10px] opacity-70">{pct}%</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="opacity-70">课程</span>
                  <span className="font-medium">{s.courseCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="opacity-70">课节</span>
                  <span className="font-medium">{s.lessonCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="opacity-70">学生提交</span>
                  <span className="font-medium">{s.submitCount}</span>
                </div>
              </div>

              {/* 提交量条形 */}
              <div className="mt-2.5">
                <div className="h-1.5 bg-white/60 rounded overflow-hidden">
                  <div
                    className="h-full bg-current/70 transition-all"
                    style={{ width: `${(s.submitCount / maxSubmit) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
