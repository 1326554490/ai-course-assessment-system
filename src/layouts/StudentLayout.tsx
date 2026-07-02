import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { bootstrap, getClasses, getStudents } from '@/store'
import { CURRENT_STUDENT_ID } from '@/mock'
import { FloatingDevTools } from '@/components/FloatingDevTools'
import { BrandLogo, Icon } from '@/components/ui'
import type { IconName } from '@/components/ui'

interface NavItem {
  to: string
  label: string
  icon: IconName
  match: (pathname: string) => boolean
}

// 学生端导航 3 个：首页 / 课程 / 我的收获
const NAV: NavItem[] = [
  { to: '/student',         label: '首页',     icon: 'home',  match: (p) => p === '/student' },
  { to: '/student/courses', label: '课程',     icon: 'book',  match: (p) => p.startsWith('/student/courses') || p.startsWith('/student/course/') },
  { to: '/student/me',      label: '我的收获', icon: 'chart', match: (p) => p.startsWith('/student/me') },
]

/**
 * 学生端布局：顶部品牌 + 3 个大图标导航（面向小学生）
 */
export function StudentLayout() {
  useEffect(() => {
    bootstrap()
  }, [])

  const { pathname } = useLocation()
  const stu = getStudents().find((s) => s.id === CURRENT_STUDENT_ID)
  const cls = getClasses().find((c) => c.id === stu?.classId)

  // 课程学习页 / 上课沉浸页：隐藏容器约束
  const isLessonPage = pathname.includes('/lesson/')

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="h-16 bg-white border-b border-ink-100 fixed top-0 left-0 right-0 z-50">
        <div className="h-full px-4 sm:px-6 flex items-center justify-between">
          {/* 左：品牌 + 导航 */}
          <div className="flex items-center gap-6">
            <BrandLogo subtitle="学生端" to="/" />

            <nav className="flex items-center gap-1.5">
              {NAV.map((item) => {
                const active = item.match(pathname)
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={
                      'px-4 h-11 text-sm flex items-center gap-2 rounded-full transition ' +
                      (active
                        ? 'bg-indigo-500 text-white font-medium shadow-sm'
                        : 'text-ink-600 hover:bg-indigo-50')
                    }
                  >
                    <Icon name={item.icon} className="w-[18px] h-[18px]" />
                    {item.label}
                  </NavLink>
                )
              })}
            </nav>
          </div>

          {/* 右：用户信息 */}
          <div className="text-sm text-ink-500 flex items-center gap-3">
            <span className="hidden sm:inline text-xs bg-ink-50 px-2.5 h-7 rounded-full inline-flex items-center">
              {cls?.name ?? '—'}
            </span>
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 inline-flex items-center justify-center text-sm font-medium">
                {stu?.name.slice(0, 1) ?? '?'}
              </span>
              <span className="text-ink-700 hidden sm:inline">{stu?.name ?? '未登录'}</span>
            </div>
            <a
              href="/teacher"
              className="text-xs text-ink-400 hover:text-ink-700 pl-3 border-l border-ink-200"
            >
              老师端 →
            </a>
          </div>
        </div>
      </header>

      {/* 顶部 header 高度占位 */}
      <div className="h-16" />
      <main className={isLessonPage ? '' : 'px-4 sm:px-6 py-8'}>
        <Outlet />
      </main>
      <FloatingDevTools />
    </div>
  )
}
