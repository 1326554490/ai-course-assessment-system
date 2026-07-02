import type { Question, AnswerValue } from '@/types'
import { SingleRenderer } from './SingleRenderer'
import { MultipleRenderer } from './MultipleRenderer'
import { JudgeRenderer } from './JudgeRenderer'
import { FillRenderer } from './FillRenderer'
import { ShortRenderer } from './ShortRenderer'
import { SortRenderer } from './SortRenderer'
import { ClassifyRenderer } from './ClassifyRenderer'
import { MatchRenderer } from './MatchRenderer'
import { RatingRenderer } from './RatingRenderer'
import { WorkUploadRenderer } from './WorkUploadRenderer'
import { KnowledgeReviewRenderer } from './KnowledgeReviewRenderer'
import { PromptPracticeRenderer } from './PromptPracticeRenderer'
import { MaterialGroupRenderer } from './MaterialGroupRenderer'

interface Props {
  question: Question
  value: AnswerValue
  onChange: (next: AnswerValue) => void
  readOnly?: boolean
}

/**
 * 题型分发器：根据 question.type 渲染对应的题型组件。
 * 题干配图（question.images）在所有题型上方统一展示，实现图文结合。
 */
export function QuestionRenderer({ question, value, onChange, readOnly }: Props) {
  const images = (question as any).images as string[] | undefined
  return (
    <div>
      {images && images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`题图 ${i + 1}`}
              className="max-h-44 rounded-lg border border-ink-200 object-contain bg-ink-50"
            />
          ))}
        </div>
      )}
      {renderBody({ question, value, onChange, readOnly })}
    </div>
  )
}

function renderBody({ question, value, onChange, readOnly }: Props) {
  switch (question.type) {
    case 'singleChoice':
      return <SingleRenderer question={question} value={value} onChange={onChange} readOnly={readOnly} />
    case 'multipleChoice':
      return <MultipleRenderer question={question} value={value} onChange={onChange} readOnly={readOnly} />
    case 'judge':
      return <JudgeRenderer question={question} value={value} onChange={onChange} readOnly={readOnly} />
    case 'fillBlank':
      return <FillRenderer question={question} value={value} onChange={onChange} readOnly={readOnly} />
    case 'shortAnswer':
      return <ShortRenderer question={question} value={value} onChange={onChange} readOnly={readOnly} />
    case 'sort':
      return <SortRenderer question={question} value={value} onChange={onChange} readOnly={readOnly} />
    case 'classify':
      return <ClassifyRenderer question={question} value={value} onChange={onChange} readOnly={readOnly} />
    case 'wordCompose':
      return <MatchRenderer question={question} value={value} onChange={onChange} readOnly={readOnly} />
    case 'ratingScale':
      return <RatingRenderer question={question} value={value} onChange={onChange} readOnly={readOnly} />
    case 'workUpload':
      return <WorkUploadRenderer question={question} value={value} onChange={onChange} readOnly={readOnly} />
    case 'knowledgeReview':
      return <KnowledgeReviewRenderer question={question} value={value} onChange={onChange} readOnly={readOnly} />
    case 'promptPractice':
      return <PromptPracticeRenderer question={question} value={value} onChange={onChange} readOnly={readOnly} />
    case 'materialGroup':
      return <MaterialGroupRenderer question={question} value={value} onChange={onChange} readOnly={readOnly} />
  }
}

export {
  SingleRenderer,
  MultipleRenderer,
  JudgeRenderer,
  FillRenderer,
  ShortRenderer,
  SortRenderer,
  ClassifyRenderer,
  MatchRenderer,
  RatingRenderer,
  WorkUploadRenderer,
  KnowledgeReviewRenderer,
  PromptPracticeRenderer,
  MaterialGroupRenderer,
}
