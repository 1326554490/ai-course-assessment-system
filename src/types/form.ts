import type { ID, ISODate, FormMode, Dimension } from './common'
import type { Question } from './question'

/**
 * 表单（问卷 / 测评）
 * mode 区分用途；同一份 schema 可承载两种模式的题目集合
 */
export interface Form {
  id: ID
  mode: FormMode
  title: string
  description?: string
  classIds: ID[]            // 发布班级
  dimensions?: Dimension[]  // 仅测评：自定义维度
  questions: Question[]

  status: 'draft' | 'published' | 'ended'
  createdAt: ISODate
  updatedAt: ISODate
  publishedAt?: ISODate
  endAt?: ISODate

  /** 评分规则（仅测评） */
  scoring?: {
    totalScore?: number          // 总分（一般由各题分值汇总）
    passScore?: number           // 及格分
    showResultToStudent?: boolean // 是否对学生展示成绩与反馈
  }
}
