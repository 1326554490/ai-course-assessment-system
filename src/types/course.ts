/**
 * 课程中心化数据结构（新版）
 * Course → Lesson[] → LessonNode[] → Activity?
 *
 * 设计要点：
 * - LessonNode 是"流程节点"，只描述"这是课程里的哪一步"
 * - Activity 是"互动实体"，承载题目、评分、维度、反馈配置
 * - 节点通过 activityId 引用一个 Activity；内容类节点（content/feedback）可没有 activityId
 *
 * 兼容：本文件保留了一些过去使用的导出名（NodeSubmission/QuestionAnswer/StudentProgress 等）
 *       作为别名 / 重新导出，避免大量页面引用一次性炸掉。
 */
import type { Question } from './question'
import type { AnswerValue } from './submission'

export interface Dimension {
  id: string
  name: string
  /** 可选短描述 */
  description?: string
}

/* ====================================================================
 * Course
 * ==================================================================== */
export interface Course {
  id: string
  title: string
  description?: string
  /** 学段：primary（小学）/ junior（初中）/ senior（高中）/ tool（AI工具练习） */
  stage: 'primary' | 'junior' | 'senior' | 'tool'
  /** 年级范围，如 '5-6年级' */
  gradeRange: string
  /** 课程封面 - 视觉占位，可放 emoji / 主题色 key */
  cover?: string
  /** 课节列表 */
  lessons: Lesson[]
  /** 课程整体进度（仅用于聚合展示，0-1）—— 实际数据来自 StudentProgress */
  progress?: number
  /** 发布状态 */
  status: 'draft' | 'published' | 'archived'

  /** 创建/更新时间 */
  createdAt: string
  updatedAt: string

  /* === 兼容旧字段（已废弃，不要再用） === */
  /** @deprecated 使用 cover 代替 */
  coverColor?: string
}

/* ====================================================================
 * Lesson 课节
 * ==================================================================== */
export interface Lesson {
  id: string
  /** 反向引用 - 方便扁平化检索 */
  courseId: string
  title: string
  description?: string
  /** 预计学习时长（分钟） */
  duration?: number
  /** 顺序 */
  order: number
  /** 节点列表 */
  nodes: LessonNode[]
  /** 课节发布状态 */
  status: 'draft' | 'published'
}

/* ====================================================================
 * LessonNode 课节节点（流程节点）
 * 类型：content（图文/PPT） / survey / assessment / aiPractice / feedback
 * ==================================================================== */
export type LessonNodeType =
  | 'content'
  | 'survey'
  | 'assessment'
  | 'aiPractice'
  | 'feedback'

export interface LessonNode {
  id: string
  /** 反向引用 */
  lessonId: string
  type: LessonNodeType
  title: string
  description?: string
  /** 顺序 */
  order: number

  /** 互动节点引用的 Activity id；content 类节点可没有 */
  activityId?: string

  /** 图文类节点：Markdown 正文；feedback 类节点：反馈说明 */
  content?: string

  /** 学生必须完成才能进入下一节点 */
  completionRequired?: boolean
}

/* ====================================================================
 * Activity 互动实体
 * ==================================================================== */
export type ActivityType = 'survey' | 'assessment' | 'aiPractice'

/** 测评评分规则 */
export interface ScoringRule {
  /** 总分 */
  totalScore: number
  /** 及格分 */
  passScore?: number
  /** 多选打分策略 */
  multipleChoiceMode?: 'all-or-nothing' | 'partial'
}

/** 反馈配置（对学生展示什么） */
export interface FeedbackConfig {
  /** 是否对学生展示成绩 */
  showScore?: boolean
  /** 是否展示对错与解析 */
  showExplanation?: boolean
  /** 是否展示维度雷达 */
  showDimensionRadar?: boolean
}

export interface Activity {
  id: string
  type: ActivityType
  title: string
  description?: string
  /** 题目列表（aiPractice 类型可没有） */
  questions?: Question[]
  /** 评分规则（仅 assessment） */
  scoringRule?: ScoringRule
  /** 维度标签（仅 assessment） */
  dimensions?: Dimension[]
  /** 反馈配置 */
  feedbackConfig?: FeedbackConfig

  /* —— aiPractice 节点的占位字段 —— */
  /** 互动类型：chat / imageRecognition / promptWriting / ... */
  practiceType?: string
  examples?: string[]
}

/* ====================================================================
 * StudentSubmission 学生提交
 * ==================================================================== */
export type SubmissionStatus =
  | 'in_progress'
  | 'submitted'
  | 'graded'
  | 'returned'

export interface StudentSubmission {
  id: string
  studentId: string
  /** 提交的活动 id */
  activityId: string
  /** 触发本次提交的课节节点 id */
  lessonNodeId: string

  /** 冗余 - 便于聚合查询 */
  courseId?: string
  lessonId?: string

  /** 题目回答 */
  answers: QuestionAnswer[]

  /** 测评：总分 */
  score?: number
  /** 测评：每维度的得分率 0-1 */
  dimensionScores?: Record<string, number>
  /** 测评：整体正确率 0-1 */
  correctRate?: number
  /** 用时（秒） */
  durationSec?: number

  /** 提交时间 */
  submittedAt: string
  /** 状态 */
  status: SubmissionStatus
}

/* ====================================================================
 * StudentProgress 学生学习进度
 * ==================================================================== */
export interface StudentProgress {
  studentId: string
  courseId: string
  lessonId: string
  /** 当前学到的节点 id */
  currentNodeId: string
  /** 已完成的节点 id 集合 */
  completedNodeIds: string[]
  /** 最后学习时间 */
  lastStudyAt: string
}

/* ====================================================================
 * 单题作答（保持向后兼容导出）
 * ==================================================================== */
export interface QuestionAnswer {
  questionId: string
  value: AnswerValue
  /** 测评：得分 */
  score?: number
  /** 测评：是否完全正确 */
  correct?: boolean
}

/* ====================================================================
 * 兼容性导出
 * 旧代码里通过 LessonNode 直接拿到 questions / dimensions / examples 等字段。
 * 我们提供"装饰节点"工具与类型别名，让页面层平滑过渡。
 *
 * - NodeSubmission ↔ StudentSubmission：保持同名
 * - ContentNode / SurveyNode / AssessmentNode / AIPracticeNode：
 *   类型别名指向 LessonNode + Activity 合并后的结构，由 utils/courseAdapter 注水
 * ==================================================================== */

/** @deprecated 使用 StudentSubmission；保留同名别名 */
export type NodeSubmission = StudentSubmission

/** "节点 + 活动"合并视图，页面层使用这种结构展示更顺手 */
export type ResolvedNode<T extends LessonNodeType = LessonNodeType> =
  LessonNode & {
    type: T
    activity?: Activity
    /** 便利字段 —— 从 activity 注水 */
    questions?: Question[]
    dimensions?: Dimension[]
    totalScore?: number
    passScore?: number
    showResultToStudent?: boolean
    /** 反馈：是否展示对错与解析 */
    showExplanation?: boolean
    /** 反馈：是否展示维度雷达 */
    showDimensionRadar?: boolean
    practiceType?: string
    examples?: string[]
    /** 旧字段别名 */
    required?: boolean
  }

export type ContentNode    = ResolvedNode<'content'>
export type SurveyNode     = ResolvedNode<'survey'>
export type AssessmentNode = ResolvedNode<'assessment'>
export type AIPracticeNode = ResolvedNode<'aiPractice'>
export type FeedbackNode   = ResolvedNode<'feedback'>
