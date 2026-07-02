import type {
  AnswerValue,
  Question,
  SingleChoiceQuestion,
  MultipleChoiceQuestion,
  JudgeQuestion,
  FillBlankQuestion,
  ShortAnswerQuestion,
  SortQuestion,
  ClassifyQuestion,
  WordComposeQuestion,
  RatingScaleQuestion,
  WorkUploadQuestion,
  KnowledgeReviewQuestion,
  PromptPracticeQuestion,
  MaterialGroupQuestion,
} from '@/types'

/** 所有题型 Renderer 的统一 props */
export interface RendererProps<Q extends Question = Question> {
  question: Q
  value: AnswerValue
  onChange: (next: AnswerValue) => void
  /** 是否为只读（如查看结果时） */
  readOnly?: boolean
}

/* —— 各题型 props 的具象别名 —— */
export type SingleRendererProps   = RendererProps<SingleChoiceQuestion>
export type MultipleRendererProps = RendererProps<MultipleChoiceQuestion>
export type JudgeRendererProps    = RendererProps<JudgeQuestion>
export type FillRendererProps     = RendererProps<FillBlankQuestion>
export type ShortRendererProps    = RendererProps<ShortAnswerQuestion>
export type SortRendererProps     = RendererProps<SortQuestion>
export type ClassifyRendererProps = RendererProps<ClassifyQuestion>
export type MatchRendererProps    = RendererProps<WordComposeQuestion>
export type RatingRendererProps   = RendererProps<RatingScaleQuestion>
export type WorkUploadRendererProps = RendererProps<WorkUploadQuestion>
export type ReviewRendererProps   = RendererProps<KnowledgeReviewQuestion>
export type PromptRendererProps   = RendererProps<PromptPracticeQuestion>
export type MaterialGroupRendererProps = RendererProps<MaterialGroupQuestion>

