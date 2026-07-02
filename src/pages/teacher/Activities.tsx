import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, Tag, StatNumber, Button, Input, Icon } from '@/components/ui'
import { CourseCover } from '@/components/CourseCover'
import {
  getActivities,
  getCourses,
  getNodeSubmissions,
  saveActivity,
} from '@/store'
import { fmtDateTime, pct, uid } from '@/utils'
import { QUESTION_TYPE_LABEL } from '@/types'
import type { Activity, Course } from '@/types'

const TYPE_TABS = [
  { key: 'all',         label: '全部' },
  { key: 'survey',      label: '问卷' },
  { key: 'assessment',  label: '测评' },
  { key: 'aiPractice',  label: 'AI 互动' },
] as const
type TypeTab = (typeof TYPE_TABS)[number]['key']

/**
 * 教师端 - 题库管理
 *
 * 列出所有 Activity，支持：
 *  - 按类型筛选（survey / assessment / aiPractice）
 *  - 全文搜索
 *  - 显示每个活动被哪些课程引用（复用情况）
 *  - 显示提交数量、平均分
 */
export function TeacherActivities() {
  const navigate = useNavigate()
  const activities = useMemo(() => getActivities(), [])
  const courses = useMemo(() => getCourses(), [])
  const subs = useMemo(() => getNodeSubmissions(), [])

  const [type, setType] = useState<TypeTab>('all')
  const [keyword, setKeyword] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  /** 构建 activityId -> 引用上下文映射 */
  const usageMap = useMemo(() => {
    const map = new Map<string, { course: Course; lessonTitle: string; nodeTitle: string }[]>()
    courses.forEach((c) => {
      c.lessons.forEach((l) => {
        l.nodes.forEach((n) => {
          if (!n.activityId) return
          const arr = map.get(n.activityId) ?? []
          arr.push({ course: c, lessonTitle: l.title, nodeTitle: n.title })
          map.set(n.activityId, arr)
        })
      })
    })
    return map
  }, [courses])

  const filtered = activities.filter((a) => {
    if (type !== 'all' && a.type !== type) return false
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      const hit =
        a.title.toLowerCase().includes(kw) ||
        (a.description?.toLowerCase().includes(kw) ?? false) ||
        (a.questions ?? []).some((q) => q.title.toLowerCase().includes(kw))
      if (!hit) return false
    }
    return true
  })

  // 各类型计数
  const counts = useMemo(() => {
    const c = (t: TypeTab) =>
      t === 'all'
        ? activities.length
        : activities.filter((a) => a.type === t).length
    return {
      all:        c('all'),
      survey:     c('survey'),
      assessment: c('assessment'),
      aiPractice: c('aiPractice'),
    }
  }, [activities])

  // 顶部统计
  const totalQuestions = activities.reduce(
    (s, a) => s + (a.questions?.length ?? 0),
    0,
  )
  const reusedCount = Array.from(usageMap.values()).filter((arr) => arr.length > 1).length

  return (
    <div className="space-y-5">
      {/* 标题 */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-medium text-ink-900">题库 / 活动管理</h2>
          <p className="text-xs text-ink-500 mt-1">
            所有问卷、测评、AI 互动活动的集中入口，可跨课程复用
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          + 新建活动
        </Button>
      </div>

      {/* 概览 */}
      <div className="grid grid-cols-4 gap-4">
        <StatNumber label="活动总数" value={activities.length} hint="问卷 / 测评 / AI 互动" />
        <StatNumber label="题目总数" value={totalQuestions} hint="跨活动累计" />
        <StatNumber label="跨课程复用" value={reusedCount} hint="被多课程引用" />
        <StatNumber label="累计提交" value={subs.length} />
      </div>

      {/* 筛选 */}
      <Card className="!p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-ink-500 mr-1">类型</span>
            {TYPE_TABS.map((t) => {
              const active = type === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  className={
                    'px-3 h-7 text-xs rounded-full transition ' +
                    (active
                      ? 'bg-brand-soft text-brand-text'
                      : 'text-ink-700 hover:bg-ink-100')
                  }
                >
                  {t.label}
                  <span className="ml-1.5 text-ink-500">{counts[t.key]}</span>
                </button>
              )
            })}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索活动标题 / 题干"
              className="lf-input !h-8 !w-64"
            />
            <span className="text-xs text-ink-500">
              {filtered.length} 条结果
            </span>
          </div>
        </div>
      </Card>

      {/* 活动列表 */}
      {filtered.length === 0 ? (
        <Card>
          <div className="py-16 text-center text-sm text-ink-500">
            没有匹配的活动
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((act) => (
            <ActivityRow
              key={act.id}
              activity={act}
              usage={usageMap.get(act.id) ?? []}
              subs={subs.filter((s) => s.activityId === act.id)}
            />
          ))}
        </div>
      )}

      <CreateActivityDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={(activityId, mode) => {
          setShowCreate(false)
          navigate(
            mode === 'upload'
              ? `/teacher/activity/${activityId}/generate`
              : `/teacher/activity/${activityId}/config`,
          )
        }}
      />
    </div>
  )
}

/* ============================================================
 * 活动行
 * ============================================================ */
function ActivityRow({
  activity,
  usage,
  subs,
}: {
  activity: Activity
  usage: { course: Course; lessonTitle: string; nodeTitle: string }[]
  subs: ReturnType<typeof getNodeSubmissions>
}) {
  const typeLabel: Record<Activity['type'], { text: string; cls: string }> = {
    survey:     { text: '问卷',    cls: 'bg-ink-100 text-ink-700' },
    assessment: { text: '测评',    cls: 'bg-brand-soft text-brand-text' },
    aiPractice: { text: 'AI 互动', cls: 'bg-amber-50 text-amber-700' },
  }
  const tl = typeLabel[activity.type]
  const questions = activity.questions ?? []
  const dims = activity.dimensions ?? []

  const submitStudents = new Set(subs.map((s) => s.studentId))
  const avgScore =
    activity.type === 'assessment' && subs.length > 0
      ? Math.round(
          (subs.reduce((s, x) => s + (x.score ?? 0), 0) / subs.length) * 10,
        ) / 10
      : null
  const fullScore = activity.scoringRule?.totalScore

  return (
    <Card className="!p-4">
      <div className="flex items-start gap-4">
        {/* 标题 + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`inline-flex items-center px-2 h-6 rounded text-[11px] ${tl.cls}`}>
              {tl.text}
            </span>
            <h3 className="text-sm font-medium text-ink-900 truncate">
              {activity.title}
            </h3>
          </div>
          {activity.description && (
            <p className="text-xs text-ink-500 leading-relaxed mb-2 line-clamp-2">
              {activity.description}
            </p>
          )}

          {/* meta row */}
          <div className="flex items-center gap-3 text-[11px] text-ink-500 flex-wrap mb-2">
            <span>📝 {questions.length} 题</span>
            {activity.type === 'assessment' && (
              <>
                <span>·</span>
                <span>总分 {fullScore ?? 0}</span>
                {activity.scoringRule?.passScore != null && (
                  <>
                    <span>·</span>
                    <span>及格 {activity.scoringRule.passScore}</span>
                  </>
                )}
                {dims.length > 0 && (
                  <>
                    <span>·</span>
                    <span>{dims.length} 个维度</span>
                  </>
                )}
              </>
            )}
          </div>

          {/* 题型分布 */}
          {questions.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap mb-2">
              {Object.entries(
                questions.reduce((acc, q) => {
                  acc[q.type] = (acc[q.type] ?? 0) + 1
                  return acc
                }, {} as Record<string, number>),
              ).map(([t, n]) => (
                <Tag key={t} className="!text-[10px]">
                  {(QUESTION_TYPE_LABEL as any)[t]} × {n}
                </Tag>
              ))}
            </div>
          )}

          {/* 引用情况 */}
          <div className="text-[11px] text-ink-500">
            {usage.length === 0 ? (
              <span className="text-ink-400">未被任何课程引用</span>
            ) : (
              <span>
                被引用于：
                {usage.map((u, i) => (
                  <span key={i}>
                    {i > 0 && <span className="text-ink-300">、</span>}
                    <Link
                      to={`/teacher/course/${u.course.id}/editor`}
                      className="text-brand-text hover:underline"
                    >
                      《{u.course.title}》/ {u.lessonTitle}
                    </Link>
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>

        {/* 数据栏 */}
        <div className="shrink-0 flex items-center gap-4 pl-4 border-l border-ink-100">
          <div className="text-center">
            <div className="text-xs text-ink-500">参与</div>
            <div className="text-lg font-medium text-ink-900">
              {submitStudents.size}
            </div>
            <div className="text-[10px] text-ink-500">人</div>
          </div>
          {avgScore != null && (
            <div className="text-center">
              <div className="text-xs text-ink-500">平均分</div>
              <div className="text-lg font-medium text-brand-text">
                {avgScore}
              </div>
              <div className="text-[10px] text-ink-500">/ {fullScore ?? 0}</div>
            </div>
          )}
        </div>

        {/* 操作 */}
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <Link
            to={`/teacher/activity/${activity.id}/config`}
            className="lf-btn-primary !h-7 !px-2.5 !text-[11px]"
          >
            📝 配置题目
          </Link>
          {usage[0] && (
            <Link
              to={`/teacher/course/${usage[0].course.id}/report`}
              className="text-[11px] text-brand-text hover:underline"
            >
              查看数据 →
            </Link>
          )}
          {usage[0] && (
            <Link
              to={`/teacher/course/${usage[0].course.id}/editor`}
              className="text-[11px] text-ink-500 hover:text-ink-900"
            >
              所属课节 →
            </Link>
          )}
        </div>
      </div>
    </Card>
  )
}

/* ============================================================
 * 新建活动对话框：选类型 + 标题 + 创建方式
 * ============================================================ */
const ACT_TYPES: { key: Activity['type']; label: string; desc: string; icon: any }[] = [
  { key: 'assessment', label: '测评', desc: '计分，有正确答案与解析', icon: 'check' },
  { key: 'survey',     label: '问卷', desc: '不计分，收集课堂反馈', icon: 'clipboard' },
  { key: 'aiPractice', label: 'AI 互动', desc: '对话 / 识别 / 绘画等体验', icon: 'sparkles' },
]

function CreateActivityDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (activityId: string, mode: 'blank' | 'upload') => void
}) {
  const [actType, setActType] = useState<Activity['type']>('assessment')
  const [title, setTitle] = useState('')

  if (!open) return null

  function create(mode: 'blank' | 'upload') {
    const name = title.trim() || (actType === 'assessment' ? '新建测评' : actType === 'survey' ? '新建问卷' : '新建 AI 互动')
    const id = uid('act')
    const act: Activity = {
      id,
      type: actType,
      title: name,
      description: '',
      questions: [],
      ...(actType === 'assessment'
        ? {
            scoringRule: { totalScore: 0 },
            dimensions: [],
            feedbackConfig: { showScore: true, showExplanation: true },
          }
        : {}),
    }
    saveActivity(act)
    onCreate(id, mode)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3.5 border-b border-ink-100 flex items-center justify-between">
          <span className="text-sm font-medium text-ink-900">新建活动</span>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-900">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* 类型 */}
          <div>
            <label className="text-xs text-ink-700 mb-2 block">活动类型</label>
            <div className="grid grid-cols-3 gap-2">
              {ACT_TYPES.map((t) => {
                const active = actType === t.key
                return (
                  <button
                    key={t.key}
                    onClick={() => setActType(t.key)}
                    className={
                      'rounded-lg border p-3 text-center transition ' +
                      (active ? 'border-brand bg-brand-softer' : 'border-ink-200 hover:border-ink-300')
                    }
                  >
                    <Icon name={t.icon} className={'w-5 h-5 mx-auto mb-1.5 ' + (active ? 'text-brand-text' : 'text-ink-400')} />
                    <div className={'text-sm ' + (active ? 'text-brand-text font-medium' : 'text-ink-900')}>{t.label}</div>
                    <div className="text-[10px] text-ink-500 mt-0.5 leading-tight">{t.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 标题 */}
          <div>
            <label className="text-xs text-ink-700 mb-1.5 block">活动标题</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="如：第一课 · 认识 AI 小测" />
          </div>

          {/* 创建方式 */}
          <div className="pt-1 space-y-2">
            <button onClick={() => create('blank')} className="w-full lf-btn-primary justify-center">
              空白创建，手动出题
            </button>
            {actType !== 'aiPractice' && (
              <button
                onClick={() => create('upload')}
                className="w-full lf-btn-secondary justify-center inline-flex items-center gap-1.5"
              >
                <Icon name="sparkles" className="w-4 h-4" />
                上传 PPT / 教案，AI 生成题目
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
