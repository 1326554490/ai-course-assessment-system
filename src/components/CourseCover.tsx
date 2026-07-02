import { COURSE_ICON } from '@/mock/courses'
import { getCourseById } from '@/store'
import { stageVisual } from '@/utils/stageVisual'
import { Icon } from '@/components/ui'
import type { IconName } from '@/components/ui'

interface CourseCoverProps {
  courseId: string
  /** 课程标题（兜底使用） */
  title?: string
  /** 高度档位；xs 用作小头像，md/lg 用作卡片封面 */
  height?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  /** 是否显示左上角学段角标（小尺寸下默认隐藏） */
  showBadge?: boolean
}

/**
 * 课程封面 - 线性插画风
 *
 * 设计：按学段配柔色底 + 居中线描图标（与全站 Icon 体系统一），
 * 去掉了旧版的渐变色块 + emoji + 半透明大字，更克制专业。
 */

/** 学段 → 柔色底 + 图标前景色（Tailwind 内置色） */
const STAGE_TONE: Record<string, { bg: string; fg: string }> = {
  primary: { bg: 'bg-amber-50',   fg: 'text-amber-500' },
  junior:  { bg: 'bg-sky-50',     fg: 'text-sky-500' },
  senior:  { bg: 'bg-indigo-50',  fg: 'text-indigo-500' },
  tool:    { bg: 'bg-emerald-50', fg: 'text-emerald-500' },
}

export function CourseCover({
  courseId,
  title = '',
  height = 'md',
  className = '',
  showBadge,
}: CourseCoverProps) {
  const course = getCourseById(courseId)
  const stage = course ? stageVisual[course.stage as keyof typeof stageVisual] : null
  const tone = STAGE_TONE[course?.stage ?? 'primary'] ?? STAGE_TONE.primary
  const iconName = (COURSE_ICON[courseId] ?? 'book') as IconName

  const heightCls = { xs: 'h-10', sm: 'h-20', md: 'h-28', lg: 'h-36' }[height]
  const iconSizeCls = {
    xs: 'w-5 h-5',
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }[height]

  const renderBadge = showBadge ?? (height === 'md' || height === 'lg')

  return (
    <div
      className={`${heightCls} relative overflow-hidden rounded-lg ${tone.bg} ${className}`}
    >
      {/* 低调几何点缀：右下角描边圆环 */}
      {height !== 'xs' && (
        <div
          className={`absolute -right-4 -bottom-5 w-20 h-20 rounded-full border-2 ${tone.fg} opacity-15`}
        />
      )}
      {/* 居中线性图标 */}
      <div className={`absolute inset-0 flex items-center justify-center ${tone.fg}`}>
        <Icon name={iconName} className={iconSizeCls} strokeWidth={1.5} />
      </div>
      {/* 学段角标 */}
      {renderBadge && stage && (
        <div className="absolute top-2 left-2 text-[10px] text-ink-600 bg-white/80 px-1.5 py-0.5 rounded backdrop-blur-sm">
          {stage.label}
        </div>
      )}
    </div>
  )
}
