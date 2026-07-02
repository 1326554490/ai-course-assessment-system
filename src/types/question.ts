/**
 * 题型与题目结构
 *
 * 题型枚举对外采用规范化命名：
 *   singleChoice / multipleChoice / judge /
 *   fillBlank / shortAnswer / sort / classify / wordCompose
 *
 * 题目用统一的 `answer` 字段承载"正确答案"，按题型不同形状不同：
 *   singleChoice   → string                  // 正确选项 id
 *   multipleChoice → string[]                // 正确选项 ids
 *   judge          → boolean                 // true / false
 *   fillBlank      → string[][]              // 每个空允许的答案集合
 *   shortAnswer    → string                  // 参考答案
 *   sort           → string[]                // 正确顺序的 item ids
 *   classify       → Record<itemId, categoryId>
 *   wordCompose    → { leftId; rightId }[]
 */

import type { ID, Dimension } from './common'

export type QuestionType =
  | 'singleChoice'    // 单选
  | 'multipleChoice'  // 多选
  | 'judge'           // 判断（学生端为滑动判断交互）
  | 'fillBlank'       // 填空
  | 'shortAnswer'     // 简答
  | 'sort'            // 排序
  | 'classify'        // 分类
  | 'wordCompose'     // 词组选配（保留兼容，不在新建清单中）
  | 'ratingScale'     // 星级量表（问卷）
  | 'workUpload'      // 作品上传（问卷）
  | 'knowledgeReview' // 知识回顾（测评，不计分）
  | 'promptPractice'  // Prompt 练习（测评）
  | 'materialGroup'   // 材料组合题（公共材料 + 多个单选子题）

/** 单个选项（用于单选 / 多选 / 判断） */
export interface Option {
  id: ID
  label: string    // "A" / "B" / "对" / "错"
  content: string
  /** 选项配图 URL（图片宫格式用） */
  image?: string
  /** 选项补充说明（卡片式用） */
  desc?: string
}

/** 题目 answer 形状 */
export type QuestionAnswerKey =
  | string
  | string[]
  | boolean
  | string[][]
  | Record<string, string>
  | { leftId: string; rightId: string }[]

/** 题目基础结构 */
export interface BaseQuestion {
  id: ID
  type: QuestionType
  /** 题干 */
  title: string
  /** 题目说明 / 补充 */
  description?: string
  /** 题干配图（base64 或 URL，支持多张，图文结合题用） */
  images?: string[]
  /** 是否必答 */
  required?: boolean
  /** 分值（仅测评） */
  score?: number
  /** 关联维度 id 列表 */
  dimensions?: ID[]
  /** 反馈解析（提交后展示） */
  explanation?: string
}

/* ---------- 选择类 ---------- */
export interface SingleChoiceQuestion extends BaseQuestion {
  type: 'singleChoice'
  options: Option[]
  /** 正确选项 id */
  answer?: string
  /** 展示方式：list 列表（默认） / card 卡片 / grid 图片宫格 / composite 组合式（材料题） */
  optionStyle?: 'list' | 'card' | 'grid' | 'composite'
  /** composite 模式：公共材料文本 */
  material?: string
  /** composite 模式：公共材料图片 URL */
  materialImage?: string
  /** composite 模式：子题列表（每个子题独立的题干+选项+答案） */
  subQuestions?: Array<{
    id: string
    title: string
    options: Option[]
    answer?: string
  }>
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multipleChoice'
  options: Option[]
  /** 正确选项 ids */
  answer?: string[]
  /** 多选评分策略：全对 / 部分得分 */
  scoreMode?: 'all-or-nothing' | 'partial'
  /** 展示方式：list 列表（默认） / card 卡片 / grid 图片宫格 */
  optionStyle?: 'list' | 'card' | 'grid'
}

export interface JudgeQuestion extends BaseQuestion {
  type: 'judge'
  /** 正确答案，true / false */
  answer?: boolean
  /**
   * 展示方式（纯渲染差异，答案仍为 boolean）：
   * - slider 滑动判断（默认，左右滑块）
   * - button 按钮式（对 / 错 两个按钮）
   * - card   卡片式（两张大卡片带图标）
   */
  judgeStyle?: 'slider' | 'button' | 'card'
  /** 判断文案，自定义「对/错」两端的说法，如 ["属于","不属于"] */
  judgeLabels?: [string, string]
}

/* ---------- 文本类 ---------- */
export interface FillBlankQuestion extends BaseQuestion {
  type: 'fillBlank'
  /** 空数（默认 1） */
  blanks?: number
  /** 每个空允许的答案集合 */
  answer?: string[][]
  /**
   * 展示方式（决定学生端如何渲染）：
   * - single   单空输入式（核心术语 / 关键词）
   * - inline   句中填空式（用 ___ 标记空位，配合 inlineText）
   * - multi    多空填空式（默认，多个相关概念）
   * - material 材料辅助式（看图 / 案例后填写，配合 materialImage）
   */
  fillStyle?: 'single' | 'inline' | 'multi' | 'material'
  /** inline 模式：句子模板，用 ___ 表示空位 */
  inlineText?: string
  /** material 模式：材料图片 URL */
  materialImage?: string
  /** 输入框 placeholder */
  placeholder?: string
  /** 测评：错别字容错（一个字差异给一半分） */
  fuzzyMatch?: boolean
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'shortAnswer'
  /** 参考答案 */
  answer?: string
}

/* ---------- 排序题 ---------- */
export interface SortQuestion extends BaseQuestion {
  type: 'sort'
  items: { id: ID; content: string }[]
  /** 正确顺序的 item ids */
  answer?: ID[]
  /** 展示方式：updown 上下移（默认） / timeline 时间线 */
  sortStyle?: 'updown' | 'timeline'
}

/* ---------- 分类题 ---------- */
export interface ClassifyCategory {
  id: ID
  name: string
}
export interface ClassifyItem {
  id: ID
  content: string
}
export interface ClassifyQuestion extends BaseQuestion {
  type: 'classify'
  categories: ClassifyCategory[]
  items: ClassifyItem[]
  /** itemId → categoryId */
  answer?: Record<ID, ID>
}

/* ---------- 词组选配题 ---------- */
export interface WordComposePair {
  leftId: ID
  rightId: ID
}
export interface WordComposeQuestion extends BaseQuestion {
  type: 'wordCompose'
  leftItems: { id: ID; content: string }[]
  rightItems: { id: ID; content: string }[]
  answer?: WordComposePair[]
}

/* ---------- 星级量表（问卷）---------- */
export interface RatingScaleQuestion extends BaseQuestion {
  type: 'ratingScale'
  /** 量表最大档位（星数 / 分级数，默认 5） */
  max?: number
  /** 量表样式：star 星级 / number 数字档 */
  style?: 'star' | 'number'
  /** 两端文案，如 ["很不满意","非常满意"] */
  labels?: [string, string]
  /** 问卷不判分，无 answer */
}

/* ---------- 作品上传（问卷）---------- */
export interface WorkUploadQuestion extends BaseQuestion {
  type: 'workUpload'
  /** 允许的文件类型说明，如 "图片 / PDF" */
  accept?: string
  /** 是否要求附文字说明 */
  needNote?: boolean
  /** 提示文案 */
  uploadHint?: string
}

/* ---------- 知识回顾（测评，不计分）---------- */
export interface ReviewCard {
  id: ID
  /** 正面 / 标题 */
  front: string
  /** 背面 / 解释 */
  back: string
}
export interface KnowledgeReviewQuestion extends BaseQuestion {
  type: 'knowledgeReview'
  /** 回顾方式：flip 翻转卡片 / reveal 点击揭示 / list 列表 */
  reviewStyle?: 'flip' | 'reveal' | 'list'
  cards: ReviewCard[]
  /** 不计分，学生侧只记录"已查看" */
}

/* ---------- Prompt 练习（测评）---------- */
export interface PromptPracticeQuestion extends BaseQuestion {
  type: 'promptPractice'
  /** 任务目标 */
  goal?: string
  /** 结构提示字段，如 ["角色","任务","要求"] */
  structure?: string[]
  /** 示例 Prompt（给学生参考） */
  example?: string
  /** 学生作答为文本，需教师/AI 评，answer 存参考要点 */
  answer?: string
}

/* ---------- 材料组合题（公共材料 + 多个单选子题）---------- */
export interface SubQuestion {
  id: ID
  /** 子题题干 */
  title: string
  options: Option[]
  /** 正确选项 id（测评判分用） */
  answer?: string
}
export interface MaterialGroupQuestion extends BaseQuestion {
  type: 'materialGroup'
  /** 公共材料正文（题干图沿用 BaseQuestion.images） */
  materialText?: string
  /** 子题列表，每个子题为单选 */
  subQuestions: SubQuestion[]
}

/** 题目联合类型 */
export type Question =
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | JudgeQuestion
  | FillBlankQuestion
  | ShortAnswerQuestion
  | SortQuestion
  | ClassifyQuestion
  | WordComposeQuestion
  | RatingScaleQuestion
  | WorkUploadQuestion
  | KnowledgeReviewQuestion
  | PromptPracticeQuestion
  | MaterialGroupQuestion

/** 题型 → 中文标签 */
export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  singleChoice:    '单选题',
  multipleChoice:  '多选题',
  judge:           '判断题',
  fillBlank:       '填空题',
  shortAnswer:     '简答题',
  sort:            '排序题',
  classify:        '分类题',
  wordCompose:     '词组选配题',
  ratingScale:     '星级量表',
  workUpload:      '作品上传',
  knowledgeReview: '知识回顾',
  promptPractice:  'Prompt 练习',
  materialGroup:   '材料组合题',
}

export const SURVEY_ALLOWED_TYPES: QuestionType[] = [
  'singleChoice', 'multipleChoice', 'shortAnswer', 'workUpload', 'ratingScale',
]
export const ASSESSMENT_ALLOWED_TYPES: QuestionType[] = [
  'singleChoice', 'multipleChoice', 'shortAnswer', 'fillBlank', 'judge',
  'sort', 'classify', 'materialGroup', 'knowledgeReview', 'promptPractice',
]

/** 重新导出 Dimension 方便外部使用（保持兼容） */
export type { Dimension }
