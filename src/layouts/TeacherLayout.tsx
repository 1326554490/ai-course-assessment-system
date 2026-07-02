import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { bootstrap } from '@/store'
import { CURRENT_TEACHER, CURRENT_SEMESTER, MOCK_CLASSES } from '@/mock'
import { FloatingDevTools } from '@/components/FloatingDevTools'
import { BrandLogo, Icon } from '@/components/ui'
import type { IconName } from '@/components/ui'

interface NavItem {
  to: string
  label: string
  icon: IconName
  /** 自定义匹配规则（默认 startsWith） */
  match?: (pathname: string) => boolean
}

const TEACHER_NAV: NavItem[] = [
  { to: '/teacher',          label: '工作台',   icon: 'home', match: (p) => p === '/teacher' },
  { to: '/teacher/courses',  label: '我的课程', icon: 'book',
    match: (p) =>
      p.startsWith('/teacher/courses') ||
      p.startsWith('/teacher/course/') ||
      p.startsWith('/teacher/activities') ||
      p.startsWith('/teacher/activity/') },
  { to: '/teacher/students', label: '班级学生', icon: 'users',
    match: (p) => p.startsWith('/teacher/students') || p.startsWith('/teacher/student/') },
  { to: '/teacher/data',     label: '学情数据', icon: 'chart',
    match: (p) =>
      p.startsWith('/teacher/data') ||
      p.startsWith('/teacher/reports') ||
      p.startsWith('/teacher/analytics') },
]

/**
 * 教师端整体布局：左侧导航 + 顶部 header + 主内容
 * 围绕"课程"重新组织：课程管理 / 学生与班级 / 数据报告
 */
export function TeacherLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    bootstrap()
  }, [])

  const currentClass = MOCK_CLASSES[0]

  // 上课模式：完全沉浸，不要教师端侧栏/顶栏
  const isTeachMode = /\/teacher\/course\/[^/]+\/teach/.test(pathname)

  // 课节编辑器、活动配置中心走全屏布局（保留侧栏）
  const isFullScreenEditor =
    /\/teacher\/course\/[^/]+\/editor/.test(pathname) ||
    /\/teacher\/activity\/[^/]+\/config/.test(pathname) ||
    /\/teacher\/activity\/[^/]+\/generate/.test(pathname)

  // 上课模式：直接铺满屏幕，只渲染 Outlet
  if (isTeachMode) {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="min-h-full flex bg-ink-50">
      {/* —— 左侧 Sidebar —— */}
      <aside className="w-60 shrink-0 border-r border-ink-100 bg-white flex flex-col sticky top-0 h-screen">
        <div className="h-16 px-5 flex items-center border-b border-ink-100 shrink-0">
          <BrandLogo subtitle="教师端" to="/" />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {TEACHER_NAV.map((item) => {
            const matchFn = item.match ?? ((p: string) => p.startsWith(item.to))
            const active = matchFn(pathname)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={
                  'flex items-center h-11 px-3 rounded-lg text-sm transition-colors ' +
                  (active
                    ? 'bg-brand text-white font-medium shadow-sm'
                    : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900')
                }
              >
                <Icon name={item.icon} className="w-[18px] h-[18px] mr-3 shrink-0" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="shrink-0 p-4 text-xs text-ink-500 border-t border-ink-100">
          切换到 <a href="/student" className="text-brand-text hover:underline">学生端 →</a>
        </div>
      </aside>

      {/* —— 右侧主区 —— */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 px-8 bg-white border-b border-ink-100 flex items-center justify-between sticky top-0 z-10">
          <div className="text-sm font-medium text-ink-700">K12 AI 通识课 · 教学平台</div>
          <div className="flex items-center gap-4 text-xs text-ink-500">
            <span className="lf-tag">{CURRENT_SEMESTER}</span>
            <span className="lf-tag">{currentClass?.name ?? '—'}</span>
            <div className="flex items-center gap-2 pl-4 border-l border-ink-100">
              <span className="w-8 h-8 rounded-full bg-brand-soft inline-flex items-center justify-center text-xs font-medium text-brand-text">
                {CURRENT_TEACHER.name.slice(0, 1)}
              </span>
              <span className="text-ink-700">{CURRENT_TEACHER.name}</span>
            </div>
          </div>
        </header>
        <div className={isFullScreenEditor ? 'flex-1 min-h-0' : 'p-8'}>
          <Outlet />
        </div>
      </main>
      <FloatingDevTools />
    </div>
  )
}
