import { Link } from 'react-router-dom'
import { COURSE_ICON } from '@/mock/courses'
import { Icon } from '@/components/ui'
import type { IconName } from '@/components/ui'

/**
 * 学生端课程瓷砖（名字为主）
 *
 * 顶部柔色块 + 居中线性图标（与全站 Icon 体系统一），下面课程名是主角。
 */

/** 用课程 id 稳定地选一个柔色 accent */
const ACCENTS: { bg: string; text: string }[] = [
  { bg: 'bg-orange-50',  text: 'text-orange-500' },
  { bg: 'bg-rose-50',    text: 'text-rose-500' },
  { bg: 'bg-amber-50',   text: 'text-amber-500' },
  { bg: 'bg-pink-50',    text: 'text-pink-500' },
  { bg: 'bg-violet-50',  text: 'text-violet-500' },
  { bg: 'bg-sky-50',     text: 'text-sky-500' },
  { bg: 'bg-emerald-50', text: 'text-emerald-500' },
  { bg: 'bg-indigo-50',  text: 'text-indigo-500' },
]

function accentFor(courseId: string) {
  let h = 0
  for (let i = 0; i < courseId.length; i++) h = (h * 31 + courseId.charCodeAt(i)) >>> 0
  return ACCENTS[h % ACCENTS.length]
}

export interface CourseTileProps {
  courseId: string
  title: string
  gradeRange?: string
  lessonCount?: number
  /** 进度 0-1；不传则不显示进度条 */
  rate?: number
  to: string
  /** 右下角行动文字，如 "开始学习" */
  cta?: string
}

export function CourseTile({
  courseId,
  title,
  gradeRange,
  lessonCount,
  rate,
  to,
  cta,
}: CourseTileProps) {
  const iconName = (COURSE_ICON[courseId] ?? 'book') as IconName
  const accent = accentFor(courseId)
  const pctRound = rate != null ? Math.round(rate * 100) : null

  return (
    <Link to={to} className="kid-card-link block overflow-hidden group">
      {/* 顶部柔色块 + 居中线性图标 */}
      <div className={`${accent.bg} h-24 flex items-center justify-center relative overflow-hidden`}>
        <div className={`absolute -right-5 -bottom-6 w-24 h-24 rounded-full border-2 ${accent.text} opacity-15`} />
        <Icon name={iconName} className={`w-11 h-11 ${accent.text} transition group-hover:scale-110`} strokeWidth={1.5} />
        {pctRound != null && pctRound > 0 && (
          <span className="absolute top-2.5 right-2.5 text-[11px] font-medium px-2 h-6 inline-flex items-center rounded-full bg-white/85 text-ink-700 backdrop-blur">
            {pctRound >= 100 ? '已学完' : `${pctRound}%`}
          </span>
        )}
      </div>

      {/* 名字为主 */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-ink-900 leading-snug line-clamp-2 min-h-[2.75rem]">
          {title}
        </h3>
        <div className="mt-1.5 flex items-center gap-2 text-xs text-ink-500">
          {gradeRange && <span>{gradeRange}</span>}
          {gradeRange && lessonCount != null && <span className="text-ink-300">·</span>}
          {lessonCount != null && <span>{lessonCount} 节课</span>}
        </div>

        {/* 进度条（可选） */}
        {rate != null && (
          <div className="mt-3 h-2 rounded-full bg-ink-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{ width: `${Math.max(4, (pctRound ?? 0))}%` }}
            />
          </div>
        )}

        {/* CTA */}
        {cta && (
          <div className={`mt-3 text-sm font-medium ${accent.text} flex items-center gap-1`}>
            {cta} <span className="transition group-hover:translate-x-0.5">→</span>
          </div>
        )}
      </div>
    </Link>
  )
}
