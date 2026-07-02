import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { QuestionRenderer } from '@/components/question'
import { Icon } from '@/components/ui'
import type { IconName } from '@/components/ui'
import { CURRENT_STUDENT_ID } from '@/mock'
import {
  getActivities,
  getCourses,
  getNodeSubmissions,
  getRecentStudyByStudent,
} from '@/store'
import { diagnoseStudent, createEmptyAnswer, fmtRelative } from '@/utils'
import type { WrongQuestionItem } from '@/utils'

/**
 * 学生端 - 我的收获（合并：错题本 + 学习记录）
 *
 * 面向小学生，去掉"诊断/维度/正确率"等术语：
 *  - 顶部三个大数字：学了几节课 / 答对了几题 / 得了几朵小红花
 *  - "再练一次"：把答错的题列出来，鼓励重做（不叫"错题"）
 *  - "最近在学"：最近学习足迹
 */
export function StudentMe() {
  const subs = useMemo(() => getNodeSubmissions().filter((s) => s.studentId === CURRENT_STUDENT_ID), [])
  const courses = useMemo(() => getCourses(), [])
  const activities = useMemo(() => getActivities(), [])

  const diag = useMemo(
    () => diagnoseStudent(CURRENT_STUDENT_ID, getNodeSubmissions(), courses, activities),
    [courses, activities],
  )

  // 学了几节课：去重 (courseId+lessonId)
  const lessonsLearned = useMemo(() => {
    const set = new Set<string>()
    subs.forEach((s) => s.lessonId && set.add(`${s.courseId ?? ''}-${s.lessonId}`))
    // 兜底：用最近学习足迹的去重课节数
    if (set.size === 0) {
      getRecentStudyByStudent(CURRENT_STUDENT_ID).forEach((p) =>
        set.add(`${p.courseId}-${p.lessonId}`),
      )
    }
    return set.size
  }, [subs])

  // 答对了几题（跨所有测评提交）
  const correctCount = useMemo(() => {
    let n = 0
    subs.forEach((s) => s.answers.forEach((a) => { if (a.correct) n++ }))
    return n
  }, [subs])

  // 小红花：每答对 1 题 1 朵 + 每学完 1 门课 5 朵（轻量激励）
  const flowers = correctCount + diag.assessmentCount

  const recent = getRecentStudyByStudent(CURRENT_STUDENT_ID).slice(0, 6)

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">我的收获</h1>
        <p className="text-sm text-ink-500 mt-1">学习记录、错题复习都在这里</p>
      </div>

      {/* —— 三个数据 —— */}
      <div className="grid grid-cols-3 gap-4">
        <StatBig icon="book" value={lessonsLearned} label="学过的课节" accent="bg-sky-50 text-sky-600" />
        <StatBig icon="check" value={correctCount} label="答对的题目" accent="bg-emerald-50 text-emerald-600" />
        <StatBig icon="target" value={flowers} label="获得的星标" accent="bg-amber-50 text-amber-600" />
      </div>

      {/* —— 错题复习 —— */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-ink-900">错题复习</h2>
          {diag.wrongList.length > 0 && (
            <span className="text-sm text-ink-500">{diag.wrongList.length} 道题可以再练习</span>
          )}
        </div>

        {diag.wrongList.length === 0 ? (
          <div className="kid-card p-10 text-center">
            <div className="text-base font-medium text-ink-900">暂时没有需要复习的错题</div>
            <div className="text-sm text-ink-500 mt-1">继续保持，去学习新的课程吧</div>
          </div>
        ) : (
          <div className="space-y-3">
            {diag.wrongList.slice(0, 12).map((w) => (
              <RetryCard key={`${w.submissionId}-${w.question.id}`} item={w} />
            ))}
          </div>
        )}
      </section>

      {/* —— 最近学习 —— */}
      <section>
        <h2 className="text-lg font-semibold text-ink-900 mb-3">最近学习</h2>
        {recent.length === 0 ? (
          <div className="kid-card p-10 text-center">
            <div className="text-sm text-ink-500">还没有学习记录，去上一节课吧</div>
          </div>
        ) : (
          <div className="kid-card divide-y divide-ink-100">
            {recent.map((p) => {
              const c = courses.find((x) => x.id === p.courseId)
              if (!c) return null
              const lesson = c.lessons.find((l) => l.id === p.lessonId)
              const node = lesson?.nodes.find((n) => n.id === p.currentNodeId)
              return (
                <div key={`${p.courseId}-${p.lessonId}`} className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink-900 truncate">{c.title}</div>
                    <div className="text-xs text-ink-500 mt-0.5 truncate">
                      学到「{node?.title ?? '—'}」· {fmtRelative(p.lastStudyAt)}
                    </div>
                  </div>
                  <Link
                    to={`/student/course/${c.id}/lesson/${p.lessonId}`}
                    className="kid-btn-soft shrink-0 !h-9 !text-sm"
                  >
                    继续 →
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

/* ============================================================
 * 大数字统计块
 * ============================================================ */
function StatBig({
  icon,
  value,
  label,
  accent,
}: {
  icon: IconName
  value: number
  label: string
  accent: string
}) {
  return (
    <div className="kid-card p-5 text-center">
      <div className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center ${accent}`}>
        <Icon name={icon} className="w-6 h-6" />
      </div>
      <div className="text-3xl font-bold text-ink-900 mt-3">{value}</div>
      <div className="text-sm text-ink-500 mt-0.5">{label}</div>
    </div>
  )
}

/* ============================================================
 * 再练一次卡片（可展开看题 + 跳回去重做）
 * ============================================================ */
function RetryCard({ item }: { item: WrongQuestionItem }) {
  const [open, setOpen] = useState(false)
  const { question, courseTitle, lessonTitle } = item

  return (
    <div className="kid-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left p-4 flex items-center gap-3 hover:bg-ink-50 transition"
      >
        <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <Icon name="edit" className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-ink-900 truncate">{question.title}</div>
          <div className="text-xs text-ink-500 mt-0.5 truncate">
            来自《{courseTitle}》· {lessonTitle}
          </div>
        </div>
        <span className="text-ink-400 text-sm shrink-0">{open ? '收起' : '展开'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-ink-100 pt-4">
          <div className="pointer-events-none opacity-90">
            <QuestionRenderer question={question} value={createEmptyAnswer(question)} onChange={() => {}} />
          </div>
          {question.explanation && (
            <div className="mt-3 text-xs text-ink-700 bg-indigo-50 border border-indigo-200 rounded-lg p-3 leading-relaxed">
              <span className="font-medium text-indigo-700">解析：</span>
              {question.explanation}
            </div>
          )}
          <div className="mt-3 flex justify-end">
            <Link
              to={`/student/course/${item.courseId}/lesson/${item.lessonId}`}
              className="kid-btn-soft !h-9 !text-sm"
            >
              重新练习 →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
