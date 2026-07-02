/**
 * 通用类型
 * ID 统一使用 string，便于 mock 与 localStorage 持久化
 */
export type ID = string

/** ISO 时间字符串 */
export type ISODate = string

/** 业务模式：问卷 / 测评 */
export type FormMode = 'survey' | 'assessment'

/** 维度标签（仅测评模式使用，问卷不计分） */
export interface Dimension {
  id: ID
  name: string       // 维度名称，如 "AI 基础"
  color?: string     // 可选，给 Tag 染色
}

/** 班级 / 学生 */
export interface Student {
  id: ID
  name: string
  classId: ID
  studentNo?: string
  avatar?: string
}

export interface ClassInfo {
  id: ID
  name: string       // 如 "六年级 1 班"
  studentIds: ID[]
}
