/**
 * 学段视觉配置
 */

export const stageVisual = {
  primary: {
    label: '小学',
    color: '#3B82F6',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    icon: '📘',
    tagClass: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  junior: {
    label: '初中',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    icon: '📗',
    tagClass: 'bg-purple-50 text-purple-600 border-purple-200',
  },
  senior: {
    label: '高中',
    color: '#EC4899',
    bg: '#FDF2F8',
    border: '#FBCFE8',
    icon: '📕',
    tagClass: 'bg-pink-50 text-pink-600 border-pink-200',
  },
  tool: {
    label: 'AI工具',
    color: '#10B981',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    icon: '🤖',
    tagClass: 'bg-green-50 text-green-600 border-green-200',
  },
}

export type StageKey = keyof typeof stageVisual
