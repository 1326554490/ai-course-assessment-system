/**
 * 入口：所有 mock 数据集中导出
 *
 * 当前数据模型已迁移到课程中心化结构（Course / Lesson / LessonNode / Activity / StudentSubmission）。
 * 旧的 Form/Survey/Assessment 仍保留为空数组，让旧页面（如 /teacher/reports）可以渲染空状态而不崩溃。
 */
import type { Form } from '@/types'

/** 旧 Form 入口，全部改为空数组（已被课程内嵌的 Activity 取代） */
export const MOCK_FORMS: Form[] = []

export * from './students'
// 旧 survey / assessment 文件不再导出（它们引用了被删的旧题型）
export * from './submissions'
export * from './courses'
export * from './progress'
