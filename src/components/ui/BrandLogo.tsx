import { Link } from 'react-router-dom'

/**
 * 星芽品牌 Logo（三端共享）
 *
 * 统一三处的视觉与位置，避免在 首页 / 教师端 / 学生端 之间切换时
 * logo 左右跳动。所有调用方都应把它放在 h-14、px-4 的 header / sidebar
 * 最左侧，从而保证 logo 始终钉在距左 16px、垂直居中的同一位置。
 */
interface BrandLogoProps {
  /** 副标题，如 "教师端" / "学生端"；不传则只显示"星芽" */
  subtitle?: string
  /** 点击跳转地址；不传则不可点击 */
  to?: string
  className?: string
}

export function BrandLogo({ subtitle, to, className = '' }: BrandLogoProps) {
  const inner = (
    <div className={'flex items-center gap-2 ' + className}>
      <div className="w-7 h-7 rounded bg-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
        ★
      </div>
      <div className="leading-tight">
        <div className="text-sm font-medium text-ink-900">星芽</div>
        {subtitle && (
          <div className="text-[11px] text-ink-500 font-normal -mt-0.5">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center hover:opacity-80 transition">
        {inner}
      </Link>
    )
  }
  return inner
}
