/**
 * 统一线性图标组件（lucide 风格，零依赖）
 *
 * 设计原则（与原型保持一致的克制线性风）：
 *  - 24×24 viewBox，stroke=currentColor，描边 1.75，圆角线帽
 *  - 颜色不写死，跟随父级 text 色 → 天然同色系
 *  - 用法：<Icon name="book" className="w-5 h-5 text-ink-500" />
 *
 * 只收录本系统用得到的图标，按需扩充。
 */

export type IconName =
  | 'home'        // 工作台
  | 'book'        // 课程
  | 'users'       // 班级学生
  | 'chart'       // 学情数据
  | 'play'        // 上课
  | 'edit'        // 备课 / 编辑
  | 'fileText'    // 题目 / 测评
  | 'clipboard'   // 问卷
  | 'sparkles'    // AI / 生成
  | 'message'     // 反馈 / 讲解
  | 'send'        // 下发
  | 'rocket'      // 发布
  | 'target'      // 目标 / 维度
  | 'clock'       // 时长
  | 'alert'       // 提示
  | 'check'       // 完成 / 正确
  | 'eye'         // 预览
  | 'search'      // 搜索
  | 'plus'        // 新建
  | 'presentation'// 课件 / PPT
  | 'graduation'  // 教学 / 教师
  | 'refresh'     // 刷新 / 重置 / 重新生成
  | 'arrowRight'  // 箭头（行动指向）
  // —— 课程主题图标（课程封面用）——
  | 'robot'       // AI / 机器人
  | 'vision'      // 计算机视觉 / 图像识别
  | 'chat'        // 自然语言 / 对话
  | 'palette'     // 创作 / 绘画
  | 'shield'      // 安全 / 伦理
  | 'bulb'        // 启蒙 / 概念
  | 'cpu'         // 原理 / 算法
  | 'wand'        // 生成 / 魔法

interface IconProps {
  name: IconName
  className?: string
  /** 描边粗细，默认 1.75 */
  strokeWidth?: number
}

/* 每个图标的 path 内容（统一 24×24、无填充、描边） */
const PATHS: Record<IconName, JSX.Element> = {
  home: <><path d="M3 9.5 12 3l9 6.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" /></>,
  book: <><path d="M6 3h11a2 2 0 0 1 2 2v15a1 1 0 0 0-1-1H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M9 3v15" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 6a3 3 0 0 1 0 5" /><path d="M18 14a6 6 0 0 1 3 5" /></>,
  chart: <><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="6" rx="0.5" /><rect x="13" y="7" width="3" height="10" rx="0.5" /></>,
  play: <><path d="M7 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 7 5.5Z" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
  fileText: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" /><path d="M14 3v5h5" /><path d="M9 13h6" /><path d="M9 17h4" /></>,
  clipboard: <><rect x="8" y="3" width="8" height="4" rx="1" /><path d="M9 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3" /><path d="M9 12h6" /><path d="M9 16h4" /></>,
  sparkles: <><path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15.5l-1.8-4.7L5.5 9l4.7-1.3Z" /><path d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8Z" /></>,
  message: <><path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" /></>,
  send: <><path d="M21 4 3 11l6 2.5L11.5 20 21 4Z" /><path d="m9 13.5 3.5-3.5" /></>,
  rocket: <><path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2a2.83 2.83 0 0 0-3-3Z" /><path d="M14.5 9.5 9 15l-1.5-1.5L13 8c2-2 5-3 7-3 0 2-1 5-3 7l-5.5 5.5L10 14" /><circle cx="14.5" cy="9.5" r="1.2" /></>,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="0.8" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  alert: <><path d="M12 4 2.5 20h19L12 4Z" /><path d="M12 10v4" /><path d="M12 17.5h.01" /></>,
  check: <><path d="M4 12.5 9 17.5 20 6.5" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="2.5" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  presentation: <><path d="M3 4h18" /><path d="M4 4v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V4" /><path d="M12 15v4" /><path d="m9 21 3-2 3 2" /></>,
  graduation: <><path d="M12 4 2 9l10 5 10-5-10-5Z" /><path d="M5 11v5c0 1.5 3 3 7 3s7-1.5 7-3v-5" /></>,
  refresh: <><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 4v5h-5" /></>,
  arrowRight: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  robot: <><rect x="5" y="8" width="14" height="11" rx="2" /><path d="M12 8V4" /><circle cx="12" cy="3" r="1" /><path d="M9 13h.01" /><path d="M15 13h.01" /><path d="M9.5 16h5" /><path d="M2 13v3" /><path d="M22 13v3" /></>,
  vision: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
  chat: <><path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 4V6a1 1 0 0 1-1-1Z" /><path d="M8 9h8" /><path d="M8 12h5" /></>,
  palette: <><path d="M12 3a9 9 0 0 0 0 18c1.1 0 1.7-.9 1.7-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H16a5 5 0 0 0 5-5c0-4.4-4-8-9-8Z" /><circle cx="7.5" cy="11.5" r="1" /><circle cx="11" cy="7.5" r="1" /><circle cx="15.5" cy="9" r="1" /></>,
  shield: <><path d="M12 3 5 6v5c0 4 3 7.5 7 9 4-1.5 7-5 7-9V6l-7-3Z" /><path d="m9.5 12 1.8 1.8 3.2-3.4" /></>,
  bulb: <><path d="M9 18h6" /><path d="M10 21h4" /><path d="M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.4 1 2.2V16h6v-.3c0-.8.4-1.6 1-2.2A6 6 0 0 0 12 3Z" /></>,
  cpu: <><rect x="6" y="6" width="12" height="12" rx="2" /><rect x="9.5" y="9.5" width="5" height="5" rx="1" /><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" /></>,
  wand: <><path d="M5 19 19 5" /><path d="M14 5h.01M19 10h.01M9 4h.01M4 9h.01" /><path d="m13 6 5 5" /></>,
}

export function Icon({ name, className = 'w-5 h-5', strokeWidth = 1.75 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  )
}
