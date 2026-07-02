import type { ID, ISODate } from './common'

/**
 * 学生作答的"作答值" - 与题型一一对应
 * （与 Question.answer 形状一致；这里多包一层 type 方便组件分发）
 */
export type AnswerValue =
  | { type: 'singleChoice';   optionId: ID | null }
  | { type: 'multipleChoice'; optionIds: ID[] }
  | { type: 'judge';          value: boolean | null }
  | { type: 'fillBlank';      blanks: string[] }
  | { type: 'shortAnswer';    text: string }
  | { type: 'sort';           order: ID[] }
  | { type: 'classify';       mapping: Record<ID, ID> }
  | { type: 'wordCompose';    pairs: { leftId: ID; rightId: ID }[] }
  | { type: 'ratingScale';    value: number | null }
  | { type: 'workUpload';     fileName: string | null; note: string }
  | { type: 'knowledgeReview'; viewedCardIds: ID[] }
  | { type: 'promptPractice'; text: string }
  | { type: 'materialGroup';  answers: Record<ID, ID | null> }

/** 单题作答（活动内一题对应一条） */
export interface QuestionAnswer {
  questionId: ID
  value: AnswerValue
  /** 仅测评：得分 */
  score?: number
  /** 仅测评：是否完全正确 */
  correct?: boolean
}

/**
 * StudentSubmission - 学生对某个活动节点的一次提交
 */
export interface StudentSubmission {
  id: ID
  studentId: ID
  /** 活动 id（业务层主体）*/
  activityId: ID
  /** 触发本次提交的课节节点 id（追溯学习轨迹）*/
  lessonNodeId: ID
  /** 课程 / 课节 id - 冗余字段，方便后续按课程聚合统计 */
  courseId?: ID
  lessonId?: ID
  /** 题目答案集合 */
  answers: QuestionAnswer[]
  /** 测评：总分 */
  score?: number
  /** 测评：正确率 0-1 */
  correctRate?: number
  /** 测评：按维度的得分率 0-1 */
  dimensionScores?: Record<ID, number>
  /** 用时（秒） */
  durationSec?: number
  /** 提交时间 */
  submittedAt: ISODate
  /** 提交状态 */
  status: 'submitted' | 'graded' | 'returned'
}

/** ===== 兼容性别名 =====
 * 旧代码里用的是 `Submission`，这里保留同名导出（指向新结构），
 * 后续逐步替换为 StudentSubmission。
 */
export type Submission = StudentSubmission
