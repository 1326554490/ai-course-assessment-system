import { useState } from 'react'
import { Link } from 'react-router-dom'
import { clearAllLS } from '@/utils/storage'
import { Icon } from '@/components/ui'

/**
 * 浮动演示控制台
 *
 * 放在各端右下角，方便在「入口 / 教师端 / 学生端」之间快速切换、
 * 以及把数据恢复到初始状态。面向演示场景，措辞中性、不暴露技术细节。
 */
export function FloatingDevTools() {
  const [open, setOpen] = useState(false)

  function resetData() {
    if (!confirm('确定要把数据恢复到初始状态吗？\n你录入的内容将被清空。')) return
    clearAllLS()
    location.reload()
  }

  return (
    <>
      {/* 浮动按钮 */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={
          'fixed bottom-4 right-4 z-40 w-10 h-10 rounded-full shadow-md transition flex items-center justify-center ' +
          (open
            ? 'bg-ink-900 text-white'
            : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50')
        }
        title="快速切换"
        aria-label="快速切换"
      >
        <Icon name="refresh" className="w-[18px] h-[18px]" />
      </button>

      {/* 弹出菜单 */}
      {open && (
        <div className="fixed bottom-16 right-4 z-40 w-56 bg-white border border-ink-200 rounded-lg shadow-lg p-3 text-sm">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-ink-100">
            <span className="text-ink-900 font-medium text-xs">快速切换</span>
            <button
              onClick={() => setOpen(false)}
              className="text-ink-400 hover:text-ink-900"
            >
              ×
            </button>
          </div>

          <div className="space-y-0.5">
            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="px-2 py-1.5 rounded-md hover:bg-ink-50 text-ink-700 flex items-center gap-2"
            >
              <Icon name="home" className="w-4 h-4 text-ink-400" />
              平台首页
            </Link>
            <Link
              to="/teacher"
              onClick={() => setOpen(false)}
              className="px-2 py-1.5 rounded-md hover:bg-ink-50 text-ink-700 flex items-center gap-2"
            >
              <Icon name="graduation" className="w-4 h-4 text-ink-400" />
              教师端
            </Link>
            <Link
              to="/student"
              onClick={() => setOpen(false)}
              className="px-2 py-1.5 rounded-md hover:bg-ink-50 text-ink-700 flex items-center gap-2"
            >
              <Icon name="book" className="w-4 h-4 text-ink-400" />
              学生端
            </Link>

            <div className="pt-1.5 border-t border-ink-100 mt-1.5">
              <button
                onClick={resetData}
                className="w-full text-left px-2 py-1.5 rounded-md hover:bg-red-50 text-red-600 flex items-center gap-2"
              >
                <Icon name="refresh" className="w-4 h-4" />
                恢复初始数据
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
