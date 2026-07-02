import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, ProgressBar, Tag, Button, Input, Textarea, Icon } from '@/components/ui'
import { CourseCover } from '@/components/CourseCover'
import {
  getCourses,
  getNodeSubmissions,
  getStudents,
  saveCourse,
} from '@/store'
import { fmtDateTime, pct, uid } from '@/utils'
import { stageVisual } from '@/utils/stageVisual'
import type { Course, LessonNode } from '@/types'

const STATUS_TABS = [
  { key: 'all',       label: '全部' },
  { key: 'published', label: '已发布' },
  { key: 'draft',     label: '草稿' },
] as const
type StatusTab = (typeof STATUS_TABS)[number]['key']

const STAGE_TABS = [
  { key: 'all',     label: '全部学段' },
  { key: 'primary', label: '小学' },
  { key: 'junior',  label: '初中' },
  { key: 'senior',  label: '高中' },
  { key: 'tool',    label: 'AI工具' },
] as const
type StageTab = (typeof STAGE_TABS)[number]['key']

/**
 * 教师端 - 课程管理
 * - 顶部：状态 + 年级筛选 + 视图切换 + 新建按钮
 * - 主区：课程网格 / 课程表格（按视图模式切换）
 */
export function TeacherCourses() {
  const navigate = useNavigate()
  const courses = useMemo(() => getCourses(), [])
  const subs = useMemo(() => getNodeSubmissions(), [])
  const students = useMemo(() => getStudents(), [])

  const [status, setStatus] = useState<StatusTab>('all')
  const [stage, setStage] = useState<StageTab>('all')
  const [view, setView] = useState<'grid' | 'table'>('table')
  const [showCreate, setShowCreate] = useState(false)

  const filtered = courses.filter((c) => {
    if (status !== 'all' && c.status !== status) return false
    if (stage !== 'all' && c.stage !== stage) return false
    return true
  })

  // 统计每门课的"互动节点 / 已发布课节 / 学生提交数"
  function summarize(c: Course) {
    let interactNodes = 0
    let totalNodes = 0
    let nodeIds: string[] = []
    c.lessons.forEach((l) => {
      l.nodes.forEach((n) => {
        totalNodes++
        if (n.type !== 'content') {
          interactNodes++
          nodeIds.push(n.id)
        }
      })
    })
    const courseSubs = subs.filter((s) => nodeIds.includes(s.lessonNodeId))
    return {
      lessonCount: c.lessons.length,
      nodeCount: totalNodes,
      interactCount: interactNodes,
      submissionCount: courseSubs.length,
      uniqueStudentsCount: new Set(courseSubs.map((s) => s.studentId)).size,
    }
  }

  return (
    <div className="space-y-5">
      {/* 标题 + 主操作 */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-medium text-ink-900">课程管理</h2>
          <p className="text-xs text-ink-500 mt-1">
            管理你创建的 AI 课程，编辑课节内容，查看学生学习数据
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            + 新建课程
          </Button>
        </div>
      </div>

      {/* 筛选 + 视图切换 */}
      <Card className="!p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-ink-500 mr-1">状态</span>
          {STATUS_TABS.map((t) => {
            const active = status === t.key
            const n = t.key === 'all' ? courses.length : courses.filter((c) => c.status === t.key).length
            return (
              <button
                key={t.key}
                onClick={() => setStatus(t.key)}
                className={
                  'px-3 h-7 text-xs rounded-full transition ' +
                  (active
                    ? 'bg-brand-soft text-brand-text'
                    : 'text-ink-700 hover:bg-ink-100')
                }
              >
                {t.label}
                <span className="ml-1.5 text-ink-500">{n}</span>
              </button>
            )
          })}

          <span className="text-xs text-ink-500 ml-3 mr-1">学段</span>
          {STAGE_TABS.map((t) => {
            const active = stage === t.key
            return (
              <button
                key={t.key}
                onClick={() => setStage(t.key)}
                className={
                  'px-3 h-7 text-xs rounded-full transition ' +
                  (active
                    ? 'bg-brand-soft text-brand-text'
                    : 'text-ink-700 hover:bg-ink-100')
                }
              >
                {t.label}
              </button>
            )
          })}

          <div className="ml-auto flex items-center gap-1 border border-ink-200 rounded p-0.5">
            <button
              onClick={() => setView('grid')}
              className={
                'px-2 h-6 text-xs rounded ' +
                (view === 'grid' ? 'bg-brand text-white' : 'text-ink-700 hover:bg-ink-100')
              }
            >
              网格
            </button>
            <button
              onClick={() => setView('table')}
              className={
                'px-2 h-6 text-xs rounded ' +
                (view === 'table' ? 'bg-brand text-white' : 'text-ink-700 hover:bg-ink-100')
              }
            >
              表格
            </button>
          </div>
        </div>
      </Card>

      {/* 主区 */}
      {filtered.length === 0 ? (
        <Card>
          <div className="py-16 text-center text-sm text-ink-500">
            没有匹配的课程
          </div>
        </Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((c) => (
            <CourseGridCard key={c.id} course={c} summary={summarize(c)} />
          ))}
        </div>
      ) : (
        <Card>
          <table className="lf-table">
            <thead>
              <tr>
                <th className="w-[24%]">课程</th>
                <th className="w-[8%]">学段</th>
                <th className="w-[10%]">年级</th>
                <th className="w-[8%]">状态</th>
                <th className="w-[8%]">课节</th>
                <th className="w-[10%]">互动节点</th>
                <th className="w-[10%]">学生提交</th>
                <th className="w-[12%]">最后更新</th>
                <th className="w-[10%] text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const s = summarize(c)
                const stageLabel: Record<Course['stage'], string> = {
                  primary: '小学',
                  junior: '初中',
                  senior: '高中',
                  tool: 'AI工具',
                }
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <CourseCover courseId={c.id} title={c.title} height="xs" className="w-10 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-ink-900 truncate">{c.title}</div>
                          <div className="text-[11px] text-ink-500 truncate">
                            {c.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {(() => {
                        const sv = stageVisual[c.stage as keyof typeof stageVisual]
                        return (
                          <span className={`inline-flex items-center px-1.5 h-5 rounded text-[10px] border ${sv.tagClass}`}>
                            {sv.icon} {stageLabel[c.stage]}
                          </span>
                        )
                      })()}
                    </td>
                    <td>{c.gradeRange}</td>
                    <td>
                      <Tag variant={c.status === 'published' ? 'brand' : 'default'}>
                        {c.status === 'published' ? '已发布' : '草稿'}
                      </Tag>
                    </td>
                    <td>{s.lessonCount} 节</td>
                    <td>
                      <span className="text-ink-900">{s.interactCount}</span>
                      <span className="text-xs text-ink-500"> / {s.nodeCount}</span>
                    </td>
                    <td>
                      <span className="text-ink-900">{s.submissionCount}</span>
                      <span className="text-xs text-ink-500">
                        （{s.uniqueStudentsCount} 人）
                      </span>
                    </td>
                    <td className="text-xs text-ink-500">
                      {fmtDateTime(c.updatedAt)}
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-3 text-xs">
                        <Link
                          to={`/teacher/course/${c.id}/teach`}
                          className="text-brand-text font-medium hover:underline inline-flex items-center gap-1"
                        >
                          <Icon name="play" className="w-3.5 h-3.5" />
                          上课
                        </Link>
                        <Link
                          to={`/teacher/course/${c.id}/editor`}
                          className="text-ink-500 hover:text-ink-900"
                        >
                          备课
                        </Link>
                        <Link
                          to={`/teacher/course/${c.id}/report`}
                          className="text-ink-500 hover:text-ink-900"
                        >
                          数据
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}

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
 * 新建课程对话框
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
  const [stage, setStage] = useState<Course['stage']>('primary')
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
      stage,
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
              <label className="text-xs text-ink-700 mb-1.5 block">学段</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as Course['stage'])}
                className="w-full h-9 border border-ink-200 rounded px-2 text-sm bg-white"
              >
                <option value="primary">小学</option>
                <option value="junior">初中</option>
                <option value="senior">高中</option>
                <option value="tool">AI工具练习</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-ink-700 mb-1.5 block">适用年级</label>
              <select
                value={gradeRange}
                onChange={(e) => setGradeRange(e.target.value)}
                className="w-full h-9 border border-ink-200 rounded px-2 text-sm bg-white"
              >
                {stage === 'primary' && (
                  <>
                    <option value="1-2年级">1-2年级</option>
                    <option value="3-4年级">3-4年级</option>
                    <option value="5-6年级">5-6年级</option>
                  </>
                )}
                {stage === 'junior' && (
                  <>
                    <option value="7年级">7年级</option>
                    <option value="8年级">8年级</option>
                    <option value="9年级">9年级</option>
                    <option value="7-9年级">7-9年级</option>
                  </>
                )}
                {stage === 'senior' && (
                  <>
                    <option value="10年级">10年级</option>
                    <option value="11年级">11年级</option>
                    <option value="12年级">12年级</option>
                    <option value="10-12年级">10-12年级</option>
                  </>
                )}
                {stage === 'tool' && (
                  <option value="全学段">全学段</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-ink-700 mb-1.5 block">课节数（可后续添加）</label>
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

          <div className="text-[11px] text-ink-500 px-3 py-2 bg-ink-50 rounded">
            💡 新课程会以"草稿"状态保存。创建后会直接进入课节编辑器，你可以继续添加图文、问卷、测评、AI 互动等节点。
          </div>
        </div>

        <div className="px-5 py-3 border-t border-ink-200 flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button variant="primary" onClick={handleCreate}>
            创建并编辑 →
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
 * 网格视图卡片
 * ============================================================ */
function CourseGridCard({
  course,
  summary,
}: {
  course: Course
  summary: ReturnType<TeacherCoursesSummarize>
}) {
  const stageLabel: Record<Course['stage'], string> = {
    primary: '小学',
    junior: '初中',
    senior: '高中',
    tool: 'AI工具',
  }

  return (
    <Card className="!p-0 overflow-hidden hover:shadow-md transition">
      <CourseCover courseId={course.id} title={course.title} height="md" />
      <div className="p-4">
        <div className="flex items-center gap-2 text-[11px] text-ink-500 mb-2">
          <Tag>{stageLabel[course.stage]}</Tag>
          <Tag>{course.gradeRange}</Tag>
          <Tag variant={course.status === 'published' ? 'brand' : 'default'}>
            {course.status === 'published' ? '已发布' : '草稿'}
          </Tag>
          <span className="ml-auto">{summary.lessonCount} 课节</span>
        </div>
        <h3 className="text-sm font-medium text-ink-900 mb-1 line-clamp-1">
          {course.title}
        </h3>
        {course.description && (
          <p className="text-[11px] text-ink-500 line-clamp-2 leading-relaxed h-[28px] mb-3">
            {course.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 mb-3 text-[11px]">
          <div className="px-2 py-1.5 bg-ink-50 rounded">
            <div className="text-ink-500">互动节点</div>
            <div className="text-ink-900 font-medium">
              {summary.interactCount}
              <span className="text-ink-500 font-normal"> / {summary.nodeCount}</span>
            </div>
          </div>
          <div className="px-2 py-1.5 bg-ink-50 rounded">
            <div className="text-ink-500">学生提交</div>
            <div className="text-ink-900 font-medium">
              {summary.submissionCount}
              <span className="text-ink-500 font-normal"> 次</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/teacher/course/${course.id}/teach`}
            className="lf-btn-primary !h-8 !px-3 flex-1 justify-center inline-flex items-center gap-1"
          >
            <Icon name="play" className="w-3.5 h-3.5" />
            上课
          </Link>
          <Link
            to={`/teacher/course/${course.id}/editor`}
            className="lf-btn-secondary !h-8 !px-3"
          >
            备课
          </Link>
          <Link
            to={`/teacher/course/${course.id}/report`}
            className="lf-btn-secondary !h-8 !px-3"
          >
            数据
          </Link>
        </div>
      </div>
    </Card>
  )
}

// 仅用于 TS 推导
type TeacherCoursesSummarize = (c: Course) => {
  lessonCount: number
  nodeCount: number
  interactCount: number
  submissionCount: number
  uniqueStudentsCount: number
}
