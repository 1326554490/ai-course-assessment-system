/**
 * Mock 学生提交（基于新 StudentSubmission + Activity 结构）
 *
 * 规则：
 * - 30 名学生（MOCK_STUDENTS 全员）
 * - 每个学生对每个 Activity 节点都有 80% 概率提交
 * - 测评类的总分按"个人能力 + 题目难度"模拟（个人能力影响每题对错概率）
 * - 学生进度（MOCK_PROGRESS）只生成"当前学生 stu-01"的，其他学生仅在提交中体现
 */

import type {
  Activity,
  AnswerValue,
  QuestionAnswer,
  Question,
  StudentSubmission,
  StudentProgress,
} from '@/types'
import { MOCK_ACTIVITIES, MOCK_COURSES } from './courses'
import { MOCK_STUDENTS } from './students'

const NOW = Date.now()
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

function ago(ms: number): string {
  return new Date(NOW - ms).toISOString()
}

/** 简单可重复的伪随机：基于 (studentId, activityId) 字符串 hash */
function hashSeed(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}
function rand01(seed: number, salt: number): number {
  const v = Math.sin(seed * 9301 + salt * 49297 + 233280) * 0.5 + 0.5
  return v - Math.floor(v)
}

/* ====================================================================
 * 找到每个节点 → 活动 → 课程/课节上下文的映射
 * ==================================================================== */
type NodeCtx = {
  courseId: string
  lessonId: string
  nodeId: string
  activityId: string
  activity: Activity
}
const NODE_CTX: NodeCtx[] = []
for (const c of MOCK_COURSES) {
  for (const l of c.lessons) {
    for (const n of l.nodes) {
      if (!n.activityId) continue
      const activity = MOCK_ACTIVITIES.find((a) => a.id === n.activityId)
      if (!activity) continue
      NODE_CTX.push({
        courseId: c.id,
        lessonId: l.id,
        nodeId: n.id,
        activityId: activity.id,
        activity,
      })
    }
  }
}

/* ====================================================================
 * 学生"能力值"：决定对错概率（0.4 ~ 0.95）
 * stu-01 是当前学生，给个偏中上的值
 * ==================================================================== */
function studentAbility(studentId: string): number {
  if (studentId === 'stu-01') return 0.85
  const seed = hashSeed(studentId)
  return 0.4 + (seed % 100) / 100 * 0.55 // 0.4 ~ 0.95
}

/* ====================================================================
 * 为单道题生成"作答 + 是否正确"
 * ==================================================================== */
function makeAnswerForQuestion(
  q: Question,
  ability: number,
  seed: number,
  qi: number,
): QuestionAnswer {
  const shouldCorrect = rand01(seed, qi) < ability

  let value: AnswerValue
  let correct = shouldCorrect
  let score = 0

  switch (q.type) {
    case 'singleChoice': {
      const correctId = q.answer
      if (shouldCorrect && correctId) {
        value = { type: 'singleChoice', optionId: correctId }
      } else {
        const wrongPool = q.options.filter((o) => o.id !== correctId)
        const pickId = wrongPool[qi % wrongPool.length]?.id ?? null
        value = { type: 'singleChoice', optionId: pickId }
        correct = false
      }
      score = correct ? (q.score ?? 0) : 0
      break
    }
    case 'multipleChoice': {
      const correctIds = q.answer ?? []
      if (shouldCorrect) {
        value = { type: 'multipleChoice', optionIds: [...correctIds] }
        score = q.score ?? 0
      } else {
        // 故意少选一个，触发 partial
        const partial = correctIds.slice(0, Math.max(1, correctIds.length - 1))
        value = { type: 'multipleChoice', optionIds: partial }
        correct = false
        if (q.scoreMode === 'partial' && correctIds.length > 0) {
          score = Math.round((q.score ?? 0) * partial.length / correctIds.length)
        } else {
          score = 0
        }
      }
      break
    }
    case 'judge': {
      const correctAns = q.answer
      const ans = shouldCorrect ? correctAns : !correctAns
      value = { type: 'judge', value: ans ?? null }
      score = correct ? (q.score ?? 0) : 0
      break
    }
    case 'fillBlank': {
      const std = q.answer ?? []
      const blanks = std.map((accepts, bi) =>
        shouldCorrect ? (accepts[0] ?? '') : `错答${bi}`,
      )
      value = { type: 'fillBlank', blanks }
      score = correct ? (q.score ?? 0) : 0
      break
    }
    case 'shortAnswer': {
      const samples = [
        '比如盲人导航 App 借助 AI 识别物体，帮助视障人士。',
        'AI 可以帮医生快速看 X 光片。',
        '智能垃圾分类，让分类更准确。',
        '帮助保护珍稀动物识别个体。',
      ]
      value = { type: 'shortAnswer', text: samples[seed % samples.length] }
      // 简答题不自动判分
      correct = false
      score = 0
      break
    }
    case 'sort': {
      const std = q.answer ?? q.items.map((it) => it.id)
      value = {
        type: 'sort',
        order: shouldCorrect ? [...std] : [...std].reverse(),
      }
      score = correct ? (q.score ?? 0) : 0
      break
    }
    case 'classify': {
      const correctMap = q.answer ?? {}
      const mapping: Record<string, string> = {}
      let hit = 0
      q.items.forEach((it, k) => {
        const wrong = !shouldCorrect && k % 3 === 0
        if (!wrong) {
          mapping[it.id] = correctMap[it.id] ?? q.categories[0]?.id ?? ''
          hit++
        } else {
          const others = q.categories.filter((c) => c.id !== correctMap[it.id])
          mapping[it.id] = others[0]?.id ?? correctMap[it.id] ?? ''
        }
      })
      value = { type: 'classify', mapping }
      correct = hit === q.items.length
      score = q.items.length === 0
        ? 0
        : Math.round((q.score ?? 0) * (hit / q.items.length))
      break
    }
    case 'wordCompose': {
      const std = q.answer ?? []
      if (shouldCorrect) {
        value = { type: 'wordCompose', pairs: std.map((p) => ({ ...p })) }
        score = q.score ?? 0
      } else {
        // 随机错一对
        const half = std.slice(0, Math.max(0, std.length - 1))
        const lastL = std[std.length - 1]?.leftId
        const lastR = std[std.length - 2]?.rightId
        const pairs = [...half]
        if (lastL && lastR) pairs.push({ leftId: lastL, rightId: lastR })
        value = { type: 'wordCompose', pairs }
        correct = false
        const hit = pairs.filter((p) =>
          std.some((sp) => sp.leftId === p.leftId && sp.rightId === p.rightId),
        ).length
        score = std.length === 0 ? 0 : Math.round((q.score ?? 0) * hit / std.length)
      }
      break
    }
  }

  return { questionId: q.id, value: value!, score, correct }
}

/* ====================================================================
 * 主流程：生成 30 学生 × 所有活动的提交
 * ==================================================================== */
const submissions: StudentSubmission[] = []

MOCK_STUDENTS.forEach((stu, stuIdx) => {
  const ability = studentAbility(stu.id)
  NODE_CTX.forEach((ctx, ctxIdx) => {
    const seed = hashSeed(stu.id + ':' + ctx.activityId)
    // 当前学生（stu-01）只完成"前 5 个活动"，模拟"学到一半"
    if (stu.id === 'stu-01' && ctxIdx >= 5) return
    // 其他学生 80% 概率完成每个活动
    if (stu.id !== 'stu-01' && rand01(seed, 999) > 0.8) return

    const activity = ctx.activity
    const questions = activity.questions ?? []
    const qaList: QuestionAnswer[] = questions.map((q, qi) =>
      makeAnswerForQuestion(q, ability, seed, qi),
    )

    const totalScore = qaList.reduce((s, a) => s + (a.score ?? 0), 0)
    const correctCount = qaList.filter((a) => a.correct).length
    const correctRate = questions.length === 0 ? 0 : correctCount / questions.length

    // 维度分（仅 assessment）
    let dimensionScores: Record<string, number> | undefined
    if (activity.type === 'assessment' && activity.dimensions && activity.dimensions.length) {
      dimensionScores = {}
      activity.dimensions.forEach((d) => {
        const qs = questions.filter((q) => (q.dimensions ?? []).includes(d.id))
        let earned = 0, full = 0
        qs.forEach((q) => {
          full += q.score ?? 0
          const a = qaList.find((x) => x.questionId === q.id)
          earned += a?.score ?? 0
        })
        dimensionScores![d.id] = full === 0 ? 0 : earned / full
      })
    }

    submissions.push({
      id: `sub-${stu.id}-${activity.id}`,
      studentId: stu.id,
      activityId: activity.id,
      lessonNodeId: ctx.nodeId,
      courseId: ctx.courseId,
      lessonId: ctx.lessonId,
      answers: qaList,
      score: activity.type === 'assessment' ? totalScore : undefined,
      correctRate: activity.type === 'assessment' ? correctRate : undefined,
      dimensionScores,
      durationSec: 60 + (stuIdx * 17 + ctxIdx * 13) % 720,
      submittedAt: ago((stuIdx % 7 + 1) * DAY + ctxIdx * HOUR),
      status: 'submitted',
    })
  })
})

export const MOCK_SUBMISSIONS: StudentSubmission[] = submissions

/* ====================================================================
 * 学生进度：仅给 stu-01 预置
 * ==================================================================== */
export const MOCK_PROGRESS: StudentProgress[] = [
  // course-01 / lesson-c1-01：已完成 4 节点，停留在 feedback（第 5）
  {
    studentId: 'stu-01',
    courseId: 'course-01',
    lessonId: 'lesson-c1-01',
    currentNodeId: 'node-c1l1-05',
    completedNodeIds: ['node-c1l1-01', 'node-c1l1-02', 'node-c1l1-03', 'node-c1l1-04'],
    lastStudyAt: ago(2 * HOUR),
  },
  // course-01 / lesson-c1-02：完成 2 / 5
  {
    studentId: 'stu-01',
    courseId: 'course-01',
    lessonId: 'lesson-c1-02',
    currentNodeId: 'node-c1l2-03',
    completedNodeIds: ['node-c1l2-01', 'node-c1l2-02'],
    lastStudyAt: ago(1 * DAY),
  },
  // course-02 / lesson-c2-01：完成 1 / 4
  {
    studentId: 'stu-01',
    courseId: 'course-02',
    lessonId: 'lesson-c2-01',
    currentNodeId: 'node-c2l1-02',
    completedNodeIds: ['node-c2l1-01'],
    lastStudyAt: ago(3 * DAY),
  },
]

/* ====== 旧导出名兼容 ====== */
export const MOCK_NODE_SUBMISSIONS = MOCK_SUBMISSIONS
