/**
 * 答案工具：
 * - createEmptyAnswer：根据题目生成"空白答案"，用于初始化
 * - isAnswered：是否已作答
 * - gradeAnswer：根据题目和答案计算得分（仅测评）
 * - summarize：汇总一组题目的总分与正确率
 *
 * 题型枚举与 answer 字段已升级为新版：
 *   singleChoice / multipleChoice / judge /
 *   fillBlank / shortAnswer / sort / classify / wordCompose
 */
import type {
  AnswerValue,
  Question,
  QuestionAnswer,
  ClassifyQuestion,
  WordComposeQuestion,
  SortQuestion,
  MaterialGroupQuestion,
} from '@/types'

export function createEmptyAnswer(q: Question): AnswerValue {
  switch (q.type) {
    case 'singleChoice':
      return { type: 'singleChoice', optionId: null }
    case 'multipleChoice':
      return { type: 'multipleChoice', optionIds: [] }
    case 'judge':
      return { type: 'judge', value: null }
    case 'fillBlank':
      return { type: 'fillBlank', blanks: Array((q.blanks ?? 1)).fill('') }
    case 'shortAnswer':
      return { type: 'shortAnswer', text: '' }
    case 'sort':
      return { type: 'sort', order: (q as SortQuestion).items.map((it) => it.id) }
    case 'classify':
      return { type: 'classify', mapping: {} }
    case 'wordCompose':
      return { type: 'wordCompose', pairs: [] }
    case 'ratingScale':
      return { type: 'ratingScale', value: null }
    case 'workUpload':
      return { type: 'workUpload', fileName: null, note: '' }
    case 'knowledgeReview':
      return { type: 'knowledgeReview', viewedCardIds: [] }
    case 'promptPractice':
      return { type: 'promptPractice', text: '' }
    case 'materialGroup':
      return { type: 'materialGroup', answers: {} }
  }
}

/** 判断答案是否"已作答" */
export function isAnswered(q: Question, v: AnswerValue): boolean {
  switch (v.type) {
    case 'singleChoice':   return v.optionId != null
    case 'multipleChoice': return v.optionIds.length > 0
    case 'judge':          return v.value !== null
    case 'fillBlank':      return v.blanks.some((b) => b.trim().length > 0)
    case 'shortAnswer':    return v.text.trim().length > 0
    case 'sort':           return v.order.length === (q as SortQuestion).items.length
    case 'classify': {
      const total = (q as ClassifyQuestion).items.length
      return Object.keys(v.mapping).length === total
    }
    case 'wordCompose': {
      const total = (q as WordComposeQuestion).leftItems.length
      return v.pairs.length === total
    }
    case 'ratingScale':     return v.value != null
    case 'workUpload':      return v.fileName != null || v.note.trim().length > 0
    case 'knowledgeReview': return v.viewedCardIds.length > 0
    case 'promptPractice':  return v.text.trim().length > 0
    case 'materialGroup': {
      const subs = (q as MaterialGroupQuestion).subQuestions ?? []
      return subs.length > 0 && subs.every((s) => v.answers[s.id] != null)
    }
  }
}

/* ============================================================
 * 判分（仅测评）
 * ============================================================ */

function arrayEqualUnordered(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sb = new Set(b)
  return a.every((x) => sb.has(x))
}

function arrayEqualOrdered(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  return a.every((x, i) => x === b[i])
}

export function gradeAnswer(
  q: Question,
  v: AnswerValue,
): { score: number; correct: boolean } {
  const full = q.score ?? 0
  switch (q.type) {
    case 'singleChoice': {
      if (v.type !== 'singleChoice') return { score: 0, correct: false }
      // composite 模式：v.optionId 是 JSON 字符串 { subQid: optionId, ... }
      if (q.optionStyle === 'composite' && q.subQuestions) {
        const subAnswers: Record<string, string> = v.optionId
          ? (JSON.parse(v.optionId) as Record<string, string>)
          : {}
        const perSub = full / q.subQuestions.length
        let gained = 0
        let allOk = true
        q.subQuestions.forEach((sub) => {
          const correct = sub.answer && subAnswers[sub.id] === sub.answer
          if (correct) gained += perSub
          else allOk = false
        })
        return { score: Math.round(gained), correct: allOk }
      }
      // 常规模式
      const ok = !!q.answer && v.optionId === q.answer
      return { score: ok ? full : 0, correct: ok }
    }
    case 'multipleChoice': {
      if (v.type !== 'multipleChoice') return { score: 0, correct: false }
      const correctIds = q.answer ?? []
      const chosen = v.optionIds
      const allRight = arrayEqualUnordered(chosen, correctIds)
      if (q.scoreMode === 'partial') {
        const wrongChosen = chosen.filter((id) => !correctIds.includes(id))
        if (wrongChosen.length > 0) return { score: 0, correct: false }
        const rightHit = chosen.filter((id) => correctIds.includes(id)).length
        const ratio = correctIds.length === 0 ? 0 : rightHit / correctIds.length
        return { score: Math.round(full * ratio), correct: allRight }
      }
      return { score: allRight ? full : 0, correct: allRight }
    }
    case 'judge': {
      if (v.type !== 'judge') return { score: 0, correct: false }
      const ok = q.answer != null && v.value === q.answer
      return { score: ok ? full : 0, correct: ok }
    }
    case 'fillBlank': {
      if (v.type !== 'fillBlank') return { score: 0, correct: false }
      const std = q.answer ?? []
      if (std.length === 0) return { score: 0, correct: false }
      const fuzzy = (q as any).fuzzyMatch === true
      const perBlank = full / std.length
      let gained = 0
      let allOk = true
      std.forEach((accepts, i) => {
        const stu = (v.blanks[i] ?? '').trim()
        const exact = accepts.some((a) => a.trim() === stu)
        if (exact) {
          gained += perBlank
        } else if (fuzzy && stu.length > 0) {
          // 错别字容错：长度相同 + 仅 1 字差异 → 半分
          const closeHit = accepts.some((a) => {
            const A = a.trim()
            if (A.length !== stu.length || A.length === 0) return false
            let diff = 0
            for (let k = 0; k < A.length; k++) if (A[k] !== stu[k]) diff++
            return diff === 1
          })
          if (closeHit) {
            gained += perBlank / 2
            allOk = false
          } else {
            allOk = false
          }
        } else {
          allOk = false
        }
      })
      return { score: Math.round(gained), correct: allOk }
    }
    case 'shortAnswer': {
      // 简答题：自动判分不可靠，默认 0 分；老师可人工修正
      return { score: 0, correct: false }
    }
    case 'sort': {
      if (v.type !== 'sort') return { score: 0, correct: false }
      const std = q.answer ?? []
      if (std.length === 0) return { score: 0, correct: false }
      // 部分得分：逐位置对比，对了几个就得几个的分
      let hit = 0
      std.forEach((id, i) => {
        if (v.order[i] === id) hit++
      })
      const ratio = hit / std.length
      const correct = hit === std.length
      return { score: Math.round(full * ratio), correct }
    }
    case 'classify': {
      if (v.type !== 'classify') return { score: 0, correct: false }
      const items = q.items
      if (items.length === 0) return { score: 0, correct: false }
      const correctMap = q.answer ?? {}
      let hit = 0
      items.forEach((it) => {
        const correctCat = correctMap[it.id]
        if (correctCat && v.mapping[it.id] === correctCat) hit++
      })
      const ratio = hit / items.length
      return { score: Math.round(full * ratio), correct: hit === items.length }
    }
    case 'wordCompose': {
      if (v.type !== 'wordCompose') return { score: 0, correct: false }
      const std = q.answer ?? []
      if (std.length === 0) return { score: 0, correct: false }
      let hit = 0
      std.forEach((p) => {
        if (v.pairs.some((sp) => sp.leftId === p.leftId && sp.rightId === p.rightId)) hit++
      })
      const ratio = hit / std.length
      const correct = hit === std.length
      return { score: Math.round(full * ratio), correct }
    }
    case 'materialGroup': {
      if (v.type !== 'materialGroup') return { score: 0, correct: false }
      const subs = q.subQuestions ?? []
      if (subs.length === 0) return { score: 0, correct: false }
      let hit = 0
      subs.forEach((s) => {
        if (s.answer && v.answers[s.id] === s.answer) hit++
      })
      const ratio = hit / subs.length
      return { score: Math.round(full * ratio), correct: hit === subs.length }
    }
    default:
      return { score: 0, correct: false }
  }
}

export function summarize(
  questions: Question[],
  answers: QuestionAnswer[],
): { totalScore: number; correctRate: number } {
  let total = 0
  let correctCount = 0
  questions.forEach((q) => {
    const ans = answers.find((a) => a.questionId === q.id)
    if (!ans) return
    total += ans.score ?? 0
    if (ans.correct) correctCount++
  })
  return {
    totalScore: total,
    correctRate: questions.length === 0 ? 0 : correctCount / questions.length,
  }
}
