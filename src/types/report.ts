import type { ID } from './common'

/**
 * 问卷统计 (Survey)
 * - 单选/多选/判断：每个选项的人数
 * - 填空：聚合学生回答
 */
export interface SurveyOptionStat {
  optionId: ID
  count: number
  ratio: number              // 0-1
  studentIds: ID[]           // 点击选项后展示
}

export interface SurveyChoiceStat {
  questionId: ID
  options: SurveyOptionStat[]
}

export interface SurveyFillStat {
  questionId: ID
  /** 聚合所有学生回答 */
  answers: { studentId: ID; text: string }[]
}

export interface SurveyReport {
  formId: ID
  totalStudents: number
  submittedCount: number
  unsubmittedCount: number
  completionRate: number     // 0-1
  unsubmittedStudentIds: ID[]
  choiceStats: SurveyChoiceStat[]
  fillStats: SurveyFillStat[]
}

/**
 * 测评统计 (Assessment)
 */
export interface QuestionAccuracyStat {
  questionId: ID
  correctCount: number
  totalCount: number
  accuracy: number           // 0-1
}

export interface DimensionMasteryStat {
  dimensionId: ID
  name: string
  /** 该维度下所有题目的平均得分率 */
  masteryRate: number        // 0-1
}

export interface WrongQuestionStat {
  questionId: ID
  accuracy: number
  wrongStudentIds: ID[]
}

export interface StudentScoreRow {
  studentId: ID
  studentName: string
  totalScore: number
  correctRate: number
  durationSec?: number
  submittedAt?: string
}

export interface AssessmentReport {
  formId: ID
  totalStudents: number
  submittedCount: number
  completionRate: number     // 0-1
  averageScore: number
  highestScore: number
  lowestScore: number
  questionAccuracy: QuestionAccuracyStat[]
  dimensionMastery: DimensionMasteryStat[]
  wrongQuestions: WrongQuestionStat[]    // 易错题，按 accuracy 升序
  studentRows: StudentScoreRow[]
}
